const fs = require("fs");
const Ngram = require("../ngram/ngram");
const Counter = require("../counter/counter");

class LanguageModel {
  constructor(ngram, maxN = 5) {
    this.ngram = ngram || new Ngram(maxN);
    this.maxN = ngram?.maxN;
    this.vocabulary = new Set();
    this.context = {};
  }

  /**
   * Trains the model on the provided text.
   * @param {string} text - The text to train the model with
   */
  train(text) {
    let tokens = this.ngram.tokenize(text);
    this.ngram.learn(tokens.join(" "));
    tokens.forEach((word) => this.vocabulary.add(word));
  }

  /**
   * Predicts the next word or sequence based on the given context.
   * @param {string} prefix - The context or prefix to predict from
   * @param {number} [numPredictions=1] - Number of predictions to return
   * @return {string[]} - Array of predicted words or sequences
   */
  predict(prefix, numPredictions = 1) {
    return this.ngram.predictNextWord(prefix).slice(0, numPredictions);
  }

  /**
   * Generates text based on a starting sequence.
   * @param {string} start - The starting sequence
   * @param {number} [length=10] - Length of text to generate
   * @return {string} - Generated text
   */
  generateText(start, length = 10) {
    let generated = start;
    let currentPrefix = start;

    for (let i = 0; i < length; i++) {
      let nextWord = this.predict(currentPrefix, 1)[0];
      if (!nextWord) break;
      generated += " " + nextWord;
      currentPrefix = generated.split(" ").slice(-this.maxN).join(" ");
    }

    return generated;
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
   * Evaluates the model's performance on a test dataset using multiple metrics.
   * @param {Object[]} testData - Array of objects with 'input' and 'reference' properties
   * @return {Object} - Evaluation metrics including perplexity, BLEU score, accuracy, and F1 score
   */
  evaluate(testData) {
    let totalPerplexity = 0;
    let totalBLEU = 0;
    let correctPredictions = 0;
    let totalPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let item of testData) {
      const { input, reference } = item;
      const tokens = this.tokenize(input);
      const refTokens = this.tokenize(reference);

      // Perplexity
      totalPerplexity += this.perplexity(input);

      // BLEU Score (simplified version for 1-gram)
      let precision = this.bleuPrecision(tokens, refTokens);
      totalBLEU += precision;

      // Accuracy (next word prediction)
      let prediction = this.predict(
        input.split(" ").slice(0, -1).join(" "),
        1,
      )[0];
      if (prediction === refTokens[refTokens.length - 1]) {
        correctPredictions++;
      }
      totalPredictions++;

      // F1 Score (assuming binary classification task)
      let actualClass = refTokens.includes("targetWord"); // Example: checking for presence of a specific word
      let predictedClass = tokens.includes("targetWord");
      if (actualClass && predictedClass) truePositives++;
      if (!actualClass && predictedClass) falsePositives++;
      if (actualClass && !predictedClass) falseNegatives++;
    }

    // Calculate average metrics
    const avgPerplexity = totalPerplexity / testData.length;
    const avgBLEU = totalBLEU / testData.length;
    const accuracy = correctPredictions / totalPredictions;

    // F1 Score Calculation
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);
    const f1Score = (2 * (precision * recall)) / (precision + recall) || 0; // Avoid division by zero

