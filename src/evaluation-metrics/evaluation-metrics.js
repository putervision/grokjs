/**
 * EvaluationMetrics class offering standardized NLP evaluation algorithms:
 * Perplexity, BLEU (with brevity penalty), ROUGE-L, Precision/Recall/F1, and Accuracy.
 */
class EvaluationMetrics {
  /**
   * Calculates perplexity of a LanguageModel on a given text.
   * @param {Object} model - LanguageModel instance with getProbability() and tokenize()
   * @param {string} text - Test text string
   * @return {number} - Perplexity score (lower is better, >= 1.0)
   */
  static perplexity(model, text) {
    if (!model || typeof text !== "string" || text.trim().length === 0) {
      return NaN;
    }

    const tokens = model.tokenize
      ? model.tokenize(text)
      : text.trim().split(/\s+/);
    if (tokens.length === 0) return NaN;

    let logProbSum = 0;
    const maxN = model.maxN || 5;

    for (let i = 0; i < tokens.length; i++) {
      const contextTokens = tokens.slice(Math.max(0, i - maxN + 1), i);
      const context = contextTokens.join(" ");
      const prob = model.getProbability
        ? model.getProbability(tokens[i], context)
        : 0.001;

      if (prob > 0) {
        logProbSum += Math.log(prob);
      } else {
        logProbSum += Math.log(Number.EPSILON);
      }
    }

    return Math.exp(-logProbSum / tokens.length);
  }

  /**
   * Calculates BLEU score for candidate tokens against reference tokens.
   * Supports 1-gram up to maxN-gram precisions with brevity penalty.
   * @param {string[]} candidate - Candidate token array
   * @param {string[]} reference - Reference token array
   * @param {number} [maxN=4] - Max N-gram level
   * @return {number} - BLEU score [0.0, 1.0]
   */
  static bleu(candidate, reference, maxN = 4) {
    if (!Array.isArray(candidate) || !Array.isArray(reference)) return 0;
    if (candidate.length === 0 || reference.length === 0) return 0;

    let logPrecisionSum = 0;
    const effectiveN = Math.min(maxN, candidate.length, reference.length);

    for (let n = 1; n <= effectiveN; n++) {
      const candNgrams = EvaluationMetrics._getNgrams(candidate, n);
      const refNgrams = EvaluationMetrics._getNgrams(reference, n);

      if (candNgrams.size === 0) continue;

      let clippedMatches = 0;
      let totalCandNgrams = 0;

      for (const [ngram, candCount] of candNgrams) {
        const refCount = refNgrams.get(ngram) || 0;
        clippedMatches += Math.min(candCount, refCount);
        totalCandNgrams += candCount;
      }

      const precision =
        totalCandNgrams > 0 ? clippedMatches / totalCandNgrams : 0;
      logPrecisionSum +=
        precision > 0 ? Math.log(precision) : Math.log(Number.EPSILON);
    }

    const geoMeanPrecision = Math.exp(logPrecisionSum / effectiveN);

    // Brevity Penalty (BP)
    const c = candidate.length;
    const r = reference.length;
    const bp = c > r ? 1.0 : Math.exp(1 - r / c);

    return bp * geoMeanPrecision;
  }

  /**
   * Calculates ROUGE-L score based on Longest Common Subsequence (LCS).
   * @param {string[]} candidate - Candidate token array
   * @param {string[]} reference - Reference token array
   * @return {number} - ROUGE-L score [0.0, 1.0]
   */
  static rougeL(candidate, reference) {
    if (!Array.isArray(candidate) || !Array.isArray(reference)) return 0;
    if (candidate.length === 0 || reference.length === 0) return 0;

    const lcsLength = EvaluationMetrics._lcsLength(candidate, reference);

    const precision = lcsLength / candidate.length;
    const recall = lcsLength / reference.length;

    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  }

  /**
   * Computes Precision, Recall, and F1 Score between predicted and actual token lists.
   * @param {string[]} predicted - Predicted tokens
   * @param {string[]} actual - Actual / Reference tokens
   * @return {{ precision: number, recall: number, f1Score: number }} - Metrics object
   */
  static precisionRecallF1(predicted, actual) {
    if (!Array.isArray(predicted) || !Array.isArray(actual)) {
      return { precision: 0, recall: 0, f1Score: 0 };
    }
    if (predicted.length === 0 || actual.length === 0) {
      return { precision: 0, recall: 0, f1Score: 0 };
    }

    const predSet = new Set(predicted);
    const actualSet = new Set(actual);

    let tp = 0;
    for (const item of predSet) {
      if (actualSet.has(item)) tp++;
    }

    const precision = tp / predSet.size;
    const recall = tp / actualSet.size;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    return { precision, recall, f1Score };
  }

  /**
   * Computes exact match prediction accuracy.
   * @param {string[]} predicted - Array of predicted tokens
   * @param {string[]} actual - Array of target reference tokens
   * @return {number} - Accuracy score [0.0, 1.0]
   */
  static accuracy(predicted, actual) {
    if (!Array.isArray(predicted) || !Array.isArray(actual)) return 0;
    if (predicted.length === 0 || actual.length === 0) return 0;

    const minLen = Math.min(predicted.length, actual.length);
    let correct = 0;

    for (let i = 0; i < minLen; i++) {
      if (predicted[i] === actual[i]) correct++;
    }

    return correct / Math.max(predicted.length, actual.length);
  }

  static _getNgrams(tokens, n) {
    const map = new Map();
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(" ");
      map.set(ngram, (map.get(ngram) || 0) + 1);
    }
    return map;
  }

  static _lcsLength(seqA, seqB) {
    const m = seqA.length;
    const n = seqB.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (seqA[i - 1] === seqB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}

module.exports = EvaluationMetrics;
