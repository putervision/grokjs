const fs = require("fs");
const Ngram = require("../ngram/ngram");
const Counter = require("../counter/counter");
const EvaluationMetrics = require("../evaluation-metrics/evaluation-metrics");
const InferenceEngine = require("../inference-engine/inference-engine");
const Embedding = require("../embedding/embedding");
const AttentionMechanism = require("../attention-mechanism/attention-mechanism");

class LanguageModel {
  /**
   * Constructs a LanguageModel instance.
   * @param {Ngram} [ngram] - Optional pre-configured Ngram instance
   * @param {number} [maxN=5] - Maximum n-gram level
   */
  constructor(ngram, maxN = 5) {
    this.ngram = ngram || new Ngram(maxN);
    this.maxN = this.ngram.maxN;
    this.vocabulary = new Set();
    this.context = {};
    this.embedding = null;
    this.attention = null;
  }

  /**
   * Trains the model on the provided text.
   * @param {string} text - The text to train the model with
   */
  train(text) {
    if (typeof text !== "string") {
      throw new Error("Input must be a string");
    }
    let tokens = this.ngram.tokenize(text);
    this.ngram.learn(text);
    tokens.forEach((word) => {
      if (word) this.vocabulary.add(word);
    });
  }

  /**
   * Predicts the next word or sequence based on the given context.
   * @param {string} prefix - The context or prefix to predict from
   * @param {number} [numPredictions=1] - Number of predictions to return
   * @return {string[]} - Array of predicted words or sequences
   */
  predict(prefix, numPredictions = 1) {
    if (typeof prefix !== "string") {
      throw new Error("Prefix must be a string");
    }
    return this.ngram.predictNextWord(prefix).slice(0, numPredictions);
  }

  /**
   * Predicts the next word with probability confidence scores.
   * @param {string} prefix - The context or prefix to predict from
   * @param {number} [numPredictions=5] - Number of predictions to return
   * @return {Array<{ word: string, probability: number }>} - Predicted words with probabilities
   */
  predictWithConfidence(prefix, numPredictions = 5) {
    if (typeof prefix !== "string") {
      throw new Error("Prefix must be a string");
    }
    const tokens = this.ngram.tokenize(prefix);
    const predictions = [];

    for (let n = Math.min(tokens.length, this.maxN); n > 0; n--) {
      const ngram = tokens.slice(-n).join(" ");
      const counter = this.ngram.ngrams[n - 1]?.get(ngram);

      if (counter && counter.total() > 0) {
        const mostCommon = counter.mostCommon(numPredictions);
        for (const [word, count] of mostCommon) {
          predictions.push({
            word,
            probability: count / counter.total(),
            ngramLevel: n,
          });
        }
        break;
      }
    }

    return predictions;
  }

  /**
   * Generates text based on a starting sequence using InferenceEngine.
   * @param {string} start - The starting sequence
   * @param {number} [length=10] - Length of text to generate
   * @param {Object} [options={}] - Advanced sampling options
   * @return {string} - Generated text
   */
  generateText(start, length = 10, options = {}) {
    if (typeof start !== "string") {
      throw new Error("Start must be a string");
    }
    return InferenceEngine.generate(this, start, length, options);
  }

  /**
   * Sets or updates the context which might influence predictions.
   * @param {Object} context - Context information to set
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Returns the vocabulary used by the model.
   * @return {Set} - Set of unique tokens
   */
  getVocabulary() {
    return this.vocabulary;
  }

  /**
   * Returns the size of the vocabulary.
   * @return {number} - Size of the vocabulary
   */
  getVocabularySize() {
    return this.vocabulary.size;
  }

  /**
   * Evaluates the model's performance on a test dataset.
   * @param {Object[]} testData - Array of objects with 'input' and 'reference' properties
   * @return {Object} - Evaluation metrics
   */
  evaluate(testData) {
    if (!Array.isArray(testData) || testData.length === 0) {
      return {
        averagePerplexity: NaN,
        averageBLEUScore: NaN,
        accuracy: NaN,
        f1Score: NaN,
      };
    }

    let totalPerplexity = 0;
    let totalBLEU = 0;
    let correctPredictions = 0;
    let totalPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let item of testData) {
      const { input, reference } = item;
      const candTokens = this.tokenize(input || "");
      const refTokens = this.tokenize(reference || "");

      // Perplexity
      totalPerplexity += this.perplexity(reference || input);

      // BLEU Score
      totalBLEU += EvaluationMetrics.bleu(candTokens, refTokens);

      // Accuracy: predict next word after 'input', compare against
      // the first token of 'reference' that extends beyond input
      if (input && reference) {
        const predictions = this.predict(input, 1);
        const nextPred = predictions[0] || "";
        const inputTokens = this.tokenize(input);
        let expectedNext = "";
        if (refTokens.length > inputTokens.length) {
          expectedNext = refTokens[inputTokens.length];
        } else {
          expectedNext = refTokens[0] || "";
        }

        if (nextPred && expectedNext && nextPred === expectedNext) {
          correctPredictions++;
        }
        totalPredictions++;
      }

      // F1 Score: proper token set overlap (not hardcoded "targetWord"/"world")
      const predSet = new Set(candTokens);
      const refSet = new Set(refTokens);

      for (const token of predSet) {
        if (refSet.has(token)) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
      for (const token of refSet) {
        if (!predSet.has(token)) {
          falseNegatives++;
        }
      }
    }

    const precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    const len = testData.length;
    return {
      averagePerplexity: totalPerplexity / len,
      averageBLEUScore: totalBLEU / len,
      accuracy: totalPredictions > 0 ? correctPredictions / totalPredictions : 0,
      f1Score: f1Score,
    };
  }

