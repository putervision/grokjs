const Corpus = require("./corpus");

describe("Corpus Class", () => {
  let corpus;

  beforeEach(() => {
    corpus = new Corpus();
    corpus.addDocument("First sentence here. Second sentence follows!");
    corpus.addDocument("Third document with more text.");
  });

  test("extracts sentences across documents", () => {
    const sentences = corpus.getSentences();
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toBe("First sentence here.");
  });

  test("extracts tokens across documents", () => {
    const tokens = corpus.getTokens();
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens).toContain("first");
  });

  test("calculates summary statistics", () => {
    const stats = corpus.getStats();
    expect(stats.documentCount).toBe(2);
    expect(stats.sentenceCount).toBe(3);
    expect(stats.tokenCount).toBeGreaterThan(0);
    expect(stats.typeTokenRatio).toBeGreaterThan(0);
  });

  test("splits corpus into train, val, and test subsets", () => {
    for (let i = 0; i < 10; i++) corpus.addDocument(`Document ${i}`);
    const splits = corpus.split(0.8, 0.1, 0.1);
    expect(splits.train.length).toBeGreaterThan(0);
    expect(splits.test.length).toBeGreaterThan(0);
  });

  test("split randomizes document order", () => {
    for (let i = 0; i < 20; i++) corpus.addDocument(`Document ${i} content here`);
    const splits = [];
    for (let i = 0; i < 5; i++) splits.push(corpus.split(0.7, 0.15, 0.15));
    const firstDocs = splits.map((s) => s.train[0]);
    expect(new Set(firstDocs).size).toBeGreaterThan(1);
  });

  test("split produces reproducible splits when seed is provided", () => {
    for (let i = 0; i < 10; i++) corpus.addDocument(`Doc ${i}`);
    const splitA = corpus.split(0.6, 0.2, 0.2, 12345);
    const splitB = corpus.split(0.6, 0.2, 0.2, 12345);
    expect(splitA.train).toEqual(splitB.train);
  });

  test("addDocument ignores empty or non-string inputs", () => {
    const initialLen = corpus.documents.length;
    corpus.addDocument("");
    corpus.addDocument(null);
    expect(corpus.documents.length).toBe(initialLen);
  });
});
