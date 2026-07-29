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

  test("sample returns a token from distribution", () => {
    const sampled = pd.sample("hello", 1.0);
    expect(["world", "there"]).toContain(sampled);
  });
});
