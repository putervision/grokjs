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
    if (!key || typeof key !== "string" || !value || typeof value !== "string") {
      return false;
    }
    const cat = category && typeof category === "string" ? category : "general";

    // Deduplicate existing identical fact
    const existing = this.facts.find(
      (f) => f.category === cat && f.key === key && f.value === value
    );
    if (existing) return true;

    const combined = `${cat} ${key} ${value}`.toLowerCase();
    const tokens = this.tokenizer.tokenize(combined);

    const maxId = this.facts.reduce((max, f) => (f.id && f.id > max ? f.id : max), 0);
    const newFact = {
      id: maxId + 1,
      category: cat,
      key: key,
      value: value,
      tokens: tokens,
    };
    this.facts.push(newFact);
    return true;
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
      const factTokenSet = new Set(fact.tokens || []);
      let matches = 0;
      for (const token of factTokenSet) {
        if (queryTokens.has(token)) matches++;
      }

      if (matches > 0) {
        // Jaccard similarity: intersection over union
        const unionSize = queryTokens.size + factTokenSet.size - matches;
        const relevance = unionSize > 0 ? matches / unionSize : 0;
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
      if (typeof json !== "string") return this;
      const facts = JSON.parse(json);
      if (Array.isArray(facts)) {
        this.facts = facts
          .filter((f) => f && typeof f === "object")
          .map((f, idx) => {
            const cat = typeof f.category === "string" ? f.category : "general";
            const key = typeof f.key === "string" ? f.key : "";
            const val = typeof f.value === "string" ? f.value : "";
            const combined = `${cat} ${key} ${val}`.toLowerCase();
            return {
              id: typeof f.id === "number" && f.id > 0 ? f.id : idx + 1,
              category: cat,
              key: key,
              value: val,
              tokens:
                Array.isArray(f.tokens) && f.tokens.every((t) => typeof t === "string")
                  ? f.tokens
                  : this.tokenizer.tokenize(combined),
            };
          });
      }
    } catch (e) {
      console.warn("GrokJS FactServer: Could not deserialize facts", e);
    }
    return this;
  }
}

module.exports = FactServer;
