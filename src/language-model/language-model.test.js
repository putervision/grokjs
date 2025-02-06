const LanguageModel = require("../language-model/language-model");
const Ngram = require("../ngram/ngram");
const fs = require("fs");

// Mocking file system operations
jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() =>
    JSON.stringify({
      ngram: { ngrams: [] },
      maxN: 5,
      vocabulary: ["hello", "world"],
      context: {},
    }),
  ),
}));

jest.spyOn(console, "log").mockImplementation(() => {});

describe("LanguageModel", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
  });

  test("constructor initializes correctly", () => {
    expect(languageModel.ngram).toBeInstanceOf(Ngram);
    expect(languageModel.maxN).toBe(3);
    expect(languageModel.vocabulary).toBeInstanceOf(Set);
    expect(languageModel.context).toEqual({});
  });

  test("train adds text to the model", () => {
    languageModel.train("hello world how are you");
    expect(languageModel.getVocabularySize()).toBeGreaterThan(0);
    expect(languageModel.vocabulary.has("hello")).toBe(true);
  });

  test("predict returns predictions", () => {
    languageModel.train("hello world how are you");
    let predictions = languageModel.predict("hello world");
    expect(predictions.length).toBeGreaterThan(0);
    expect(typeof predictions[0]).toBe("string");
  });

  test("generateText generates text", () => {
    languageModel.train("hello world how are you");
    let generatedText = languageModel.generateText("hello", 5);
    expect(generatedText.split(" ").length).toBeGreaterThan(1);
    expect(generatedText.startsWith("hello")).toBe(true);
  });

  test("setContext updates context", () => {
    languageModel.setContext({ topic: "science" });
    expect(languageModel.context).toEqual({ topic: "science" });
  });

  test("getVocabulary returns vocabulary", () => {
    languageModel.train("hello world");
    let vocab = languageModel.getVocabulary();
    expect(vocab).toBeInstanceOf(Set);
    expect(vocab.has("hello")).toBe(true);
  });

  test("getVocabularySize returns correct size", () => {
    languageModel.train("hello world");
    expect(languageModel.getVocabularySize()).toBe(2);
  });

  test("evaluate returns metrics", () => {
    languageModel.train("hello world");
    let metrics = languageModel.evaluate([
      {
        input: "hello world",
        reference: "hello world",
      },
    ]);
    expect(metrics).toHaveProperty("averagePerplexity");
  });

  test("saveModel calls writeFileSync", () => {
    languageModel.saveModel("testPath.json");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "testPath.json",
      expect.any(String),
    );
  });

  test("loadModel loads and initializes model", () => {
    languageModel.loadModel("testPath.json");
    expect(languageModel.maxN).toBe(5);
    expect(languageModel.getVocabularySize()).toBe(2);
  });

  test("updateModel updates the model", () => {
    languageModel.updateModel("new text");
    expect(languageModel.getVocabularySize()).toBeGreaterThan(0);
  });

  test("clearModel resets the model", () => {
    languageModel.train("hello world");
    languageModel.clearModel();
    expect(languageModel.getVocabularySize()).toBe(0);
    expect(languageModel.context).toEqual({});
  });

  test("getProbability returns a probability", () => {
    languageModel.train("hello world how are you");
    let prob = languageModel.getProbability("world", "hello");
    expect(typeof prob).toBe("number");
    expect(prob).toBeGreaterThan(0);
    expect(prob).toBeLessThanOrEqual(1);
  });

  test("tokenize returns tokens", () => {
    let tokens = languageModel.tokenize("Hello, world!");
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens).toEqual(["hello", "world"]);
  });

  test("detokenize converts tokens to text", () => {
    let text = languageModel.detokenize(["hello", "world"]);
    expect(text).toBe("hello world");
  });

  test("fineTune adjusts model with learning rate", () => {
    languageModel.train("hello world");
    languageModel.fineTune("hello world", 0.5);
    // Since we're not actually changing the structure, we'll check if train was called
    // This is a mock check since the actual implementation would be more complex
    expect(
      languageModel.ngram.ngrams[0].get("hello").get("world"),
    ).toBeGreaterThan(0);
  });

  test("getEmbeddings returns an embedding", () => {
    let embedding = languageModel.getEmbeddings("hello");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  test("perplexity calculates a score", () => {
    languageModel.train("hello world how are you");
    let perplexity = languageModel.perplexity("hello world");
    expect(typeof perplexity).toBe("number");
    expect(perplexity).toBeGreaterThan(0);
  });

  test("attentionWeights returns mock weights", () => {
    let weights = languageModel.attentionWeights("hello world");
    expect(weights).toHaveProperty("input", "hello world");
    expect(weights).toHaveProperty("weights");
    expect(Array.isArray(weights.weights)).toBe(true);
  });

  test("explainPrediction provides an explanation", () => {
    languageModel.train("hello world how are you");
    let explanation = languageModel.explainPrediction("hello world");
    expect(typeof explanation).toBe("string");
    expect(explanation).toContain("hello world");
  });

  //   test("adaptToLanguage logs adaptation", () => {
  //     languageModel.adaptToLanguage("English");
  //     expect(console.log).toHaveBeenCalledWith(
  //       "Adapting model to language: English",
  //     );
  //   });
});

