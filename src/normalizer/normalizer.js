/**
 * Normalizer class for standardizing text prior to tokenization or language modeling.
 * Provides configurable text normalization utilities such as lowercasing, accent stripping,
 * unicode cleaning, case folding, and extra whitespace removal.
 */
class Normalizer {
  /**
   * Constructs a Normalizer instance with default options.
   * @param {Object} [options={}] - Normalization options
   * @param {boolean} [options.lowerCase=true] - Whether to convert text to lowercase
   * @param {boolean} [options.stripAccents=false] - Whether to remove diacritics and accents
   * @param {boolean} [options.cleanUnicode=true] - Whether to normalize unicode characters to NFKC
   * @param {boolean} [options.removeExtraWhitespace=true] - Whether to collapse multiple whitespace characters into single spaces
   */
  constructor(options = {}) {
    this.shouldLowerCase = options.lowerCase !== false;
    this.shouldStripAccents = options.stripAccents || false;
    this.shouldCleanUnicode = options.cleanUnicode !== false;
    this.shouldRemoveExtraWhitespace = options.removeExtraWhitespace !== false;
  }

  /**
   * Normalizes the input text according to configured options.
   * @param {string} text - The raw input text
   * @param {Object} [overrideOptions] - Optional per-call options override
   * @return {string} - The normalized string
   */
  normalize(text, overrideOptions = {}) {
    if (typeof text !== "string") {
      throw new Error("Input must be a string");
    }

    const opts = {
      lowerCase: this.shouldLowerCase,
      stripAccents: this.shouldStripAccents,
      cleanUnicode: this.shouldCleanUnicode,
      removeExtraWhitespace: this.shouldRemoveExtraWhitespace,
      ...overrideOptions,
    };

    let result = text;

    if (opts.cleanUnicode) {
      result = this.cleanUnicode(result);
    }

    if (opts.stripAccents) {
      result = this.stripAccents(result);
    }

    if (opts.lowerCase) {
      result = this.caseFold(result);
    }

    if (opts.removeExtraWhitespace) {
      result = this.removeExtraWhitespace(result);
    }

    return result;
  }

  /**
   * Strips diacritics and accents from characters (e.g., 'café' -> 'cafe').
   * @param {string} text - Input text
   * @return {string} - Text without accents
   */
  stripAccents(text) {
    if (typeof text !== "string") return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Converts text to lowercase / case-folded representation.
   * @param {string} text - Input text
   * @return {string} - Case-folded text
   */
  caseFold(text) {
    if (typeof text !== "string") return "";
    return text.toLowerCase();
  }

  /**
   * Normalizes Unicode characters to Unicode Normalization Form KC (NFKC).
   * @param {string} text - Input text
   * @return {string} - Unicode normalized text
   */
  cleanUnicode(text) {
    if (typeof text !== "string") return "";
    return text.normalize("NFKC");
  }

  /**
   * Replaces consecutive spaces, tabs, and newlines with a single space and trims edges.
   * @param {string} text - Input text
   * @return {string} - Whitespace-collapsed text
   */
  removeExtraWhitespace(text) {
    if (typeof text !== "string") return "";
    return text.replace(/\s+/g, " ").trim();
  }
}

module.exports = Normalizer;
