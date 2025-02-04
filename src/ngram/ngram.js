const Counter = require("../counter/counter");

const debug = true;

class Ngram {
  constructor(maxN = 5) {
    // Limit the maximum n-gram size to 5
    this.maxN = Math.min(maxN, 5);

    // Initialize ngrams as an array of Maps, one for each n-gram level from 1 to maxN
    this.ngrams = new Array(this.maxN).fill(0).map(() => new Map());

    if (debug)
      console.log("Ngram constructor initialized with maxN:", this.maxN);
  }

  /**
   * Tokenizes the input text into an array of lowercase words, removing punctuation but keeping apostrophes.
   * @param {string} text - The text to tokenize
   * @return {string[]} An array of tokens
   */
  tokenize(text) {
    // Convert text to lowercase, trim whitespace, remove non-word characters except apostrophes,
    //  and split on whitespace
    let tokens = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s']|_/g, "")
      .split(/\s+/);
    // Check if the result is empty or falsy after tokenization
    if (!tokens || tokens == "") return [];
    if (debug) console.log("Tokenized text:", tokens);
    return tokens;
  }

  /**
   * Updates the n-gram model with the given tokens.
   * @param {string[]} tokens - Array of tokens to update the model with
   */
  updateModel(tokens) {
    if (debug) console.log("Updating model with tokens:", tokens);
    for (let n = 1; n <= this.maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        // Create the n-gram key by joining n tokens
        let ngram = tokens.slice(i, i + n).join(" ");
        // Determine the next word, or use an empty string if it's the end of the sequence
        let nextWord = tokens[i + n] || "";

        // If this n-gram doesn't exist, initialize it with a new Counter
        if (!this.ngrams[n - 1].has(ngram)) {
          this.ngrams[n - 1].set(ngram, new Counter());
        }

        // Increment the count for the next word following this n-gram
        this.ngrams[n - 1].get(ngram).increment(nextWord);
        if (debug)
          console.log(
            `Updated ${n}-gram for "${ngram}" with next word "${nextWord}"`,
          );
      }
    }
  }

  /**
   * Predicts the next word based on the given prefix.
   * @param {string} prefix - The prefix to predict from
   * @return {string[]} Array of predicted words
   */
  predictNextWord(prefix) {
    let tokens = this.tokenize(prefix);
    if (debug)
      console.log(
        "Predicting next word for prefix:",
        prefix,
        "Tokens:",
        tokens,
      );

    // Start from the largest possible n-gram and work downwards
    for (let n = Math.min(tokens.length, this.maxN); n > 0; n--) {
      let ngram = tokens.slice(-n).join(" ");
      let counter = this.ngrams[n - 1].get(ngram);

      if (counter) {
        // Sort predictions by frequency and extract the words
        let sortedWords = counter.mostCommon().map(([word]) => word);
        if (debug)
          console.log(`Found ${n}-gram match for "${ngram}":`, sortedWords);
        return sortedWords;
      }
    }
    if (debug) console.log("No n-gram match found for prefix:", prefix);
    return [];
  }

  /**
   * Learns from the provided text by updating the model.
   * @param {string} text - The text to learn from
   */
  learn(text) {
    this.updateModel(this.tokenize(text));
    if (debug) console.log("Learned from text:", text);
  }
}

module.exports = Ngram;