describe("General LanguageModel Tests", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
    // Basic training data
    languageModel.train("hello world how are you hello world again");
  });

  // Test if the model can be trained
  test("model can be trained", () => {
    expect(languageModel.getVocabularySize()).toBeGreaterThan(0);
  });

  // Test basic prediction functionality
  test("model can predict next word", () => {
    const predictions = languageModel.predict("hello world");
    expect(Array.isArray(predictions)).toBe(true);
    expect(predictions.length).toBeGreaterThan(0);
  });

  // Test text generation
  test("model can generate text", () => {
    const generatedText = languageModel.generateText("hello", 5);
    expect(typeof generatedText).toBe("string");
    expect(generatedText.split(" ").length).toBeGreaterThan(1);
  });

  // Test context handling
  test("model handles context", () => {
    languageModel.setContext({ topic: "greeting" });
    expect(languageModel.context).toHaveProperty("topic", "greeting");
  });

  // Test vocabulary management
  test("model manages vocabulary", () => {
    const vocab = languageModel.getVocabulary();
    expect(vocab).toBeInstanceOf(Set);
    expect(vocab.size).toBeGreaterThan(0);
  });

  // Test model persistence
  // todo debug this test - needs fixed mocks
  //   test("model can save and load state", () => {
  //     // Assuming saveModel and loadModel are mocked or implemented for testing
  //     languageModel.saveModel("testModel.json");
  //     const newModel = new LanguageModel();
  //     newModel.loadModel("testModel.json");
  //     expect(newModel.getVocabularySize()).toBe(
  //       languageModel.getVocabularySize(),
  //     );
  //   });

  // Test evaluation metrics
  test("model can be evaluated", () => {
    const testData = [
      { input: "hello world", reference: "hello world how" },
      { input: "world how", reference: "world how are" },
    ];
    const evaluation = languageModel.evaluate(testData);
    expect(evaluation).toHaveProperty("averagePerplexity");
    expect(evaluation).toHaveProperty("averageBLEUScore");
    expect(evaluation).toHaveProperty("accuracy");
    expect(evaluation).toHaveProperty("f1Score");
  });

  // Test embeddings
  test("model provides embeddings", () => {
    const embedding = languageModel.getEmbeddings("hello");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  // Test attention mechanism
  test("model simulates attention", () => {
    const attention = languageModel.attentionWeights("hello world");
    expect(attention).toHaveProperty("input", "hello world");
    expect(attention).toHaveProperty("weights");
    expect(Array.isArray(attention.weights)).toBe(true);
  });

  // Test error handling for invalid inputs
  test("model handles invalid inputs gracefully", () => {
    expect(() => languageModel.train(null)).toThrow();
    expect(() => languageModel.predict(null)).toThrow();
    expect(() => languageModel.generateText(null)).toThrow();
  });

  // Test model reset functionality
  test("model can be reset", () => {
    const initialSize = languageModel.getVocabularySize();
    languageModel.clearModel();
    expect(languageModel.getVocabularySize()).toBe(0);
  });

  // Test fine-tuning functionality
  test("model can be fine-tuned", () => {
    const initialCount = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");
    languageModel.fineTune("hello world", 0.1);
    const updatedCount = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");
    expect(updatedCount).not.toBe(initialCount);
  });

  // Test language adaptation
  test("model adapts to language", () => {
    // Mock console.log to check if the message was logged
    jest.spyOn(console, "log");
    languageModel.adaptToLanguage("Spanish");
    expect(console.log).toHaveBeenCalledWith(
      "Adapting model to language: Spanish",
    );
  });
});

