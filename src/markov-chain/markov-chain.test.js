const MarkovChain = require("./markov-chain");

describe("MarkovChain Class", () => {
  let mc;

  beforeEach(() => {
    mc = new MarkovChain(1);
    mc.train([
      ["the", "cat", "sat", "on", "the", "mat"],
      ["the", "dog", "sat", "on", "the", "rug"],
    ]);
  });

  test("generates transition matrix", () => {
    const matrix = mc.getTransitionMatrix();
    expect(matrix["the"]).toBeDefined();
    expect(matrix["the"]["cat"]).toBe(0.25);
    expect(matrix["the"]["dog"]).toBe(0.25);
    expect(matrix["the"]["mat"]).toBe(0.25);
    expect(matrix["the"]["rug"]).toBe(0.25);
  });

  test("getNextStateProbability returns next state probabilities", () => {
    const probs = mc.getNextStateProbability("sat");
    expect(probs["on"]).toBe(1.0);
  });

  test("generatePath produces sequence of requested length", () => {
    const path = mc.generatePath("the", 4);
    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toBe("the");
  });
});
