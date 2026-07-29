const AttentionMechanism = require("./attention-mechanism");

describe("AttentionMechanism Class", () => {
  let attention;

  beforeEach(() => {
    attention = new AttentionMechanism(5);
  });

  test("computeWeights returns normalized weights summing to 1.0", () => {
    const weights = attention.computeWeights(["hello", "world", "grok", "model"]);
    expect(weights.length).toBe(4);
    const sum = weights.reduce((acc, val) => acc + val, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  test("getHeatmap returns N x N normalized matrix", () => {
    const tokens = ["the", "grok", "language", "model"];
    const matrix = attention.getHeatmap(tokens);
    expect(matrix.length).toBe(4);
    expect(matrix[0].length).toBe(4);

    for (const row of matrix) {
      const rowSum = row.reduce((acc, val) => acc + val, 0);
      expect(rowSum).toBeCloseTo(1.0, 5);
    }
  });

  test("aggregateFocus ranks tokens by focus score", () => {
    const focus = attention.aggregateFocus(["deep", "learning", "model"]);
    expect(focus.length).toBe(3);
    expect(focus[0]).toHaveProperty("token");
    expect(focus[0]).toHaveProperty("focusScore");
  });
});
