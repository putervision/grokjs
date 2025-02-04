const Ngram = require("./ngram");
const Counter = require("../counter/counter");

jest.spyOn(console, "log").mockImplementation(() => {});

describe("Ngram", () => {
  let ngram;

  beforeEach(() => {
    ngram = new Ngram(3); // Test with 3-grams for simplicity
  });

  test("constructor initializes ngrams correctly", () => {
    expect(ngram.maxN).toBe(3);
    expect(ngram.ngrams.length).toBe(3);
    expect(ngram.ngrams[0] instanceof Map).toBe(true);
    expect(ngram.ngrams[1] instanceof Map).toBe(true);
    expect(ngram.ngrams[2] instanceof Map).toBe(true);
  });

  test("tokenize converts text to tokens with various inputs", () => {
    expect(ngram.tokenize("Hello world how are you")).toEqual([
      "hello",
      "world",
      "how",
      "are",
      "you",
    ]);
    expect(ngram.tokenize("  Multiple   spaces   ")).toEqual([
      "multiple",
      "spaces",
    ]);
    expect(ngram.tokenize("Punctuation!@#$%^&*()")).toEqual(["punctuation"]);
    expect(ngram.tokenize("")).toEqual([]); // Empty string
    expect(ngram.tokenize("   ")).toEqual([]); // Only spaces
  });

  test("updateModel handles single word input", () => {
    ngram.updateModel(["hello"]);
    expect(ngram.ngrams[0].get("hello")).toBeInstanceOf(Counter);
    expect(ngram.ngrams[0].get("hello").get("")).toBe(1); // End of input
  });

  test("updateModel adds ngrams to the model with longer sequences", () => {
    ngram.updateModel(["hello", "world", "how", "are", "you"]);
    expect(ngram.ngrams[0].get("hello").get("world")).toBe(1);
    expect(ngram.ngrams[1].get("hello world").get("how")).toBe(1);
    expect(ngram.ngrams[2].get("hello world how").get("are")).toBe(1);
    expect(ngram.ngrams[0].get("are").get("you")).toBe(1);
  });

  test("predictNextWord handles different n-gram levels", () => {
    ngram.updateModel([
      "hello",
      "world",
      "how",
      "are",
      "you",
      "hello",
      "world",
      "again",
    ]);

    // Test for 3-gram prediction
    let predictions = ngram.predictNextWord("hello world how");
    expect(predictions).toEqual(["are"]);

    // Test for 2-gram prediction
    predictions = ngram.predictNextWord("hello world");
    expect(predictions).toEqual(["how", "again"]);

    // Test for 1-gram prediction
    predictions = ngram.predictNextWord("world");
    expect(predictions).toEqual(["how", "again"]);
  });

  test("predictNextWord returns empty array for no match with various inputs", () => {
    let predictions = ngram.predictNextWord("unknown prefix");
    expect(predictions).toEqual([]);

    predictions = ngram.predictNextWord("");
    expect(predictions).toEqual([]);
  });

  test("learn method updates the model with multiple sentences", () => {
    ngram.learn("hello world how are you. hello world again");
    expect(ngram.ngrams[0].get("hello").get("world")).toBe(2);
    expect(ngram.ngrams[1].get("hello world").get("how")).toBe(1);
    expect(ngram.ngrams[1].get("hello world").get("again")).toBe(1);
  });
});