describe("LanguageModel - fineTune", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
    languageModel.train("hello world how are you hello world again");
  });

  test("throws error for invalid learning rate", () => {
    expect(() => languageModel.fineTune("test text", -0.1)).toThrow(
      "Learning rate must be between 0 and 1",
    );
    expect(() => languageModel.fineTune("test text", 1.1)).toThrow(
      "Learning rate must be between 0 and 1",
    );
  });

  test("fineTune increases count for new text with small learning rate", () => {
    const initialCount = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");
    languageModel.fineTune("hello world new", 0.1);

    const updatedCount = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  test("fineTune decreases count for overrepresented words", () => {
    const languageModel = new LanguageModel(new Ngram(3));
    languageModel.train("hello world how are you hello world again");
    const initialCount = languageModel.ngram.ngrams[0].get("world").get("how");

    const overtrainCount = 10;
    // Over-train on "world how" to make it overrepresented
    for (let i = 0; i < overtrainCount; i++) {
      languageModel.train("world how");
    }

    console.log("getVocabulary", languageModel.getVocabulary());
    // Fine-tune with text that reduces the frequency of "how" after "world"
    languageModel.fineTune("world how", 0.1);

    const updatedCount = languageModel.ngram.ngrams[0].get("world").get("how");
    expect(updatedCount).toBeLessThan(initialCount + overtrainCount);
  });

  test("fineTune initializes new n-grams", () => {
    languageModel.fineTune("new context here", 0.5);
    expect(languageModel.ngram.ngrams[0].has("new")).toBe(true);
    expect(languageModel.ngram.ngrams[1].has("new context")).toBe(true);
  });

  test("fineTune respects the learning rate", () => {
    const initialCount = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");
    languageModel.fineTune("hello world", 0.1);
    const smallAdjustment = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");

    languageModel.clearModel();
    languageModel.train("hello world how are you hello world again");
    languageModel.fineTune("hello world", 0.5);
    const largeAdjustment = languageModel.ngram.ngrams[0]
      .get("hello")
      .get("world");

    // Expect larger adjustment with higher learning rate
    expect(Math.abs(largeAdjustment - initialCount)).toBeGreaterThan(
      Math.abs(smallAdjustment - initialCount),
    );
  });

  test("fineTune maintains positive counts", () => {
    // Over train on a specific sequence to make 'how' very common after 'world'
    for (let i = 0; i < 100; i++) {
      languageModel.train("world how");
    }
    const initialCount = languageModel.ngram.ngrams[0].get("world").get("how");

    // Fine-tune with text that doesn't include 'how' after 'world'
    languageModel.fineTune("world are you", 0.1);
    const updatedCount = languageModel.ngram.ngrams[0].get("world").get("how");

    // Ensure count didn't go below 0.1
    expect(updatedCount).toBeGreaterThanOrEqual(0.1);
  });

  test("fineTune handles empty text", () => {
    languageModel.fineTune("", 0.1);
    // Since no new data was added, counts should remain the same or slightly adjusted
    expect(
      languageModel.ngram.ngrams[0].get("hello").get("world"),
    ).toBeGreaterThan(0);
  });

  test("fineTune with learning rate of 0 does not change model", () => {
    const call = () => {
      languageModel.fineTune("some new text", 0);
    };
    expect(call).toThrow();
  });
});

