const FactServer = require("./fact-server");

describe("FactServer Class", () => {
  let server;

  beforeEach(() => {
    server = new FactServer();
    server.addFact("geography", "capital of france", "Paris");
    server.addFact("math", "value of pi", "3.14159");
  });

  test("queryFacts retrieves relevant facts based on query", () => {
    const results = server.queryFacts("What is the capital of France?", 2);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe("Paris");
  });

  test("augmentPrompt injects fact context into prompt string", () => {
    const augmented = server.augmentPrompt("What is the capital of France?");
    expect(augmented).toContain("Fact [geography]");
    expect(augmented).toContain("Paris");
  });

  test("queryFacts handles unknown query cleanly", () => {
    const results = server.queryFacts("unrelated query about astrophysics");
    expect(results).toEqual([]);
  });

  test("serialize and deserialize store and restore fact state", () => {
    const json = server.serialize();
    expect(typeof json).toBe("string");
    expect(json).toContain("france");

    const newServer = new FactServer();
    newServer.deserialize(json);
    expect(newServer.facts.length).toBe(2);
    expect(newServer.queryFacts("france")[0].value).toBe("Paris");
  });

  test("addFact rejects invalid input and returns false", () => {
    expect(server.addFact("", null, "val")).toBe(false);
    expect(server.addFact("cat", "key", 123)).toBe(false);
  });

  test("addFact deduplicates identical facts", () => {
    const initialCount = server.facts.length;
    server.addFact("geography", "capital of france", "Paris");
    expect(server.facts.length).toBe(initialCount);
  });

  test("deserialize handles non-string and malformed JSON safely", () => {
    expect(server.deserialize(null)).toBe(server);
    expect(server.deserialize("invalid json")).toBe(server);
    expect(server.deserialize(JSON.stringify([{ invalid: true }]))).toBe(server);
  });
});
