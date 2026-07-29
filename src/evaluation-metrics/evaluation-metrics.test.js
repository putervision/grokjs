const EvaluationMetrics = require("./evaluation-metrics");
const LanguageModel = require("../language-model/language-model");

describe("EvaluationMetrics Class", () => {
  test("bleu calculates precision score with brevity penalty", () => {
    const scoreExact = EvaluationMetrics.bleu(["hello", "world"], ["hello", "world"]);
    expect(scoreExact).toBeCloseTo(1.0, 4);

    const scorePartial = EvaluationMetrics.bleu(["hello", "there"], ["hello", "world"]);
    expect(scorePartial).toBeLessThan(1.0);
  });

  test("rougeL calculates LCS based score", () => {
    const cand = ["the", "quick", "brown", "fox"];
    const ref = ["the", "fast", "brown", "fox"];
    const score = EvaluationMetrics.rougeL(cand, ref);
    expect(score).toBeGreaterThan(0.5);
  });

  test("precisionRecallF1 calculates set intersection metrics", () => {
    const pred = ["apple", "banana", "cherry"];
    const actual = ["apple", "banana", "date"];
    const res = EvaluationMetrics.precisionRecallF1(pred, actual);
    expect(res.precision).toBeCloseTo(2 / 3, 4);
    expect(res.recall).toBeCloseTo(2 / 3, 4);
    expect(res.f1Score).toBeCloseTo(2 / 3, 4);
  });

  test("accuracy calculates token match ratio", () => {
    const acc = EvaluationMetrics.accuracy(["cat", "sat"], ["cat", "sat"]);
    expect(acc).toBe(1.0);
  });

  test("perplexity evaluates LanguageModel on text", () => {
    const lm = new LanguageModel();
    lm.train("hello world testing perplexity");
    const perp = EvaluationMetrics.perplexity(lm, "hello world");
    expect(perp).toBeGreaterThan(0);
  });
});
