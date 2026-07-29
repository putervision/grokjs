let franc;
try {
  franc = require("franc-cjs").franc;
} catch (e) {
  franc = null;
}

class Tokenizer {
  constructor(options = {}) {
    this.lowerCase = options.lowerCase !== false;
    this.preserveCase = options.preserveCase || false;
    this.handleContractions = options.handleContractions !== false;
    this.addSpecialTokensFlag = options.addSpecialTokens || false;
    this.removePunctuation = options.removePunctuation !== false;
    this.language = options.language || null;

    // Comprehensive regular expression for tokenization:
    // Preserves dates, ISO timestamps, floating point numbers ($10.99), words with contractions, punctuation.
    this.defaultTokenRegex =
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)|((?:\d{4}|\d{2})[-/]\d{2}[-/]\d{2})|(\d+\.\d+)|\b\w+(?:['’]\w+)*\b|[.,!?;:$]|\d+|\S+/g;

    this.langRules = {
      eng: this.defaultTokenRegex,
      deu: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)|((?:\d{4}|\d{2})[-/]\d{2}[-/]\d{2})|(\d+\.\d+)|\b\w+(?:[-\w+])*|\S+/g,
      jpn: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー]+|([、。！？])|\S+/gu,
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

    if (this.lowerCase && !this.preserveCase) text = text.toLowerCase();
    text = text.replace(/\n/g, " ");

    let detectedLang = this.language;
    if (!detectedLang) {
      if (typeof franc === "function") {
        try {
          detectedLang = franc(text, {
            minLength: 5,
            whitelist: ["eng", "jpn", "deu"],
          });
        } catch (err) {
          detectedLang = "eng";
        }
      } else {
        detectedLang = /[\u3040-\u30ff\u4e00-\u9faf]/.test(text)
          ? "jpn"
          : "eng";
      }
    }
    const lang = detectedLang === "und" ? "eng" : detectedLang;
    const regex = this.langRules[lang] || this.defaultTokenRegex;

    let tokens = text.match(regex) || [];

    tokens = tokens.filter((token) => token && token.trim() !== "");

    if (this.handleContractions && (lang === "eng" || lang === "und")) {
      const contractions = {
        "n't": "not",
        "'ve": "have",
        "'re": "are",
        "'s": "is",
        "'d": "would",
        "'ll": "will",
        "'m": "am",
      };

      tokens = tokens.flatMap((token) => {
        for (let [contraction, expansion] of Object.entries(contractions)) {
          if (token.endsWith(contraction)) {
            return token
              .slice(0, -contraction.length)
              .split(" ")
              .concat(expansion.split(" "));
          }
        }
        return [token];
      });
    }

    if (this.removePunctuation && lang !== "jpn") {
      tokens = tokens.filter((token) => {
        if (
          /^(?:\d{4}|\d{2})[-/]\d{2}[-/]\d{2}$/.test(token) ||
          /^\d+(?:\.\d+)?$/.test(token)
        ) {
          return true;
        }
        return !/[.,!?;:$]/.test(token);
      });
    }

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
    if (!Array.isArray(tokens)) return "";
    if (this.addSpecialTokensFlag) {
      tokens = this.removeSpecialTokens(tokens);
    }
    return tokens.join(" ");
  }

  /**
   * Adds special tokens like start and end of sentence markers.
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