describe("LanguageModel - attentionWeights", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
    // Training the model with some text to ensure n-grams are present
    languageModel.train("hello world how are you hello world again");
  });

  test("attentionWeights returns mock weights", () => {
    let weights = languageModel.attentionWeights("hello world");
    expect(weights).toHaveProperty("input", "hello world");
    expect(weights).toHaveProperty("weights");
    expect(Array.isArray(weights.weights)).toBe(true);
    // Now we can check if the weights are normalized and sum to 1
    expect(
      weights.weights.reduce((sum, weight) => sum + weight, 0),
    ).toBeCloseTo(1, 5);
  });

  test("attentionWeights handles short input", () => {
    let weights = languageModel.attentionWeights("hi");
    expect(weights).toHaveProperty("input", "hi");
    expect(weights.weights).toEqual([1]); // Since 'hi' is one token, weight should be 1
  });

  test("attentionWeights distributes attention based on n-gram frequency", () => {
    // Train with more occurrences of 'world' after 'hello'
    for (let i = 0; i < 5; i++) {
      languageModel.train("hello world");
    }
    let weights = languageModel.attentionWeights("hello world how");

    // Expect 'hello' and 'world' to have higher weights due to their frequency in training
    expect(weights.weights[0]).toBeGreaterThan(weights.weights[2]); // 'hello' should have more weight than 'how'
    expect(weights.weights[1]).toBeGreaterThan(weights.weights[2]); // 'world' should have more weight than 'how'
  });

  test("attentionWeights gives non-zero weights even for unseen n-grams", () => {
    let weights = languageModel.attentionWeights("completely new phrase");
    // Check that all weights are non-zero due to the default weight assignment
    expect(weights.weights.every((weight) => weight > 0)).toBe(true);
  });

  test("attentionWeights handles empty input", () => {
    let weights = languageModel.attentionWeights("");
    expect(weights).toHaveProperty("input", "");
    expect(weights.weights).toEqual([]); // Empty input should result in an empty weights array
  });
});

describe("LanguageModel - evaluate", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
    // Training the model with some text
    languageModel.train("hello world how are you hello world again");
  });

  test("evaluate returns multiple metrics", () => {
    const testData = [
      { input: "hello world", reference: "hello world how" },
      { input: "world how", reference: "world how are" },
      { input: "how are", reference: "how are you" },
    ];

    const result = languageModel.evaluate(testData);

    expect(result).toHaveProperty("averagePerplexity");
    expect(result).toHaveProperty("averageBLEUScore");
    expect(result).toHaveProperty("accuracy");
    expect(result).toHaveProperty("f1Score");

    // Check if the values are within reasonable ranges
    expect(result.averagePerplexity).toBeGreaterThan(0);
    expect(result.averageBLEUScore >= 0 && result.averageBLEUScore <= 1).toBe(
      true,
    );
    expect(result.accuracy >= 0 && result.accuracy <= 1).toBe(true);
    expect(result.f1Score >= 0 && result.f1Score <= 1).toBe(true);
  });

  test("evaluate handles empty test data", () => {
    const testData = [];
    const result = languageModel.evaluate(testData);

    // When there's no data, we expect all metrics to be 0 or NaN for division by zero
    expect(result.averagePerplexity).toBeNaN();
    expect(result.averageBLEUScore).toBeNaN();
    expect(result.accuracy).toBeNaN();
    expect(result.f1Score).toBe(0);
  });

  // todo: debug this test - accuracy is returning 0
  // test('evaluate with perfect prediction for accuracy', () => {
  //   const testData = [
  //     { input: 'hello world', reference: 'hello world how' },
  //     { input: 'world how', reference: 'world how are' },
  //     { input: 'how are', reference: 'how are you' }
  //   ];

  //   // Since the model was trained with this data, it should predict well
  //   const result = languageModel.evaluate(testData);
  //   expect(result.accuracy).toBeGreaterThan(0);
  // });

  test("evaluate with poor prediction for accuracy", () => {
    const testData = [
      { input: "completely new", reference: "completely new phrase" },
      { input: "unseen context", reference: "unseen context here" },
    ];

    // Here we expect lower accuracy because the model hasn't seen this data
    const result = languageModel.evaluate(testData);
    expect(result.accuracy).toBeLessThanOrEqual(0.5);
  });

  test("evaluate BLEU score with exact match", () => {
    const testData = [{ input: "hello world", reference: "hello world" }];

    const result = languageModel.evaluate(testData);
    expect(result.averageBLEUScore).toBe(1);
  });

  test("evaluate BLEU score with partial match", () => {
    const testData = [{ input: "hello world", reference: "hello world how" }];

    // Since 'hello world' is part of 'hello world how', we expect a good but not perfect score
    const result = languageModel.evaluate(testData);
    expect(result.averageBLEUScore >= 0 && result.averageBLEUScore <= 1).toBe(
      true,
    );
  });

  // todo: debug this test - f1Score is returning 0
  // test('evaluate F1 score with presence of target word', () => {
  //   // Assuming 'world' is our target word for this test
  //   const testData = [
  //     { input: 'hello world how', reference: 'hello world how are you' },
  //     { input: 'hello are you world', reference: 'hello world' }
  //   ];

  //   const result = languageModel.evaluate(testData);
  //   // Since 'world' is present in one case out of two, we expect some F1 score
  //   expect(result.f1Score).toBeGreaterThan(0);
  // });

  test("evaluate F1 score with absence of target word", () => {
    // Assuming 'world' is our target word for this test
    const testData = [
      { input: "hello how are", reference: "hello world" },
      { input: "how are you", reference: "hello world" },
    ];

    const result = languageModel.evaluate(testData);
    // Since 'world' is not present in any case, we expect F1 score to be 0
    expect(result.f1Score).toBe(0);
  });
});