  /**
   * Calculates BLEU precision for n-grams.
   * @param {string[]} candidate - Candidate tokens
   * @param {string[]} reference - Reference tokens
   * @return {number} - Precision score
   */
  bleuPrecision(candidate, reference) {
    return EvaluationMetrics.bleu(candidate, reference, 1);
  }

  /**
   * Saves the current state of the model to a JSON file.
   * @param {string} path - Path where to save the model
   */
  saveModel(path) {
    const serializedNgrams = this.ngram.ngrams.map((map) => {
      const obj = {};
      for (let [key, counter] of map.entries()) {
        obj[key] = Array.from(counter.counter.entries());
      }
      return obj;
    });

    const modelState = {
      maxN: this.maxN,
      ngrams: serializedNgrams,
      vocabulary: Array.from(this.vocabulary),
      context: this.context,
    };
    fs.writeFileSync(path, JSON.stringify(modelState, null, 2));
  }

  /**
   * Loads a previously saved model state from a file.
   * @param {string} path - Path from where to load the model
   */
  loadModel(path) {
    const modelState = JSON.parse(fs.readFileSync(path, "utf8"));
    this.maxN = modelState.maxN || 5;
    this.ngram = new Ngram(this.maxN);
    this.vocabulary = new Set(modelState.vocabulary || []);
    this.context = modelState.context || {};

    if (Array.isArray(modelState.ngrams)) {
      modelState.ngrams.forEach((ngramObj, index) => {
        if (index < this.ngram.ngrams.length) {
          const map = new Map();
          for (let [key, entries] of Object.entries(ngramObj)) {
            const counter = new Counter();
            if (Array.isArray(entries)) {
              entries.forEach(([word, count]) => {
                counter.increment(word, count);
                if (word) this.vocabulary.add(word);
              });
            } else if (typeof entries === "object" && entries !== null) {
              Object.entries(entries).forEach(([word, count]) => {
                counter.increment(word, count);
                if (word) this.vocabulary.add(word);
              });
            }
            map.set(key, counter);
            if (key) {
              key.split(" ").forEach((w) => {
                if (w) this.vocabulary.add(w);
              });
            }
          }
          this.ngram.ngrams[index] = map;
        }
      });
    }
  }

  /**
   * Updates the model incrementally with new text.
   * @param {string} newText - New text to update the model with
   */
  updateModel(newText) {
    this.train(newText);
  }

  /**
   * Clears the model to its initial state.
   */
  clearModel() {
    this.ngram = new Ngram(this.maxN);
    this.vocabulary.clear();
    this.context = {};
    this.embedding = null;
    this.attention = null;
  }

  /**
   * Checks if the model has been trained and is ready for inference.
   * @return {Object} - Health status object
   */
  healthCheck() {
    return {
      isTrained: this.vocabulary.size > 0,
      vocabularySize: this.vocabulary.size,
      ngramLevels: this.ngram.ngrams.filter((m) => m.size > 0).length,
      maxNgramLevel: this.maxN,
      ready: this.vocabulary.size > 0,
    };
  }

  /**
   * Returns the probability of a word given a context.
   * @param {string} word - The word to find the probability for
   * @param {string} context - The context or prefix
   * @return {number} - Probability of the word in the given context
   */
  getProbability(word, context) {
    const tokens = this.ngram.tokenize(context || "");
    const contextN = Math.min(tokens.length, this.maxN - 1);

    if (contextN === 0) {
      const counter = this.ngram.ngrams[0]?.get("");
      const total = counter ? counter.total() : 0;
      return total > 0 ? (counter.get(word) || 0) / total : 0.0001;
    }

    const trimmedContext = tokens.slice(-contextN).join(" ");
    const counter = this.ngram.ngrams[contextN - 1]?.get(trimmedContext);

    if (counter) {
      const totalCount = counter.total();
      if (totalCount > 0) {
        return counter.get(word) / totalCount;
      }
    }

    return 0.0001;
  }

