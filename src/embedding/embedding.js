const Tokenizer = require("../tokenizer/tokenizer");

/**
 * Embedding class for constructing co-occurrence based vector space representations,
 * computing word similarities, and performing vector arithmetic.
 *
 * Note: Uses co-occurrence matrices with hash projection for dimensionality reduction.
 * This provides basic semantic similarity but is not suitable for production-quality
 * word vectors. For production use, consider training with larger corpora or using
 * pre-trained embeddings (Word2Vec, GloVe).
 */
class Embedding {
  /**
   * Constructs an Embedding instance.
   * @param {number} [dimensions=10] - Number of vector dimensions
   */
  constructor(dimensions = 10) {
    this.dimensions = dimensions;
    // Map of word string -> number[] vector
    this.vectors = new Map();
    this.tokenizer = new Tokenizer();
  }

  /**
   * Builds dense embeddings from a corpus of texts using co-occurrence matrices.
   * @param {string[]} corpus - Array of document or sentence texts
   * @param {number} [dimensions] - Optional dimensions override
   */
  build(corpus, dimensions) {
    if (dimensions) this.dimensions = dimensions;
    if (!Array.isArray(corpus)) return;

    // Collect vocabulary and co-occurrence counts
    const vocabSet = new Set();
    const coOccurrence = new Map();

    for (const text of corpus) {
      const tokens = this.tokenizer.tokenize(text);
      for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];
        vocabSet.add(word);

        if (!coOccurrence.has(word)) {
          coOccurrence.set(word, new Map());
        }

        // Window of size 3
        const start = Math.max(0, i - 3);
        const end = Math.min(tokens.length, i + 4);
        for (let j = start; j < end; j++) {
          if (i !== j) {
            const contextWord = tokens[j];
            const targetMap = coOccurrence.get(word);
            targetMap.set(contextWord, (targetMap.get(contextWord) || 0) + 1);
          }
        }
      }
    }

    const vocabList = Array.from(vocabSet);
    this.vectors.clear();

    // Map co-occurrence rows into fixed dimension vectors via hash projection
    for (const word of vocabList) {
      const vector = new Array(this.dimensions).fill(0);
      const targetMap = coOccurrence.get(word);

      if (targetMap) {
        for (const [ctxWord, count] of targetMap) {
          const hash = this._hashString(ctxWord) % this.dimensions;
          vector[hash] += count;
        }
      }

      // Normalize to unit length
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      const normalized =
        magnitude > 0 ? vector.map((v) => v / magnitude) : this._pseudoRandomVector(word);

      this.vectors.set(word, normalized);
    }
  }

  /**
   * Returns the vector representation for a word.
   * @param {string} word - Target word
   * @return {number[]} - Normalized vector
   */
  getVector(word) {
    if (typeof word !== "string") return this._pseudoRandomVector("");
    if (this.vectors.has(word)) {
      return this.vectors.get(word);
    }
    const wordLower = word.toLowerCase();
    if (this.vectors.has(wordLower)) {
      return this.vectors.get(wordLower);
    }
    return this._pseudoRandomVector(wordLower);
  }

  /**
   * Calculates cosine similarity between two words (-1 to 1).
   * @param {string} wordA - First word
   * @param {string} wordB - Second word
   * @return {number} - Cosine similarity
   */
  cosineSimilarity(wordA, wordB) {
    const vecA = this.getVector(wordA);
    const vecB = this.getVector(wordB);

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < this.dimensions; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    const norm = Math.sqrt(magA) * Math.sqrt(magB);
    return norm > 0 ? dot / norm : 0;
  }

  /**
   * Finds top N most similar words to a target word.
   * @param {string} word - Target word
   * @param {number} [topN=5] - Number of top results to return
   * @return {Array<{ word: string, similarity: number }>} - Ranked similarity results
   */
  mostSimilar(word, topN = 5) {
    const targetLower = typeof word === "string" ? word.toLowerCase() : "";
    const results = [];

    for (const [w] of this.vectors) {
      if (w.toLowerCase() !== targetLower) {
        results.push({
          word: w,
          similarity: this.cosineSimilarity(word, w),
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topN);
  }

  /**
   * Performs vector arithmetic (e.g. positive=['king', 'woman'], negative=['man'])
   * and returns most similar words to the resulting vector.
   * @param {string[]} positive - Positive query words
   * @param {string[]} [negative=[]] - Negative query words
   * @param {number} [topN=5] - Number of results to return
   * @return {Array<{ word: string, similarity: number }>} - Nearest neighbor results
   */
  vectorArithmetic(positive, negative = [], topN = 5) {
    const targetVec = new Array(this.dimensions).fill(0);

    if (Array.isArray(positive)) {
      for (const w of positive) {
        const v = this.getVector(w);
        for (let i = 0; i < this.dimensions; i++) targetVec[i] += v[i];
      }
    }

    if (Array.isArray(negative)) {
      for (const w of negative) {
        const v = this.getVector(w);
        for (let i = 0; i < this.dimensions; i++) targetVec[i] -= v[i];
      }
    }

    const mag = Math.sqrt(targetVec.reduce((sum, val) => sum + val * val, 0));
    const normVec = mag > 0 ? targetVec.map((v) => v / mag) : targetVec;

    const excludeSet = new Set(
      [...(positive || []), ...(negative || [])].map((w) =>
        typeof w === "string" ? w.toLowerCase() : ""
      )
    );
    const results = [];

    for (const [w, v] of this.vectors) {
      if (!excludeSet.has(w.toLowerCase())) {
        let dot = 0;
        for (let i = 0; i < this.dimensions; i++) dot += normVec[i] * v[i];
        results.push({ word: w, similarity: dot });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topN);
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  _pseudoRandomVector(seedStr) {
    const hash = this._hashString(seedStr || "unk");
    const vec = [];
    let mag = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const val = Math.sin(hash + i);
      vec.push(val);
      mag += val * val;
    }
    mag = Math.sqrt(mag);
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }
}

module.exports = Embedding;