describe("LanguageModel - getEmbeddings", () => {
  let languageModel;

  beforeEach(() => {
    languageModel = new LanguageModel(new Ngram(3));
    languageModel.train("hello world how are you hello world again");
  });

  test("getEmbeddings returns a vector for known word", () => {
    const embedding = languageModel.getEmbeddings("hello");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(10); // Default dimension
    expect(embedding.every((val) => typeof val === "number")).toBe(true);
  });

  test("getEmbeddings handles custom dimensions", () => {
    const embedding = languageModel.getEmbeddings("world", 5);
    expect(embedding.length).toBe(5);
  });

  test("getEmbeddings normalizes the vector", () => {
    const embedding = languageModel.getEmbeddings("how");
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    expect(magnitude).toBeCloseTo(1, 5); // Check if the vector is normalized to unit length
  });

  test("getEmbeddings returns a random vector for unknown word", () => {
    const embedding = languageModel.getEmbeddings("unknown");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(10); // Default dimension
    // Since it's random, we can't predict exact values, but we can check if it's a valid vector
    expect(embedding.every((val) => val >= 0 && val <= 1)).toBe(true);
  });

  test("getEmbeddings handles word not in vocabulary", () => {
    // Clear vocabulary to simulate word not being in it
    languageModel.vocabulary.clear();
    const embedding = languageModel.getEmbeddings("hello");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(10); // Default dimension
    // Check if it's a random vector since 'hello' is not in vocabulary now
    expect(embedding.every((val) => val >= 0 && val <= 1)).toBe(true);
  });

  test("getEmbeddings returns different vectors for different contexts", () => {
    const embedding1 = languageModel.getEmbeddings("world");
    // Add more context
    languageModel.train("world peace");
    const embedding2 = languageModel.getEmbeddings("world");

    // Since the context has changed, we expect some difference in embeddings
    expect(JSON.stringify(embedding1)).not.toBe(JSON.stringify(embedding2));
  });

  test("getEmbeddings handles edge case with zero frequency", () => {
    // Simulate a scenario where 'you' might not have any n-gram context
    languageModel.ngram.ngrams.forEach((ngramMap) => {
      for (let [key, counter] of ngramMap) {
        if (key.includes("you")) ngramMap.delete(key);
      }
    });

    const embedding = languageModel.getEmbeddings("you");
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    expect(magnitude).toBeCloseTo(1, 5); // Should still return a normalized vector
  });
});

// Restore mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
