const Counter = require("../counter/counter");

/**
 * FrequencyDistribution class for managing conditional and joint N-gram counts.
 */
class FrequencyDistribution {
  constructor() {
    // Map of context string -> Counter of next tokens
    this.distributions = new Map();
  }

  /**
   * Records an occurrence of a token following a context prefix.
   * @param {string} context - The prefix context string
   * @param {string} token - The next token that followed
   * @param {number} [count=1] - Incremental count
   */
  record(context, token, count = 1) {
    if (!this.distributions.has(context)) {
      this.distributions.set(context, new Counter());
    }
    this.distributions.get(context).increment(token, count);
  }

  /**
   * Returns the count of a token in a specific context.
   * @param {string} context - Prefix context string
   * @param {string} token - Token to query
   * @return {number} - Occurrences count
   */
  count(context, token) {
    const counter = this.distributions.get(context);
    return counter ? counter.get(token) : 0;
  }

  /**
   * Returns the total occurrences of all tokens observed following a given context.
   * @param {string} context - Context string
   * @return {number} - Sum of all token counts in this context
   */
  contextTotal(context) {
    const counter = this.distributions.get(context);
    return counter ? counter.total() : 0;
  }

  /**
   * Returns the most common tokens and their counts in a given context.
   * @param {string} context - Context string
   * @param {number} [n] - Maximum number of top items to return
   * @return {Array<[string, number]>} - Array of [token, count] pairs
   */
  mostCommon(context, n) {
    const counter = this.distributions.get(context);
    return counter ? counter.mostCommon(n) : [];
  }

  /**
   * Returns an array of all registered context keys.
   * @return {string[]} - Array of context strings
   */
  allContexts() {
    return Array.from(this.distributions.keys());
  }
}

module.exports = FrequencyDistribution;
