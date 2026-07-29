const Tokenizer = require("../tokenizer/tokenizer");

/**
 * Corpus class for loading, processing, analyzing, and splitting text datasets.
 */
class Corpus {
  constructor() {
    this.documents = [];
    this.tokenizer = new Tokenizer();
  }

  /**
   * Adds a document or text passage to the corpus.
   * @param {string} doc - Document text string
   */
  addDocument(doc) {
    if (typeof doc === "string" && doc.trim().length > 0) {
      this.documents.push(doc.trim());
    }
  }

  /**
   * Returns an array of individual sentences extracted from all documents.
   * @return {string[]} - Array of sentence strings
   */
  getSentences() {
    const sentences = [];
    for (const doc of this.documents) {
      // Split on sentence-ending punctuation followed by space or newline
      const matches = doc.split(/(?<=[.!?])\s+/);
      for (const sentence of matches) {
        if (sentence.trim()) {
          sentences.push(sentence.trim());
        }
      }
    }
    return sentences;
  }

  /**
   * Returns a flattened array of all tokens in the corpus.
   * @return {string[]} - Token array
   */
  getTokens() {
    const allTokens = [];
    for (const doc of this.documents) {
      allTokens.push(...this.tokenizer.tokenize(doc));
    }
    return allTokens;
  }

  /**
   * Calculates comprehensive summary statistics for the corpus.
   * @return {Object} - Statistical summary object
   */
  getStats() {
    const sentences = this.getSentences();
    const tokens = this.getTokens();
    const uniqueTokens = new Set(tokens);

    const tokenCount = tokens.length;
    const uniqueTokenCount = uniqueTokens.size;
    const typeTokenRatio = tokenCount > 0 ? uniqueTokenCount / tokenCount : 0;

    return {
      documentCount: this.documents.length,
      sentenceCount: sentences.length,
      tokenCount: tokenCount,
      uniqueTokenCount: uniqueTokenCount,
      typeTokenRatio: typeTokenRatio,
    };
  }

  /**
   * Splits the corpus documents into train, validation, and test datasets according to specified ratios.
   * Documents are shuffled before splitting to avoid bias from ordered data.
   * @param {number} [trainRatio=0.8] - Ratio of documents for training
   * @param {number} [valRatio=0.1] - Ratio of documents for validation
   * @param {number} [testRatio=0.1] - Ratio of documents for testing
   * @return {Object} - Object containing train, val, and test document arrays
   */
  split(trainRatio = 0.8, valRatio = 0.1, testRatio = 0.1) {
    const total = trainRatio + valRatio + testRatio;
    const normTrain = trainRatio / total;
    const normVal = valRatio / total;

    // Fisher-Yates shuffle to randomize document order
    const documents = [...this.documents];
    for (let i = documents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [documents[i], documents[j]] = [documents[j], documents[i]];
    }

    const n = documents.length;
    const trainEnd = Math.floor(n * normTrain);
    const valEnd = trainEnd + Math.floor(n * normVal);

    return {
      train: documents.slice(0, trainEnd),
      val: documents.slice(trainEnd, valEnd),
      test: documents.slice(valEnd),
    };
  }
}

module.exports = Corpus;
