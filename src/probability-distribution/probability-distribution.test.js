const ProbabilityDistribution = require("./probability-distribution");
const FrequencyDistribution = require("../frequency-distribution/frequency-distribution");

describe("ProbabilityDistribution Class", () => {
  let pd, fd;

  beforeEach(() => {
    fd = new FrequencyDistribution();
    fd.record("hello", "world", 8);
    fd.record("hello", "there", 2);
    pd = new ProbabilityDistribution(fd);
  });

  test("calculates MLE probabilities", () => {
    expect(pd.mle("hello", "world")).toBe(0.8);
    expect(pd.mle("hello", "there")).toBe(0.2);
    expect(pd.mle("hello", "missing")).toBe(0);
  });

  test("calculates Laplace smoothed probability", () => {
    const prob = pd.laplace("hello", "world", 1, 100);
    expect(prob).toBe((8 + 1) / (10 + 100));
  });

  test("stupidBackoff handles context fallback", () => {
    const score = pd.stupidBackoff("hello", "world");
    expect(score).toBe(0.8);
  });

  test("stupidBackoff handles multi-level context backoff and alpha penalty", () => {
    fd.record("", "unigram", 5);
    const scoreMatched = pd.stupidBackoff("hello", "world", 0.4);
    expect(scoreMatched).toBe(0.8);

    const scoreUnigram = pd.stupidBackoff("unknown context", "unigram", 0.4);
    expect(scoreUnigram).toBeCloseTo(0.16, 4);

    const scoreMissing = pd.stupidBackoff("unknown context", "nonexistent", 0.4);
    expect(scoreMissing).toBeCloseTo(0.000016, 6);
  });

  test("sample returns deterministic pick for low temperature", () => {
    const sampledGreedy = pd.sample("hello", 0.001);
    expect(sampledGreedy).toBe("world");

    expect(pd.sample("nonexistent context")).toBe("");
  });
});
