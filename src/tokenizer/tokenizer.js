const { franc } = require("franc-cjs");

class Tokenizer {
  constructor(options = {}) {
    this.lowerCase = options.lowerCase !== false; // Default to true
    this.preserveCase = options.preserveCase || false;
    this.handleContractions = options.handleContractions !== false; // Default to true
    this.addSpecialTokensFlag = options.addSpecialTokens || false;
    this.removePunctuation = options.removePunctuation !== false;

    // Comprehensive regular expression for tokenization:
    // - Matches words including those with apostrophes for contractions (e.g., 'it's', 'don't')
    // - Captures individual punctuation marks (., !, ?, ;, :, $,)
    // - Identifies integers and floating-point numbers (e.g., '123', '123.45')
    // - Preserves common date formats (YYYY-MM-DD, DD-MM-YYYY, etc.) as single tokens
    // - Catches any non-whitespace character for robust tokenization of special cases
    this.defaultTokenRegex = /\b\w+(?:['’]\w+)*\b|[.,!?;:$]|\d+(?:\.\d+)?|((\d{4}|\d{2})[-/]\d{2}[-/]\d{2})|(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)|\S+/g;

    // Different regex based on language - this needs upgraded
    this.langRules = {
      eng: this.defaultTokenRegex,
      deu: /(?:\b\w+(?:-\w+)*\b|[.,!?;:])|\S+/g, // German, handling compound words
      jpn: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー]+|([、。！？])|\s+/gu, // Japanese unicode
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
    const lang = franc(text, {
      minLength: 3,
      whitelist: ['eng', 'jpn', 'deu']
    });
    const regex = this.langRules[lang] || this.defaultTokenRegex;

    // Tokenize the text
    let tokens = text.match(regex) || [];

    // Filter out empty strings which might result from multiple spaces or newlines
    tokens = tokens.filter(token => token.trim() !== '');

    // Handle contractions if specified
    if (this.handleContractions && lang === 'eng') {
      const contractions = {
        "n't": "not",
        "'ve": "have",
        "'re": "are",
        "'s": "is",
        "'d": "would",
        "'ll": "will",
        "'m": "am",
      };
      
      // Map over each token to expand and split contractions
      tokens = tokens.flatMap((token) => {
        for (let [contraction, expansion] of Object.entries(contractions)) {
          if (token.endsWith(contraction)) {
            // Split the expanded form into separate tokens
            return token.slice(0, -contraction.length).split(' ').concat(expansion.split(' '));
          }
        }
        // If no contraction was found, return the token as is
        return [token];
      });
    }

    // Remove punctuation if the option is set, but ensure dates and numbers with decimal points are preserved
    if (this.removePunctuation && lang !== 'jpn') {
      tokens = tokens.filter(token => {
        // Check if the token is a date before filtering out punctuation
        if (/^(?:\d{4}|\d{2})[-/]\d{2}[-/]\d{2}$/.test(token) || /^\d+(?:\.\d+)?$/.test(token)) {
          return true;
        }
        return !/[.,!?;:$]/.test(token);
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