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
});
