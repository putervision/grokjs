const Counter = require("../counter/counter");

/**
 * Vocabulary class for managing token-to-integer ID mappings, special tokens,
 * and frequency-based vocabulary sizing.
 */
class Vocabulary {
  /**
   * Constructs a Vocabulary instance with special tokens.
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.unkToken="<unk>"] - Token for unknown/out-of-vocabulary words
   * @param {string} [options.bosToken="<s>"] - Beginning-of-sequence token
   * @param {string} [options.eosToken="</s>"] - End-of-sequence token
   * @param {string} [options.padToken="<pad>"] - Padding token
   */
  constructor(options = {}) {
    this.unkToken = options.unkToken || "<unk>";
    this.bosToken = options.bosToken || "<s>";
    this.eosToken = options.eosToken || "</s>";
    this.padToken = options.padToken || "<pad>";

    this.tokenToIdMap = new Map();
    this.idToTokenMap = new Map();

    // Register special tokens starting at ID 0
    this.addToken(this.padToken);
    this.addToken(this.unkToken);
    this.addToken(this.bosToken);
    this.addToken(this.eosToken);
  }

  /**
   * Adds a single token to the vocabulary if not already present.
   * @param {string} token - Token string to add
   * @return {number} - The assigned integer ID for the token
   */
  addToken(token) {
    if (typeof token !== "string" || !token) return this.lookup(this.unkToken);
    if (!this.tokenToIdMap.has(token)) {
      const newId = this.tokenToIdMap.size;
      this.tokenToIdMap.set(token, newId);
      this.idToTokenMap.set(newId, token);
      return newId;
    }
    return this.tokenToIdMap.get(token);
  }

  /**
   * Builds the vocabulary from an array of tokens, filtering out tokens below minFreq.
   * @param {string[]} tokens - Tokens to populate vocabulary from
   * @param {number} [minFreq=1] - Minimum occurrence frequency required to include token
   */
  buildFromTokens(tokens, minFreq = 1) {
    if (!Array.isArray(tokens)) return;
    const counter = new Counter(tokens);
    for (const [token, count] of counter.counter) {
      if (count >= minFreq) {
        this.addToken(token);
      }
    }
  }

  /**
   * Converts an array of token strings into an array of integer IDs.
   * Unrecognized tokens map to the UNK token ID.
   * @param {string[]} tokens - Array of token strings
   * @return {number[]} - Array of assigned IDs
   */
  encode(tokens) {
    if (!Array.isArray(tokens)) return [];
    return tokens.map((token) => this.lookup(token));
  }

  /**
   * Converts an array of integer IDs back into token strings.
   * @param {number[]} ids - Array of token IDs
   * @return {string[]} - Array of decoded token strings
   */
  decode(ids) {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => this.lookupId(id));
  }

  /**
   * Retrieves the integer ID for a token string, returning UNK ID if not found.
   * @param {string} token - Token to lookup
   * @return {number} - Token ID
   */
  lookup(token) {
    if (this.tokenToIdMap.has(token)) {
      return this.tokenToIdMap.get(token);
    }
    return this.tokenToIdMap.get(this.unkToken);
  }

  /**
   * Retrieves the token string for an integer ID, returning UNK token if not found.
   * @param {number} id - Token ID to lookup
   * @return {string} - Token string
   */
  lookupId(id) {
    if (this.idToTokenMap.has(id)) {
      return this.idToTokenMap.get(id);
    }
    return this.unkToken;
  }

  /**
   * Returns total size of the vocabulary including special tokens.
   * @return {number} - Total vocabulary size
   */
  size() {
    return this.tokenToIdMap.size;
  }
}

module.exports = Vocabulary;
