const LanguageModel = require("../language-model/language-model");
const Ngram = require("../ngram/ngram");
const fs = require("fs");

jest.spyOn(console, "log").mockImplementation(() => {});

jest.mock("fs", () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() =>
    JSON.stringify({
      ngram: {
        ngrams: [{ hello: { world: 1 } }, { "hello world": { how: 1 } }],
      },
      maxN: 3,
      vocabulary: ["hello", "world", "how", "are", "you"],
      context: {},
    }),
  ),
}));

describe("Integrated Test Suite for Counter, LanguageModel, and Ngram", () => {
  let languageModel;
  let ngram;

  beforeEach(() => {
    ngram = new Ngram(3);
    languageModel = new LanguageModel(ngram);
  });

  // Test training the LanguageModel which uses Ngram and Counter
  test("Training LanguageModel updates Ngram counts", () => {
    languageModel.train("hello world how are you");
    expect(ngram.ngrams[0].get("hello").get("world")).toBe(1);
    expect(ngram.ngrams[1].get("world how").get("are")).toBe(1);
  });

  // Test prediction functionality
  test("LanguageModel prediction using Ngram data", () => {
    languageModel.train("hello world how are you hello world");
    const predictions = languageModel.predict("hello world");
    expect(predictions).toContain("how");
  });

  // Test text generation
  test("Text generation from LanguageModel", () => {
    languageModel.train("hello world how are you hello world again");
    const generatedText = languageModel.generateText("hello", 5);
    expect(generatedText.startsWith("hello")).toBe(true);
    expect(generatedText.split(" ").length).toBeGreaterThan(1);
  });

  // Test context management
  test("Context management affects predictions", () => {
    languageModel.train("hello world how are you");
    languageModel.setContext({ topic: "greeting" });
    const predictions = languageModel.predict("hello");
    // Assuming context might influence predictions, here we're just checking if context is set
    expect(languageModel.context).toHaveProperty("topic", "greeting");
  });

  // Test vocabulary handling
  test("Vocabulary handling in LanguageModel", () => {
    languageModel.train("hello world");
    expect(languageModel.getVocabularySize()).toBe(2);
    expect(languageModel.getVocabulary().has("hello")).toBe(true);
  });

  // Test model persistence
  test("Model persistence", () => {
    languageModel.train("hello world");
    languageModel.saveModel("testModel.json");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "testModel.json",
      expect.any(String),
    );

    const newModel = new LanguageModel(new Ngram(3));
    newModel.loadModel("testModel.json");
    expect(newModel.getVocabularySize()).toBe(5);
  });

  // Test evaluation
  test("Evaluation of LanguageModel", () => {
    languageModel.train("hello world how are you hello world again");
    const testData = [
      { input: "hello world", reference: "hello world how" },
      { input: "world how", reference: "world how are" },
    ];
    const evaluation = languageModel.evaluate(testData);
    expect(evaluation).toHaveProperty("averagePerplexity", expect.any(Number));
    expect(evaluation).toHaveProperty("averageBLEUScore", expect.any(Number));
    expect(evaluation).toHaveProperty("accuracy", expect.any(Number));
    expect(evaluation).toHaveProperty("f1Score", expect.any(Number));
  });

  // Test fine-tuning
  test("Fine-tuning LanguageModel", () => {
    languageModel.train("hello world how are you");
    const initialCount = ngram.ngrams[0].get("hello").get("world");
    languageModel.fineTune("hello world new", 0.1);
    const updatedCount = ngram.ngrams[0].get("hello").get("world");
    expect(updatedCount).not.toBe(initialCount);
  });

  // Test embeddings
  test("Embeddings from LanguageModel", () => {
    languageModel.train("hello world how are you");
    const embedding = languageModel.getEmbeddings("hello");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  // Test attention mechanism
  test("Attention mechanism simulation", () => {
    languageModel.train("hello world how are you");
    const attention = languageModel.attentionWeights("hello world");
    expect(attention).toHaveProperty("input", "hello world");
    expect(attention).toHaveProperty("weights");
    expect(Array.isArray(attention.weights)).toBe(true);
    // Check if the weights sum to 1
    expect(
      attention.weights.reduce((sum, weight) => sum + weight, 0),
    ).toBeCloseTo(1, 5);
  });

  // Test explanation for predictions
  test("Explanation for predictions", () => {
    languageModel.train("hello world how are you");
    const explanation = languageModel.explainPrediction("hello world");
    expect(typeof explanation).toBe("string");
    expect(explanation).toContain("hello world");
  });

  // Test language adaptation
  test("Language adaptation", () => {
    jest.spyOn(console, "log");
    languageModel.adaptToLanguage("Spanish");
    expect(console.log).toHaveBeenCalledWith(
      "Adapting model to language: Spanish",
    );
  });

  // Test error handling
  test("Error handling for invalid inputs", () => {
    expect(() => languageModel.train(null)).toThrow();
    expect(() => languageModel.predict(null)).toThrow();
    expect(() => languageModel.generateText(null)).toThrow();
  });

  // Test model reset functionality
  test("Model can be reset", () => {
    languageModel.train("hello world");
    const initialSize = languageModel.getVocabularySize();
    languageModel.clearModel();
    expect(languageModel.getVocabularySize()).toBe(0);
  });
});

// Reset all mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
