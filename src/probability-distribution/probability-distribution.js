const FrequencyDistribution = require("../frequency-distribution/frequency-distribution");

/**
 * ProbabilityDistribution class for estimating probabilities of words given contexts,
 * incorporating Laplace smoothing, Stupid Backoff, MLE, and temperature sampling.
 */
class ProbabilityDistribution {
  /**
   * Constructs a ProbabilityDistribution instance.
   * @param {FrequencyDistribution} [freqDist] - Optional FrequencyDistribution instance
   */
  constructor(freqDist) {
    this.freqDist = freqDist || new FrequencyDistribution();
  }

  /**
   * Calculates Maximum Likelihood Estimation (MLE) probability P(word | context).
   * @param {string} context - The prefix context
   * @param {string} word - The token to calculate probability for
   * @return {number} - MLE probability [0, 1]
   */
  mle(context, word) {
    const total = this.freqDist.contextTotal(context);
    if (total === 0) return 0;
    return this.freqDist.count(context, word) / total;
  }

  /**
   * Calculates Laplace (Add-k) smoothed probability P(word | context).
   * @param {string} context - Context string
   * @param {string} word - Target token
   * @param {number} [k=1] - Additive constant k (default 1 for Laplace)
   * @param {number} [vocabSize=10000] - Total size of vocabulary for denominator add-on
   * @return {number} - Smoothed probability
   */
  laplace(context, word, k = 1, vocabSize = 10000) {
    const count = this.freqDist.count(context, word);
    const total = this.freqDist.contextTotal(context);
    return (count + k) / (total + k * Math.max(1, vocabSize));
  }

  /**
   * Calculates Stupid Backoff score for a candidate word and tokenized context.
   * If higher-order n-gram count is 0, backs off to lower-order n-gram with penalty alpha.
   * @param {string} context - Space-joined context tokens
   * @param {string} word - Target word
   * @param {number} [alpha=0.4] - Backoff penalty multiplier
   * @return {number} - Backoff probability score
   */
  stupidBackoff(context, word, alpha = 0.4) {
    const tokens = context ? context.trim().split(/\s+/) : [];
    let currentContext = tokens.join(" ");

    while (currentContext.length > 0 || tokens.length > 0) {
      const count = this.freqDist.count(currentContext, word);
      const total = this.freqDist.contextTotal(currentContext);

      if (count > 0 && total > 0) {
        return count / total;
      }

      if (tokens.length <= 1) {
        // Fall back to unigram count across all contexts
        const unigramCount = this.freqDist.count("", word);
        const unigramTotal = this.freqDist.contextTotal("");
        if (unigramCount > 0 && unigramTotal > 0) {
          return alpha * (unigramCount / unigramTotal);
        }
        return alpha * 0.0001; // Epsilon fallback
      }

      tokens.shift(); // Backoff to shorter context tail
      currentContext = tokens.join(" ");
      alpha *= 0.4;
    }

    return 0.0001;
  }

  /**
   * Samples a next token from a context using softmax temperature scaling.
   * @param {string} context - Context string
   * @param {number} [temperature=1.0] - Sampling temperature (> 0)
   * @return {string} - Sampled token string
   */
  sample(context, temperature = 1.0) {
    const common = this.freqDist.mostCommon(context);
    if (!common || common.length === 0) return "";

    if (temperature <= 0.01) {
      // Deterministic greedy pick
      return common[0][0];
    }

    // Apply temperature adjustment to counts/scores
    const expScores = common.map(([token, count]) => ({
      token,
      score: Math.exp(Math.log(count + 1) / temperature),
    }));

    const sumExp = expScores.reduce((acc, item) => acc + item.score, 0);
    const rand = Math.random() * sumExp;

    let cumulative = 0;
    for (const item of expScores) {
      cumulative += item.score;
      if (rand <= cumulative) {
        return item.token;
      }
    }

    return common[0][0];
  }
}

module.exports = ProbabilityDistribution;
