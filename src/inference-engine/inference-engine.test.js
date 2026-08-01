const InferenceEngine = require("./inference-engine");
const LanguageModel = require("../language-model/language-model");

describe("InferenceEngine Class", () => {
  let lm;

  beforeEach(() => {
    lm = new LanguageModel();
    lm.train("grokjs is an open source language model library for javascript developers");
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

  test("generateStream yields tokens sequentially as a generator", () => {
    const stream = InferenceEngine.generateStream(lm, "grokjs is", 3);
    const tokens = Array.from(stream);
    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens[0]).toBe("grokjs is");
  });

  test("generate halts on stopSequences match", () => {
    lm.train("hello world stop here and end");
    const result = InferenceEngine.generate(lm, "hello world", 5, {
      stopSequences: ["stop"],
    });
    expect(result).toBeDefined();
  });

  test("repetitionPenalty discourages repeating tokens", () => {
    const result = InferenceEngine.generate(lm, "grokjs", 5, {
      repetitionPenalty: 2.0,
      topP: 0.8,
      topK: 2,
    });
    expect(result).toBeDefined();
  });

  test("handles null or non-string inputs safely", () => {
    expect(InferenceEngine.generate(null, "test")).toBe("test");
    expect(InferenceEngine.generate(lm, null)).toBe("");
    expect(InferenceEngine.beamSearch(null, "test")).toBe("test");
    expect(InferenceEngine.beamSearch(lm, null)).toBe("");
    const stream = InferenceEngine.generateStream(null, "test");
    expect(Array.from(stream)).toEqual(["test"]);
    const streamNull = InferenceEngine.generateStream(lm, null);
    expect(Array.from(streamNull)).toEqual([null]);
  });
});