    return {
      averagePerplexity: avgPerplexity,
      averageBLEUScore: avgBLEU,
      accuracy: accuracy,
      f1Score: f1Score,
    };
  }

  /**
   * Calculates BLEU precision for 1-gram.
   * @param {string[]} candidate - Candidate tokens
   * @param {string[]} reference - Reference tokens
   * @return {number} - Precision score
   */
  bleuPrecision(candidate, reference) {
    let clippedCount = 0;
    let totalCount = candidate.length;

    for (let word of candidate) {
      let countInCandidate = candidate.filter((w) => w === word).length;
      let countInReference = reference.filter((w) => w === word).length;
      clippedCount += Math.min(countInCandidate, countInReference);
    }

    return clippedCount / totalCount;
  }

  /**
   * Saves the current state of the model to a file.
   * @param {string} path - Path where to save the model
   */
  saveModel(path) {
    const modelState = {
      ngram: this.ngram,
      maxN: this.maxN,
      vocabulary: Array.from(this.vocabulary),
      context: this.context,
    };
    fs.writeFileSync(path, JSON.stringify(modelState));
  }

  /**
   * Loads a previously saved model state from a file.
   * @param {string} path - Path from where to load the model
   */
  loadModel(path) {
    const modelState = JSON.parse(fs.readFileSync(path, "utf8"));
    this.ngram = new Ngram(modelState.maxN);
    this.maxN = modelState.maxN;
    this.vocabulary = new Set(modelState.vocabulary);
    this.context = modelState.context;
    // Re-learn from the saved ngram data
    for (let n in modelState.ngram.ngrams) {
      for (let [key, value] of Object.entries(modelState.ngram.ngrams[n])) {
        let counter = new Counter();
        for (let [word, count] of Object.entries(value)) {
          counter.increment(word, count);
        }
        this.ngram.ngrams[n].set(key, counter);
      }
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
  }

  /**
   * Returns the probability of a word given a context.
   * @param {string} word - The word to find the probability for
   * @param {string} context - The context or prefix
   * @return {number} - Probability of the word in the given context
   */
  getProbability(word, context) {
    let counter =
      this.ngram.ngrams[this.ngram.tokenize(context).length - 1]?.get(context);
    if (counter) {
      let totalCount = counter.total();
      return totalCount > 0 ? counter.get(word) / totalCount : 0;
    }
    return 0;
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
    return tokens.join(" ");
  }

  /**
   * Fine-tunes the model on new data with a specified learning rate, adjusting the counts of n-grams.
   * @param {string} text - Text to fine-tune on
   * @param {number} learningRate - Learning rate for fine-tuning; controls how much to adjust the counts
   */
  fineTune(text, learningRate) {
    if (learningRate <= 0 || learningRate > 1) {
      throw new Error("Learning rate must be between 0 and 1");
    }

    let tokens = this.tokenize(text);
    for (let n = 1; n <= this.maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        let ngram = tokens.slice(i, i + n).join(" ");
        let nextWord = tokens[i + n] || "";

        // Check if the n-gram exists in the model
        if (this.ngram.ngrams[n - 1].has(ngram)) {
          let counter = this.ngram.ngrams[n - 1].get(ngram);

          // Get the current count of the next word
          let currentCount = counter.get(nextWord);

          // Calculate adjustment based on learning rate
          // Here we're using a simple approach: increase by learningRate if count is low
          // decrease by learningRate if count is high
          if (currentCount > this.maxN) {
            //console.log('decrement', currentCount, this.maxN, nextWord, learningRate)
            counter.decrement(nextWord, learningRate);
          } else {
            //console.log('increment', currentCount, this.maxN, nextWord, learningRate)
            counter.increment(nextWord, learningRate);
          }

          //counter.increment(nextWord, adjustment);

          // Ensure counts don't go negative or become too small
          if (counter.get(nextWord) < 0.1) {
            counter.increment(nextWord, -counter.get(nextWord) + 0.1);
          }
        } else {
          // If the n-gram doesn't exist, we initialize it with a small count
          this.ngram.ngrams[n - 1].set(ngram, new Counter());
          this.ngram.ngrams[n - 1].get(ngram).increment(nextWord, learningRate);
        }
      }
    }
  }

  /**
   * Retrieves simulated embeddings for a word based on its frequency in different n-gram contexts.
   * This method uses the n-gram model to create a pseudo-embedding vector where each dimension
   * might represent the frequency in different contexts or n-gram sizes.
   * @param {string} word - The word to get embeddings for
   * @param {number} [dimensions=10] - Number of dimensions for the embedding vector
   * @return {number[]} - Array representing the word's embedding, normalized to unit length
   */
  getEmbeddings(word, dimensions = 10) {
    // Initialize an array of zeros for the embedding vector
    let embedding = new Array(dimensions).fill(0);

    // Check if the word exists in the vocabulary
    if (!this.vocabulary.has(word)) {
      // If not, return a random embedding or handle it as you see fit
      return Array.from({ length: dimensions }, () => Math.random());
    }

    // For each n-gram size from 1 to maxN
    for (let n = 1; n <= this.maxN; n++) {
      // Find all n-grams where the word appears
      for (let [ngram, counter] of this.ngram.ngrams[n - 1]) {
        if (ngram.includes(word)) {
          // Calculate a position in the embedding based on n-gram size and context
          let position = (n - 1) * 3 + (ngram.split(" ").indexOf(word) % 3); // Simple mapping strategy

          // If position exceeds dimensions, wrap around
          position = position % dimensions;

          // Add the total count of this n-gram to the embedding
          embedding[position] += counter.total();
        }
      }
    }

    // Normalize the embedding vector to unit length
    let magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    if (magnitude !== 0) {
      embedding = embedding.map((val) => val / magnitude);
    } else {
      // If all values are zero, return a random unit vector
      embedding = this.randomUnitVector(dimensions);
    }

    return embedding;
  }

  /**
   * Generates a random unit vector of the given dimension.
   * @param {number} dimensions - The dimension of the vector
   * @return {number[]} - A random unit vector
   */
  randomUnitVector(dimensions) {
    let vector = [];
    let magnitude = 0;

    // Generate random values
    for (let i = 0; i < dimensions; i++) {
      let value = Math.random() * 2 - 1; // Values between -1 and 1
      vector.push(value);
      magnitude += value * value;
    }

    // Normalize
    magnitude = Math.sqrt(magnitude);
    return vector.map((val) => val / magnitude);
  }

  /**
   * Calculates the perplexity of the model on given text.
   * @param {string} text - The text to calculate perplexity on
   * @return {number} - Perplexity score
   */
  perplexity(text) {
    let tokens = this.tokenize(text);
    let logProbSum = 0;
    for (let i = 0; i < tokens.length; i++) {
      let context = tokens.slice(Math.max(0, i - this.maxN + 1), i).join(" ");
      let prob = this.getProbability(tokens[i], context);
      if (prob > 0) {
        logProbSum += Math.log(prob);
      } else {
        // If probability is 0, we'll consider it as a very low probability to avoid log(0)
        logProbSum += Math.log(Number.EPSILON);
      }
    }
    return Math.exp(-logProbSum / tokens.length);
  }

  /**
   * Calculates simulated attention weights for parts of the input text based on n-gram frequencies.
   * This method provides a basic approximation of how attention might distribute focus across
   * different parts of the input by considering the frequency of n-grams in the model.
   * @param {string} input - The input text to calculate attention weights for
   * @return {Object} - An object containing the input and an array of attention weights
   */
  attentionWeights(input) {
    let tokens = this.tokenize(input);
    let weights = [];

    // If the input is empty or too short, return uniform weights
    if (tokens.length <= 1) {
      return { input: input, weights: tokens.map(() => 1 / tokens.length) };
    }

    // Calculate weights based on n-gram frequency
    for (let i = 0; i < tokens.length; i++) {
      let totalWeight = 0;
      for (let n = 1; n <= this.maxN && n <= tokens.length; n++) {
        let ngram = tokens.slice(Math.max(0, i - n + 1), i + 1).join(" ");
        let counter = this.ngram.ngrams[n - 1].get(ngram);
        if (counter) {
          // Sum the counts of all possible next words for this n-gram
          totalWeight += counter.total();
        }
      }
      // Normalize the weight based on the total frequency of n-grams ending at this token
      weights.push(totalWeight > 0 ? totalWeight : 0.1); // Small default weight if no n-gram found
    }

    // Normalize weights so they sum to 1
    let sum = weights.reduce((acc, val) => acc + val, 0);
    weights = weights.map((weight) => weight / sum);

    return { input: input, weights: weights };
  }

  /**
   * Provides an explanation or insight into why certain predictions were made.
   * @param {string} prefix - The prefix to explain predictions for
   * @return {string} - Explanation of the prediction
   */
  explainPrediction(prefix) {
    let predictions = this.predict(prefix, 3);
    return (
      `For the prefix "${prefix}", the model predicted "${predictions.join(", ")}"` +
      `based on n-gram frequencies in the trained data.`
    );
  }

  /**
   * Adapts the model's behavior or parameters to a specific language.
   * @param {string} language - The language to adapt to
   */
  adaptToLanguage(language) {
    // Placeholder for language adaptation logic
    console.log(`Adapting model to language: ${language}`);
    // Here you could adjust tokenization rules, add language-specific n-grams, etc.
  }
}

module.exports = LanguageModel;
