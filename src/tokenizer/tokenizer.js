const { franc } = require("franc-cjs");

class Tokenizer {
  constructor(options = {}) {
    this.lowerCase = options.lowerCase !== false; // Default to true
    this.preserveCase = options.preserveCase || false;
    this.handleContractions = options.handleContractions !== false; // Default to true
    this.addSpecialTokensFlag = options.addSpecialTokens || false;

    // Comprehensive regular expression for tokenization:
    // - Matches words including those with apostrophes for contractions (e.g., 'it's', 'don't')
    // - Captures individual punctuation marks (., !, ?, ;, :, $,)
    // - Identifies integers and floating-point numbers (e.g., '123', '123.45')
    // - Recognizes common date formats (YYYY-MM-DD, DD-MM-YYYY, etc.)
    // - Catches any non-whitespace character for robust tokenization of special cases
    this.defaultTokenRegex =
      /\b\w+(?:['’]\w+)*\b|[.,!?;:$]|\d+(?:\.\d+)?|(?:\d{1,4}[-/]\d{1,2}[-/]\d{1,4})|\S+/g;

    // diff regex based on language - this needs upgraded
    this.langRules = {
      eng: this.defaultTokenRegex,
      deu: /(?:\b\w+(?:-\w+)*\b|[.,!?;:])|\S+/g, // Example for German, handling compound words
      jpn: /\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Han}|\S+/gu, // Example for Japanese, using Unicode properties
    };
  }

  /**
   * Tokenizes the given text into an array of tokens.
   * @param {string} text - The text to tokenize
   * @return {string[]} - An array of tokens
   */
  tokenize(text) {
    if (typeof text !== "string") {
      throw new Error("Input must be a string");
    }

    // Apply case transformation based on options
    if (this.lowerCase && !this.preserveCase) text = text.toLowerCase();

    // Replace newlines with spaces to treat them as word separators
    text = text.replace(/\n/g, " ");

    // Determine language and apply appropriate regex
    const lang = franc(text);
    const regex = this.langRules[lang] || this.defaultTokenRegex;

    // Tokenize the text
    let tokens = text.match(regex) || [];

    // todo - debug this , causing failed tests around contractions
    // Handle contractions if specified
    if (this.handleContractions) {
      const contractions = {
        "n't": " not",
        "'ve": " have",
        "'re": " are",
        "'s": " is",
        "'d": " would",
        "'ll": " will",
        "'m": " am",
      };
      tokens = tokens.map((token) => {
        for (let [contraction, expansion] of Object.entries(contractions)) {
          if (token.endsWith(contraction)) {
            return token.slice(0, -contraction.length) + expansion;
          }
        }
        return token;
      });
    }

    // Add special tokens if the flag is set
    if (this.addSpecialTokensFlag) {
      tokens = this.addSpecialTokens(tokens);
    }

    return tokens;
  }

  /**
   * Detokenizes an array of tokens back into a string.
   * @param {string[]} tokens - Array of tokens to join
   * @return {string} - The detokenized text
   */
  detokenize(tokens) {
    // Remove special tokens if they were added
    if (this.addSpecialTokensFlag) {
      tokens = this.removeSpecialTokens(tokens);
    }
    // Join tokens with a space
    return tokens.join(" ");
  }

  /**
   * Adds special tokens like start and end of sentence markers if needed.
   * @param {string[]} tokens - Array of tokens to process
   * @return {string[]} - Array of tokens with special markers
   */
  addSpecialTokens(tokens) {
    return ["<s>"].concat(tokens, ["</s>"]);
  }

  /**
   * Removes special tokens if they were added during tokenization.
   * @param {string[]} tokens - Array of tokens with special markers
   * @return {string[]} - Array of tokens without special markers
   */
  removeSpecialTokens(tokens) {
    return tokens.filter((token) => token !== "<s>" && token !== "</s>");
  }
}

module.exports = Tokenizer;
