const Normalizer = require("./normalizer");

describe("Normalizer Class", () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new Normalizer({
      lowerCase: true,
      stripAccents: true,
      removeExtraWhitespace: true,
    });
  });

  test("normalizes text with lowercasing, accent stripping, and whitespace cleanup", () => {
    const text = "  Café   CON  Leche!  ";
    const result = normalizer.normalize(text);
    expect(result).toBe("cafe con leche!");
  });

  test("stripAccents removes diacritics", () => {
    expect(normalizer.stripAccents("Régime façade Crème")).toBe("Regime facade Creme");
  });

  test("caseFold converts to lower case", () => {
    expect(normalizer.caseFold("GROK JS")).toBe("grok js");
  });

  test("removeExtraWhitespace collapses whitespace", () => {
    expect(normalizer.removeExtraWhitespace("hello    world \n\n  again")).toBe(
      "hello world again"
    );
  });

  test("throws error for non-string input", () => {
    expect(() => normalizer.normalize(123)).toThrow();
  });
});