  /**
   * Tokenizes the input text.
   * @param {string} text - The text to tokenize
   * @return {string[]} - Array of tokens
   */
  tokenize(text) {
    return this.ngram.tokenize(text);
  }

  /**
   * Detokenizes an array of tokens back into text.
   * @param {string[]} tokens - Array of tokens to detokenize
   * @return {string} - Detokenized text
   */
  detokenize(tokens) {
    return Array.isArray(tokens) ? tokens.join(" ") : "";
  }

  /**
   * Fine-tunes the model on new data with a specified learning rate.
   * @param {string} text - Text to fine-tune on
   * @param {number} learningRate - Learning rate for fine-tuning (0 to 1)
   */
  fineTune(text, learningRate = 0.1) {
    if (learningRate <= 0 || learningRate > 1) {
      throw new Error("Learning rate must be between 0 and 1");
    }

    let tokens = this.tokenize(text);
    for (let n = 1; n <= this.maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        let ngram = tokens.slice(i, i + n).join(" ");
        let nextWord = tokens[i + n] || "";

        if (this.ngram.ngrams[n - 1].has(ngram)) {
          let counter = this.ngram.ngrams[n - 1].get(ngram);
          let currentCount = counter.get(nextWord);

          if (currentCount > this.maxN) {
            counter.decrement(nextWord, learningRate);
          } else {
            counter.increment(nextWord, learningRate);
          }
        } else {
          this.ngram.ngrams[n - 1].set(ngram, new Counter());
          this.ngram.ngrams[n - 1].get(ngram).increment(nextWord, learningRate);
        }
      }
    }
  }

  /**
   * Retrieves simulated embeddings for a word based on frequency in n-gram contexts.
   * @param {string} word - The word to get embeddings for
   * @param {number} [dimensions=10] - Number of dimensions
   * @return {number[]} - Unit normalized non-negative vector
   */
  getEmbeddings(word, dimensions = 10) {
    let embedding = new Array(dimensions).fill(0);

    if (!this.vocabulary.has(word)) {
      return this.randomUnitVector(dimensions);
    }

    for (let n = 1; n <= this.maxN; n++) {
      for (let [ngram, counter] of this.ngram.ngrams[n - 1]) {
        if (ngram.includes(word)) {
          let position = (n - 1) * 3 + (ngram.split(" ").indexOf(word) % 3);
          position = position % dimensions;
          embedding[position] += counter.total();
        }
      }
    }

    let magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map((val) => val / magnitude);
    } else {
      return this.randomUnitVector(dimensions);
    }
  }

  /**
   * Generates a random unit vector of the given dimension with non-negative values in [0, 1].
   * @param {number} dimensions - The dimension of the vector
   * @return {number[]} - Non-negative unit normalized vector
   */
  randomUnitVector(dimensions) {
    let vector = [];
    let magnitude = 0;
    for (let i = 0; i < dimensions; i++) {
      let value = Math.random() + 0.1;
      vector.push(value);
      magnitude += value * value;
    }
    magnitude = Math.sqrt(magnitude);
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
  }

  /**
   * Calculates the perplexity of the model on given text.
   * @param {string} text - The text to calculate perplexity on
   * @return {number} - Perplexity score
   */
  perplexity(text) {
    return EvaluationMetrics.perplexity(this, text);
  }

  /**
   * Calculates attention weights for parts of the input text using AttentionMechanism.
   * @param {string} input - The input text
   * @return {Object} - Object containing input string and attention weights array
   */
  attentionWeights(input) {
    const tokens = this.tokenize(input);
    if (!this.attention) {
      this.attention = new AttentionMechanism(this.maxN);
    }
    const weights = this.attention.computeWeights(tokens);
    return { input: input, weights: weights };
  }

  /**
   * Provides an explanation into why certain predictions were made.
   * @param {string} prefix - The prefix to explain predictions for
   * @return {string} - Explanation string
   */
  explainPrediction(prefix) {
    let predictions = this.predict(prefix, 3);
    return (
      `For the prefix "${prefix}", the model predicted "${predictions.join(", ")}" ` +
      `based on n-gram frequencies in the trained data.`
    );
  }

  /**
   * Adapts the model's behavior to a specific language.
   * @param {string} language - Language code (e.g. 'eng', 'deu', 'jpn')
   */
  adaptToLanguage(language) {
    if (this.ngram && this.ngram.tokenizer) {
      this.ngram.tokenizer.language = language;
    }
    this.context.language = language;
  }
}

module.exports = LanguageModel;
