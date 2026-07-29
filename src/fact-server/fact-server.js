const Tokenizer = require("../tokenizer/tokenizer");

/**
 * FactServer class for managing key-value facts and performing
 * Retrieval-Augmented Generation (RAG) context injection into model prompts.
 */
class FactServer {
  constructor() {
    // Array of { id, category, key, value, tokens }
    this.facts = [];
    this.tokenizer = new Tokenizer();
  }

  /**
   * Adds a new fact entry to the fact store.
   * @param {string} category - Topic or domain category (e.g. "geography", "user_profile")
   * @param {string} key - Fact key or name
   * @param {string} value - Fact content statement
   */
  addFact(category, key, value) {
    if (!key || !value) return;
    const cat = category || "general";
    const combined = `${cat} ${key} ${value}`.toLowerCase();
    const tokens = this.tokenizer.tokenize(combined);

    this.facts.push({
      id: this.facts.length + 1,
      category: cat,
      key: key,
      value: value,
      tokens: tokens,
    });
  }

  /**
   * Queries the fact store for top N most relevant facts matching a search query.
   * @param {string} query - Natural language search query or prompt
   * @param {number} [topN=3] - Maximum number of relevant facts to retrieve
   * @return {Array<{ category: string, key: string, value: string, relevance: number }>} - Ranked facts
   */
  queryFacts(query, topN = 3) {
    if (typeof query !== "string" || !query.trim() || this.facts.length === 0) {
      return [];
    }

    const queryTokens = new Set(this.tokenizer.tokenize(query.toLowerCase()));
    if (queryTokens.size === 0) return [];

    const scored = [];
    for (const fact of this.facts) {
      let matches = 0;
      for (const token of fact.tokens) {
        if (queryTokens.has(token)) matches++;
      }

      if (matches > 0) {
        const relevance = matches / (queryTokens.size + fact.tokens.length);
        scored.push({
          category: fact.category,
          key: fact.key,
          value: fact.value,
          relevance: relevance,
        });
      }
    }

    scored.sort((a, b) => b.relevance - a.relevance);
    return scored.slice(0, topN);
  }

  /**
   * Augments a model prompt by prepending relevant facts retrieved from the fact store.
   * @param {string} prompt - Original prompt string
   * @param {number} [topN=2] - Maximum facts to inject
   * @return {string} - Fact-augmented prompt string
   */
  augmentPrompt(prompt, topN = 2) {
    const relevant = this.queryFacts(prompt, topN);
    if (relevant.length === 0) return prompt;

    const factContext = relevant
      .map((f) => `Fact [${f.category}]: ${f.key} = ${f.value}`)
      .join("; ");
    return `[Context: ${factContext}] ${prompt}`;
  }

  /**
   * Serializes all facts to a JSON string for persistence.
   * @return {string} - JSON string of fact store
   */
  serialize() {
    return JSON.stringify(this.facts);
  }

  /**
   * Loads facts from a JSON string.
   * @param {string} json - JSON string of fact store
   * @return {FactServer} - This instance for chaining
   */
  deserialize(json) {
    try {
      const facts = JSON.parse(json);
      if (Array.isArray(facts)) {
        this.facts = facts;
      }
    } catch (e) {
      console.warn("GrokJS FactServer: Could not deserialize facts", e);
    }
    return this;
  }
}

module.exports = FactServer;
