const InferenceEngine = require("./inference-engine");
const LanguageModel = require("../language-model/language-model");

describe("InferenceEngine Class", () => {
  let lm;

  beforeEach(() => {
    lm = new LanguageModel();
    lm.train(
      "grokjs is an open source language model library for javascript developers",
    );
  });

  test("generate performs text continuation", () => {
    const text = InferenceEngine.generate(lm, "grokjs is", 3);
    expect(text).toContain("grokjs is");
    expect(text.split(" ").length).toBeGreaterThan(2);
  });

  test("beamSearch generates plausible paths", () => {
    const text = InferenceEngine.beamSearch(lm, "grokjs is", 3, 2);
    expect(text).toContain("grokjs is");
  });

  test("respects temperature and topK options", () => {
    const text = InferenceEngine.generate(lm, "grokjs", 3, {
      temperature: 0.1,
      topK: 2,
    });
    expect(text).toBeDefined();
  });
});
