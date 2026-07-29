const Tokenizer = require("../tokenizer/tokenizer");

/**
 * AttentionMechanism class for computing N-gram relevance, heuristic attention weights,
 * and generating attention heatmaps across sequences.
 *
 * Note: Uses heuristic-based attention visualization (position × length weighting with
 * distance penalties). This is useful for understanding token importance patterns but
 * does not use learned attention weights from a transformer model. For production
 * attention weights, integrate with a trained transformer model.
 */
class AttentionMechanism {
  /**
   * Constructs an AttentionMechanism instance.
   * @param {number} [maxN=5] - Maximum N-gram context size to consider
   */
  constructor(maxN = 5) {
    this.maxN = maxN;
    this.tokenizer = new Tokenizer();
  }

  /**
   * Computes normalized self-attention weights across an array of tokens.
   * @param {string[]} tokens - Tokens to compute weights for
   * @return {number[]} - Array of normalized attention weights summing to 1.0
   */
  computeWeights(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return [];

    if (tokens.length === 1) return [1.0];

    // Compute raw importance score based on token position, length, and context position
    const rawWeights = tokens.map((token, index) => {
      // Prioritize tokens toward the tail of sequence and non-trivial words
      const positionWeight = 0.5 + (index / tokens.length) * 0.5;
      const lengthWeight = Math.min(1.5, Math.max(0.5, token.length / 5));
      return positionWeight * lengthWeight;
    });

    const sum = rawWeights.reduce((acc, w) => acc + w, 0);
    return rawWeights.map((w) => (sum > 0 ? w / sum : 1 / tokens.length));
  }

  /**
   * Generates a 2D N x N attention matrix (heatmap) for a sequence of tokens.
   * Row i represents query token, Column j represents key token.
   * @param {string[]} tokens - Array of token strings
   * @return {number[][]} - 2D matrix of attention scores (each row sums to 1.0)
   */
  getHeatmap(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return [];

    const n = tokens.length;
    const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      let rowSum = 0;
      for (let j = 0; j < n; j++) {
        // Distance penalty + similarity bonus
        const distance = Math.abs(i - j);
        const distPenalty = Math.exp(-0.5 * distance);
        const charSimilarity = tokens[i] === tokens[j] ? 1.5 : 1.0;

        const score = distPenalty * charSimilarity;
        matrix[i][j] = score;
        rowSum += score;
      }

      // Softmax normalize row i
      if (rowSum > 0) {
        for (let j = 0; j < n; j++) {
          matrix[i][j] /= rowSum;
        }
      }
    }

    return matrix;
  }

  /**
   * Aggregates focus scores per token in a sequence.
   * @param {string[]} sequence - Token sequence
   * @return {Array<{ token: string, focusScore: number }>} - Tokens ranked by focus score
   */
  aggregateFocus(sequence) {
    const tokens = Array.isArray(sequence)
      ? sequence
      : this.tokenizer.tokenize(String(sequence));
    const weights = this.computeWeights(tokens);

    return tokens.map((token, i) => ({
      token: token,
      focusScore: weights[i] || 0,
    }));
  }
}

module.exports = AttentionMechanism;
