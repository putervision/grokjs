declare module "@putervision/grokjs" {
  export class Counter {
    constructor(initial?: any[] | Record<string, number>);
    increment(item: any, n?: number): void;
    decrement(item: any, n?: number): void;
    get(item: any): number;
    total(): number;
    mostCommon(n?: number): Array<[any, number]>;
    elements(): any[];
    subtract(other: Counter): Counter;
    toString(): string;
  }

  export interface TokenizerOptions {
    lowerCase?: boolean;
    preserveCase?: boolean;
    handleContractions?: boolean;
    addSpecialTokens?: boolean;
    removePunctuation?: boolean;
  }

  export class Tokenizer {
    constructor(options?: TokenizerOptions);
    tokenize(text: string): string[];
    detokenize(tokens: string[]): string;
    addSpecialTokens(tokens: string[]): string[];
    removeSpecialTokens(tokens: string[]): string[];
  }

  export interface NgramOptions {
    debug?: boolean;
  }

  export class Ngram {
    constructor(maxN?: number, options?: NgramOptions);
    maxN: number;
    ngrams: Array<Map<string, Counter>>;
    tokenizer: Tokenizer;
    tokenize(text: string): string[];
    updateModel(tokens: string[]): void;
    predictNextWord(prefix: string): string[];
    learn(text: string): void;
  }

  export interface LanguageModelOptions {
    debug?: boolean;
  }

  export class LanguageModel {
    constructor(ngram?: Ngram, maxN?: number);
    ngram: Ngram;
    maxN: number;
    vocabulary: Set<string>;
    context: Record<string, any>;
    train(text: string): void;
    predict(prefix: string, numPredictions?: number): string[];
    generateText(start: string, length?: number, options?: GenerationOptions): string;
    setContext(context: Record<string, any>): void;
    getVocabulary(): Set<string>;
    getVocabularySize(): number;
    evaluate(testData: Array<{ input: string; reference: string }>): EvaluationResult;
    bleuPrecision(candidate: string[], reference: string[]): number;
    exportState(): Record<string, any>;
    importState(state: Record<string, any> | string): void;
    saveModel(path: string): void;
    loadModel(path: string): void;
    updateModel(newText: string): void;
    clearModel(): void;
    getProbability(word: string, context: string): number;
    tokenize(text: string): string[];
    detokenize(tokens: string[]): string;
    fineTune(text: string, learningRate: number): void;
    getEmbeddings(word: string, dimensions?: number): number[];
    randomUnitVector(dimensions: number): number[];
    perplexity(text: string): number;
    attentionWeights(input: string): { input: string; weights: number[] };
    explainPrediction(prefix: string): string;
    adaptToLanguage(language: string): void;
    healthCheck(): {
      isTrained: boolean;
      vocabularySize: number;
      ngramLevels: number;
      maxNgramLevel: number;
      ready: boolean;
    };
    predictWithConfidence(
      prefix: string,
      numPredictions?: number
    ): Array<{ word: string; probability: number; ngramLevel: number }>;
  }

  export interface NormalizerOptions {
    lowerCase?: boolean;
    stripAccents?: boolean;
    cleanUnicode?: boolean;
    removeExtraWhitespace?: boolean;
  }

  export class Normalizer {
    constructor(options?: NormalizerOptions);
    normalize(text: string, options?: NormalizerOptions): string;
    stripAccents(text: string): string;
    caseFold(text: string): string;
    cleanUnicode(text: string): string;
    removeExtraWhitespace(text: string): string;
  }

  export interface VocabularyOptions {
    unkToken?: string;
    bosToken?: string;
    eosToken?: string;
    padToken?: string;
  }

  export class Vocabulary {
    constructor(options?: VocabularyOptions);
    addToken(token: string): number;
    buildFromTokens(tokens: string[], minFreq?: number): void;
    encode(tokens: string[]): number[];
    decode(ids: number[]): string[];
    lookup(token: string): number;
    lookupId(id: number): string;
    size(): number;
  }

  export class FrequencyDistribution {
    constructor();
    record(context: string, token: string, count?: number): void;
    count(context: string, token: string): number;
    contextTotal(context: string): number;
    mostCommon(context: string, n?: number): Array<[string, number]>;
    allContexts(): string[];
  }

  export class ProbabilityDistribution {
    constructor(freqDist?: FrequencyDistribution);
    mle(context: string, word: string): number;
    laplace(context: string, word: string, k?: number, vocabSize?: number): number;
    stupidBackoff(context: string, word: string, alpha?: number): number;
    sample(context: string, temperature?: number): string;
  }

  export class MarkovChain {
    constructor(order?: number);
    train(sequences: string[][]): void;
    getTransitionMatrix(): Record<string, Record<string, number>>;
    getNextStateProbability(state: string): Record<string, number>;
    generatePath(startState: string, steps?: number): string[];
  }

  export interface CorpusStats {
    documentCount: number;
    sentenceCount: number;
    tokenCount: number;
    uniqueTokenCount: number;
    typeTokenRatio: number;
  }

  export class Corpus {
    constructor();
    addDocument(doc: string): void;
    getSentences(): string[];
    getTokens(): string[];
    getStats(): CorpusStats;
    split(
      trainRatio?: number,
      valRatio?: number,
      testRatio?: number
    ): {
      train: string[];
      val: string[];
      test: string[];
    };
  }

  export class Embedding {
    constructor(dimensions?: number);
    dimensions: number;
    build(corpus: string[], dimensions?: number): void;
    getVector(word: string): number[];
    cosineSimilarity(wordA: string, wordB: string): number;
    mostSimilar(word: string, topN?: number): Array<{ word: string; similarity: number }>;
    vectorArithmetic(
      positive: string[],
      negative?: string[]
    ): Array<{ word: string; similarity: number }>;
  }

  export class AttentionMechanism {
    constructor(maxN?: number);
    computeWeights(tokens: string[]): number[];
    getHeatmap(tokens: string[]): number[][];
    aggregateFocus(sequence: string[]): { token: string; focusScore: number }[];
  }

  export interface EvaluationResult {
    averagePerplexity: number;
    averageBLEUScore: number;
    accuracy: number;
    f1Score: number;
  }

  export class EvaluationMetrics {
    static perplexity(model: LanguageModel, text: string): number;
    static bleu(candidate: string[], reference: string[], maxN?: number): number;
    static rougeL(candidate: string[], reference: string[]): number;
    static precisionRecallF1(
      predicted: string[],
      actual: string[]
    ): {
      precision: number;
      recall: number;
      f1Score: number;
    };
    static accuracy(predicted: string[], actual: string[]): number;
  }

  export interface GenerationOptions {
    temperature?: number;
    topK?: number;
    topP?: number;
    repetitionPenalty?: number;
    stopSequences?: string[];
  }

  export class InferenceEngine {
    static generate(
      model: LanguageModel,
      prompt: string,
      length?: number,
      options?: GenerationOptions
    ): string;
    static beamSearch(
      model: LanguageModel,
      prompt: string,
      length?: number,
      beamWidth?: number
    ): string;
    static *generateStream(
      model: LanguageModel,
      prompt: string,
      length?: number,
      options?: GenerationOptions
    ): AsyncGenerator<string>;
  }

  export class FactServer {
    constructor();
    addFact(category: string, key: string, value: string): void;
    queryFacts(
      query: string,
      topN?: number
    ): Array<{
      category: string;
      key: string;
      value: string;
      relevance: number;
    }>;
    augmentPrompt(prompt: string, topN?: number): string;
    serialize(): string;
    deserialize(json: string): FactServer;
  }

  export interface FormAutocompleteOptions {
    model?: LanguageModel;
    autoSave?: boolean;
    storageKey?: string;
    maxSuggestions?: number;
  }

  export class FormAutocompleteEngine {
    constructor(options?: FormAutocompleteOptions);
    static inject(options?: FormAutocompleteOptions): FormAutocompleteEngine;
    static getConsoleSnippet(): string;
    attachToDocument(): void;
    loadState(): void;
    saveState(): void;
    preloadCorpora(presetKeys?: string[], customNotes?: string): void;
    showSetupModal(onComplete?: () => void): void;
    predict(text: string): string | null;
  }
}
