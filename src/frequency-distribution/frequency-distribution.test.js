const FrequencyDistribution = require("./frequency-distribution");

describe("FrequencyDistribution Class", () => {
  let fd;

  beforeEach(() => {
    fd = new FrequencyDistribution();
  });

  test("records and counts token frequencies per context", () => {
    fd.record("hello", "world", 2);
    fd.record("hello", "there", 1);
    expect(fd.count("hello", "world")).toBe(2);
    expect(fd.count("hello", "there")).toBe(1);
    expect(fd.count("hello", "unknown")).toBe(0);
  });

  test("contextTotal calculates total tokens observed for a context", () => {
    fd.record("deep", "learning", 5);
    fd.record("deep", "neural", 3);
    expect(fd.contextTotal("deep")).toBe(8);
  });

  test("mostCommon returns top N items sorted descending", () => {
    fd.record("grok", "ai", 10);
    fd.record("grok", "js", 5);
    fd.record("grok", "model", 2);

    const top2 = fd.mostCommon("grok", 2);
    expect(top2).toEqual([
      ["ai", 10],
      ["js", 5],
    ]);
  });
});
