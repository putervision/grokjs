const Embedding = require("./embedding");

describe("Embedding Class", () => {
  let embedding;

  beforeEach(() => {
    embedding = new Embedding(10);
    embedding.build([
      "king queen prince princess royal kingdom",
      "man woman boy girl human person",
      "king rules kingdom with queen",
    ]);
  });

  test("builds fixed dimension vectors", () => {
    const vec = embedding.getVector("king");
    expect(vec.length).toBe(10);
  });

  test("computes cosine similarity between words", () => {
    const sim = embedding.cosineSimilarity("king", "queen");
    expect(sim).toBeGreaterThanOrEqual(-1.0);
    expect(sim).toBeLessThanOrEqual(1.0);
  });

  test("mostSimilar ranks most similar words", () => {
    const similar = embedding.mostSimilar("king", 3);
    expect(similar.length).toBe(3);
    expect(similar[0]).toHaveProperty("word");
    expect(similar[0]).toHaveProperty("similarity");
  });

  test("vectorArithmetic operates on positive/negative words", () => {
    const res = embedding.vectorArithmetic(["king", "woman"], ["man"], 3);
    expect(res.length).toBeGreaterThan(0);
  });
});
