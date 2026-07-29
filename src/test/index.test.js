const GrokJS = require("../../index");

describe("Package Root Exports (index.js)", () => {
  test("Exports all core and TODO classes", () => {
    expect(GrokJS.LanguageModel).toBeDefined();
    expect(GrokJS.Tokenizer).toBeDefined();
    expect(GrokJS.Ngram).toBeDefined();
    expect(GrokJS.Counter).toBeDefined();

    expect(GrokJS.Normalizer).toBeDefined();
    expect(GrokJS.Vocabulary).toBeDefined();
    expect(GrokJS.FrequencyDistribution).toBeDefined();
    expect(GrokJS.ProbabilityDistribution).toBeDefined();
    expect(GrokJS.MarkovChain).toBeDefined();
    expect(GrokJS.Corpus).toBeDefined();
    expect(GrokJS.Embedding).toBeDefined();
    expect(GrokJS.AttentionMechanism).toBeDefined();
    expect(GrokJS.EvaluationMetrics).toBeDefined();
    expect(GrokJS.InferenceEngine).toBeDefined();
    expect(GrokJS.FactServer).toBeDefined();
    expect(GrokJS.FormAutocompleteEngine).toBeDefined();
  });

  test("Instantiates all exported classes successfully", () => {
    expect(new GrokJS.Normalizer()).toBeInstanceOf(GrokJS.Normalizer);
    expect(new GrokJS.Vocabulary()).toBeInstanceOf(GrokJS.Vocabulary);
    expect(new GrokJS.FrequencyDistribution()).toBeInstanceOf(GrokJS.FrequencyDistribution);
    expect(new GrokJS.ProbabilityDistribution()).toBeInstanceOf(GrokJS.ProbabilityDistribution);
    expect(new GrokJS.MarkovChain()).toBeInstanceOf(GrokJS.MarkovChain);
    expect(new GrokJS.Corpus()).toBeInstanceOf(GrokJS.Corpus);
    expect(new GrokJS.Embedding()).toBeInstanceOf(GrokJS.Embedding);
    expect(new GrokJS.AttentionMechanism()).toBeInstanceOf(GrokJS.AttentionMechanism);
    expect(new GrokJS.FactServer()).toBeInstanceOf(GrokJS.FactServer);
    expect(new GrokJS.FormAutocompleteEngine({ autoSave: false })).toBeInstanceOf(
      GrokJS.FormAutocompleteEngine
    );
  });
});
