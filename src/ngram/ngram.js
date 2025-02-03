const Counter = require('../counter/counter');

// Debug toggle to enable or disable console logging for debugging purposes
const debug = true;

class Ngram {
  constructor(maxN = 5) {
    // Limit the maximum n-gram size to 5
    this.maxN = Math.min(maxN, 5);
    
    // Initialize ngrams as an array of Maps, one for each n-gram level from 1 to maxN
    this.ngrams = new Array(this.maxN).fill(0).map(() => new Map());
    
    // Bind methods to the class instance to maintain context in event handlers
    this.inputHandler = this.inputHandler.bind(this);
    this.blurHandler = this.blurHandler.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);

    // Log initialization details if debug mode is on
    if (debug) console.log("Ngram constructor initialized with maxN:", this.maxN);
  }

  /**
   * Tokenizes the input text into an array of lowercase words, removing punctuation but keeping apostrophes.
   * @param {string} text - The text to tokenize
   * @return {string[]} An array of tokens
   */
  tokenize(text) {
    // Convert text to lowercase, trim whitespace, remove non-word characters except apostrophes, and split on whitespace
    let tokens = text.toLowerCase().trim().replace(/[^\w\s']|_/g, "").split(/\s+/);
    // Check if the result is empty or falsy after tokenization
    if (!tokens || tokens == '') return [];
    // Log tokenized text for debugging if enabled
    if (debug) console.log("Tokenized text:", tokens);
    return tokens;
  }

  /**
   * Updates the n-gram model with the given tokens.
   * @param {string[]} tokens - Array of tokens to update the model with
   */
  updateModel(tokens) {
    // Log the tokens being used to update the model if debug mode is on
    if (debug) console.log("Updating model with tokens:", tokens);
    for (let n = 1; n <= this.maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        // Create the n-gram key by joining n tokens
        let ngram = tokens.slice(i, i + n).join(' ');
        // Determine the next word, or use an empty string if it's the end of the sequence
        let nextWord = tokens[i + n] || ''; 
        
        // If this n-gram doesn't exist, initialize it with a new Counter
        if (!this.ngrams[n - 1].has(ngram)) {
          this.ngrams[n - 1].set(ngram, new Counter());
        }
        
        // Increment the count for the next word following this n-gram
        this.ngrams[n - 1].get(ngram).increment(nextWord);
        // Log the update if debug mode is on
        if (debug) console.log(`Updated ${n}-gram for "${ngram}" with next word "${nextWord}"`);
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
    // Log prediction details if debug mode is on
    if (debug) console.log("Predicting next word for prefix:", prefix, "Tokens:", tokens);

    // Start from the largest possible n-gram and work downwards
    for (let n = Math.min(tokens.length, this.maxN); n > 0; n--) {
      let ngram = tokens.slice(-n).join(' ');
      let counter = this.ngrams[n - 1].get(ngram);

      if (counter) {
        // Sort predictions by frequency and extract the words
        let sortedWords = counter.mostCommon().map(([word]) => word);
        // Log the found n-gram match if debug mode is on
        if (debug) console.log(`Found ${n}-gram match for "${ngram}":`, sortedWords);
        return sortedWords;
      }
    }
    // Log if no match was found
    if (debug) console.log("No n-gram match found for prefix:", prefix);
    return [];
  }

  /**
   * Handles input events to provide autocomplete suggestions.
   * @param {Event} event - The input event
   */
  inputHandler(event) {
    let input = event.target;
    let text = input.value;
    let lastSpace = text.lastIndexOf(" ");

    if (lastSpace !== -1) {
      let prefix = text.slice(lastSpace + 1);
      // Predict next word based on the text before the last space
      let suggestions = this.predictNextWord(text.slice(0, lastSpace + 1));
      // Log input handler details if debug mode is on
      if (debug) console.log("Input handler triggered with text:", text, "Prefix:", prefix, "Suggestions:", suggestions);

      if (suggestions.length > 0) {
        // Find a suggestion that starts with the current prefix
        let match = suggestions.find(suggestion => suggestion.startsWith(prefix));
        if (match) {
          // Apply the autocomplete by modifying the input value
          input.value = text.slice(0, lastSpace + 1) + match;
          // Set the cursor position
          event.target.setSelectionRange(lastSpace + 1 + prefix.length, input.value.length);
          // Prevent further typing
          event.target.preventDefault();
          // Log the applied autocomplete if debug mode is on
          if (debug) console.log("Autocomplete applied:", input.value);
        }
      }
    }
  }

  /**
   * Learns from the provided text by updating the model.
   * @param {string} text - The text to learn from
   */
  learn(text) {
    this.updateModel(this.tokenize(text));
    // Log learning details if debug mode is on
    if (debug) console.log("Learned from text:", text);
  }

  /**
   * Handles blur events to learn from the input when focus is lost.
   * @param {Event} event - The blur event
   */
  blurHandler(event) {
    let text = event.target.value;
    if (text.trim()) {
      this.learn(text);
      // Log blur handler details if debug mode is on
      if (debug) console.log("Blur handler learned from text:", text);
    }
  }

  /**
   * Handles keydown events, learning from the input when Enter is pressed.
   * @param {Event} event - The keydown event
   */
  keydownHandler(event) {
    if (event.key === "Enter") {
      let text = event.target.value;
      if (text.trim()) {
        this.learn(text);
        // Log keydown handler details if debug mode is on
        if (debug) console.log("Keydown handler learned from text on Enter:", text);
      }
    }
  }

  /**
   * Sets up event listeners on text inputs and textareas for learning and prediction.
   */
  setup() {
    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
      input.addEventListener("input", this.inputHandler);
      input.addEventListener("blur", this.blurHandler);
      input.addEventListener("keydown", this.keydownHandler);
      // Log setup details if debug mode is on
      if (debug) console.log("Event listeners added to:", input);
    });
  }
}

module.exports = Ngram;