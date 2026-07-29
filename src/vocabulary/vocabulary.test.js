const Vocabulary = require("./vocabulary");

describe("Vocabulary Class", () => {
  let vocab;

  beforeEach(() => {
    vocab = new Vocabulary();
  });

  test("initializes with special tokens", () => {
    expect(vocab.size()).toBe(4); // pad, unk, bos, eos
    expect(vocab.lookup("<unk>")).toBe(1);
  });

  test("addToken registers new tokens and returns unique IDs", () => {
    const id1 = vocab.addToken("hello");
    const id2 = vocab.addToken("world");
    const id3 = vocab.addToken("hello");
    expect(id1).toBe(4);
    expect(id2).toBe(5);
    expect(id3).toBe(4);
  });

  test("buildFromTokens filters by minFreq", () => {
    vocab.buildFromTokens(["apple", "apple", "banana", "cherry"], 2);
    expect(vocab.tokenToIdMap.has("apple")).toBe(true);
    expect(vocab.tokenToIdMap.has("banana")).toBe(false);
  });

  test("encode and decode tokens bidirectional mapping", () => {
    vocab.addToken("hello");
    vocab.addToken("world");

    const encoded = vocab.encode(["hello", "unknown_word", "world"]);
    expect(encoded).toEqual([4, 1, 5]);

    const decoded = vocab.decode(encoded);
    expect(decoded).toEqual(["hello", "<unk>", "world"]);
  });
});
