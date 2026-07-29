# @putervision/grokjs

[![npm version](https://img.shields.io/npm/v/@putervision/grokjs.svg)](https://www.npmjs.com/package/@putervision/grokjs)
[![license](https://img.shields.io/npm/l/@putervision/grokjs.svg)](LICENSE)
[![tests](https://img.shields.io/badge/tests-164%20passed-brightgreen.svg)](#testing)

> A high-performance, modular JavaScript & TypeScript implementation of Language Models (LMs), N-gram text generators, and Natural Language Processing (NLP) tools — inspired by state-of-the-art language architectures like xAI's Grok. _(Not affiliated with xAI)_.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Installation](#installation)
- [Module Summary (16 Modular Classes)](#module-summary-16-modular-classes)
- [Quick Start](#quick-start)
- [Class References & Detailed API](#class-references--detailed-api)
  - [1. LanguageModel](#1-languagemodel)
  - [2. Tokenizer](#2-tokenizer)
  - [3. Ngram](#3-ngram)
  - [4. Counter](#4-counter)
  - [5. Normalizer](#5-normalizer)
  - [6. Vocabulary](#6-vocabulary)
  - [7. FrequencyDistribution](#7-frequencydistribution)
  - [8. ProbabilityDistribution](#8-probabilitydistribution)
  - [9. MarkovChain](#9-markovchain)
  - [10. Corpus](#10-corpus)
  - [11. Embedding](#11-embedding)
  - [12. AttentionMechanism](#12-attentionmechanism)
  - [13. EvaluationMetrics](#13-evaluationmetrics)
  - [14. InferenceEngine](#14-inferenceengine)
  - [15. FactServer](#15-factserver)
  - [16. FormAutocompleteEngine](#16-formautocompleteengine)
- [TypeScript Support](#typescript-support)
- [Model Serialization](#model-serialization)
- [Interactive Documentation Website](#interactive-documentation-website)
- [Testing & Building](#testing--building)
- [Requirements](#requirements)
- [Security](#security)
- [Changelog](#changelog)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

---

## Overview & Architecture

`@putervision/grokjs` is designed to provide developers with zero-dependency (or minimal dependency) client-side and server-side NLP capabilities in pure JavaScript. It equips Node.js and browser applications with fast text generation, tokenization, n-gram probability distributions, semantic word embeddings, attention visualization, and RAG fact injection.

```
                  ┌──────────────────────────────────────────────┐
                  │                 LanguageModel                │
                  └──────┬────────────────────┬──────────────────┘
                         │                    │
          ┌──────────────┴───────┐   ┌────────┴──────────────┐
          │     InferenceEngine  │   │   AttentionMechanism  │
          └──────────────┬───────┘   └────────┬──────────────┘
                         │                    │
   ┌─────────────────────┼────────────────────┼─────────────────────┐
   │                     │                    │                     │
┌──┴───────┐   ┌─────────┴──────────┐   ┌─────┴──────┐    ┌─────────┴─────────┐
│Tokenizer │   │ProbabilityDistro   │   │ Embedding  │    │EvaluationMetrics  │
└──┬───────┘   └─────────┬──────────┘   └────────────┘    └───────────────────┘
   │                     │
┌──┴────────┐  ┌─────────┴──────────┐
│Normalizer │  │FrequencyDistro     │
└───────────┘  └─────────┬──────────┘
                         │
                   ┌─────┴──────┐
                   │   Counter  │
                   └────────────┘
```

---

## Installation

```bash
npm install @putervision/grokjs
```

Or run browser bundle directly:

```html
<script src="node_modules/@putervision/grokjs/dist/grokjs.bundle.js"></script>
<script>
  const { LanguageModel, InferenceEngine } = GrokJS;
  const lm = new LanguageModel();
  lm.train("Hello world! GrokJS enables fast browser language modeling.");
  console.log(lm.generateText("Hello", 5));
</script>
```

---

## Module Summary (16 Modular Classes)

| Class                     | Category        | Description                                                                          |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `LanguageModel`           | Core Engine     | Primary facade for training, text generation, serialization, and context management. |
| `Tokenizer`               | Processing      | Multilingual regex tokenization with date, timestamp, and contraction handling.      |
| `Ngram`                   | Core Engine     | Efficient N-gram model up to 5-grams using hash maps and counters.                   |
| `Counter`                 | Math / Data     | High-performance item frequency counter (Python `collections.Counter` port).         |
| `Normalizer`              | Preprocessing   | Accent stripping, NFKC unicode cleaning, lowercasing, and whitespace collapse.       |
| `Vocabulary`              | Data Struct     | Token-to-ID bidirectional dictionary with `<unk>`, `<s>`, `</s>`, `<pad>` handling.  |
| `FrequencyDistribution`   | Distributions   | Conditional and joint N-gram frequency counting per context.                         |
| `ProbabilityDistribution` | Distributions   | MLE, Laplace (Add-k) smoothing, Stupid Backoff, and softmax temperature sampling.    |
| `MarkovChain`             | Sequence Gen    | N-th order Markov chain sequence generator and state transition matrix.              |
| `Corpus`                  | Processing      | Multi-document dataset loader, sentence extractor, TTR stats, and train/test splits. |
| `Embedding`               | Vector Space    | Co-occurrence word vector space representations, cosine similarity, and vector math. |
| `AttentionMechanism`      | Visualization   | Self-attention weights, sequence focus scoring, and 2D N x N heatmap matrix.         |
| `EvaluationMetrics`       | Benchmark       | Perplexity, BLEU (with brevity penalty), ROUGE-L, F1 Score, and Accuracy.            |
| `InferenceEngine`         | Generation      | Greedy, Temperature, Top-K, Top-P (nucleus), Repetition Penalty, and Beam Search.    |
| `FactServer`              | RAG / Knowledge | Key-value fact store and Retrieval-Augmented Generation (RAG) prompt injection.      |
| `FormAutocompleteEngine`  | Autocomplete    | Self-learning DOM form autocomplete engine with continuous localStorage persistence.  |

---

## Quick Start

```javascript
const {
  LanguageModel,
  InferenceEngine,
  FactServer,
} = require("@putervision/grokjs");

// 1. Initialize Language Model
const lm = new LanguageModel();

// 2. Train on sample corpus
lm.train(
  "GrokJS is an open source JavaScript library for natural language processing. " +
    "It supports n-gram language modeling, text generation, and retrieval augmented generation.",
);

// 3. Predict next word
console.log("Prediction for 'grokjs is':", lm.predict("grokjs is", 3));

// 4. Generate text with nucleus (top-p) sampling and temperature
const generated = lm.generateText("grokjs is", 10, {
  temperature: 0.8,
  topP: 0.9,
  repetitionPenalty: 1.2,
});
console.log("Generated:", generated);

// 5. Use Fact Server for RAG Prompt Injection
const factServer = new FactServer();
factServer.addFact("library", "GrokJS Version", "1.2.0");
factServer.addFact("author", "Created By", "PuterVision");

const prompt = "Tell me about GrokJS Version and author.";
const augmentedPrompt = factServer.augmentPrompt(prompt);
console.log("Augmented RAG Prompt:", augmentedPrompt);
```

---

## Class References & Detailed API

### 1. LanguageModel

The primary facade class wrapping `Ngram`, `InferenceEngine`, and `EvaluationMetrics`.

- `train(text: string): void`: Trains model on input text.
- `predict(prefix: string, numPredictions?: number): string[]`: Returns top predicted next words.
- `generateText(start: string, length?: number, options?: GenerationOptions): string`: Generates text continuations.
- `saveModel(path: string): void`: Serializes model state (including JavaScript `Map`s) to JSON.
- `loadModel(path: string): void`: Restores model state from JSON.
- `perplexity(text: string): number`: Computes model perplexity.
- `getEmbeddings(word: string, dimensions?: number): number[]`: Returns normalized embedding vector.
- `attentionWeights(input: string): { input: string, weights: number[] }`: Returns attention focus scores.
- `healthCheck(): Object`: Returns model readiness status with vocabulary size and ngram level info.
- `predictWithConfidence(prefix: string, numPredictions?: number): Array<{word, probability, ngramLevel}>`: Returns predictions with probability scores.

> **Note:** `saveModel()` and `loadModel()` use Node.js `fs` module and are only available in Node.js environments. For browser usage, serialize manually using `JSON.stringify()` and `localStorage`.

### 2. Tokenizer

Handles multi-lingual regex tokenization, date/timestamp preservation, contractions, and special tokens.

```javascript
const { Tokenizer } = require("@putervision/grokjs");
const tokenizer = new Tokenizer({
  handleContractions: true,
  removePunctuation: true,
});

const tokens = tokenizer.tokenize("It's 2026-07-29. The price is $10.99!");
// ['it', 'is', '2023-02-04', 'the', 'price', 'is', '10.99']
```

### 3. Ngram

Maintains n-gram frequency trees up to `maxN` = 5.

```javascript
const { Ngram } = require("@putervision/grokjs");
const ngram = new Ngram(3);
ngram.learn("hello world how are you");
console.log(ngram.predictNextWord("hello world"));
```

### 4. Counter

High-performance item counting dictionary.

```javascript
const { Counter } = require("@putervision/grokjs");
const counter = new Counter(["a", "b", "a", "c", "b", "b"]);
console.log(counter.get("b")); // 3
console.log(counter.mostCommon(2)); // [['b', 3], ['a', 2]]
```

### 5. Normalizer

Clean and standardize raw text strings.

```javascript
const { Normalizer } = require("@putervision/grokjs");
const norm = new Normalizer({ stripAccents: true, lowerCase: true });
console.log(norm.normalize("  Café   CON  Leche!  ")); // 'cafe con leche!'
```

### 6. Vocabulary

Build integer ID dictionaries and handle special tokens.

```javascript
const { Vocabulary } = require("@putervision/grokjs");
const vocab = new Vocabulary();
vocab.buildFromTokens(["apple", "banana", "apple"], 1);
const ids = vocab.encode(["apple", "unknown_word"]); // [4, 1] (1 is <unk>)
console.log(vocab.decode(ids)); // ['apple', '<unk>']
```

### 7. FrequencyDistribution

Tracks N-gram joint and conditional token frequencies.

```javascript
const { FrequencyDistribution } = require("@putervision/grokjs");
const fd = new FrequencyDistribution();
fd.record("hello", "world", 5);
console.log(fd.count("hello", "world")); // 5
```

### 8. ProbabilityDistribution

Computes MLE, Laplace (Add-k) smoothing, Stupid Backoff, and softmax temperature sampling.

```javascript
const {
  ProbabilityDistribution,
  FrequencyDistribution,
} = require("@putervision/grokjs");
const pd = new ProbabilityDistribution(fd);
console.log(pd.laplace("hello", "world", 1, 1000));
console.log(pd.sample("hello", 0.7));
```

### 9. MarkovChain

N-th order Markov chain sequence generator and state transition matrix calculator.

```javascript
const { MarkovChain } = require("@putervision/grokjs");
const mc = new MarkovChain(1);
mc.train([["the", "cat", "sat", "on", "mat"]]);
console.log(mc.getTransitionMatrix());
console.log(mc.generatePath("the", 4));
```

### 10. Corpus

Text dataset loader, sentence extractor, type-token ratio (TTR) stats, and train/val/test splits.

```javascript
const { Corpus } = require("@putervision/grokjs");
const corpus = new Corpus();
corpus.addDocument("Doc 1 content...");
corpus.addDocument("Doc 2 content...");
console.log(corpus.getStats()); // { documentCount, sentenceCount, tokenCount, typeTokenRatio }
const splits = corpus.split(0.8, 0.1, 0.1);
```

### 11. Embedding

Co-occurrence based vector space representation and similarity math.

> **Note:** Embeddings use co-occurrence with hash projection. For production-quality word vectors, consider training with larger corpora or using pre-trained embeddings (Word2Vec, GloVe).

```javascript
const { Embedding } = require("@putervision/grokjs");
const emb = new Embedding(10);
emb.build([
  "king queen prince princess royal kingdom",
  "man woman boy girl human",
]);
console.log(emb.cosineSimilarity("king", "queen"));
console.log(emb.mostSimilar("king", 3));
```

### 12. AttentionMechanism

Computes self-attention weights and 2D heatmap matrix.

> **Note:** AttentionMechanism provides heuristic-based attention visualization (position × length weighting with distance penalties). For production attention weights, integrate with a trained transformer model.

```javascript
const { AttentionMechanism } = require("@putervision/grokjs");
const attn = new AttentionMechanism();
console.log(attn.computeWeights(["grok", "language", "model"]));
console.log(attn.getHeatmap(["grok", "language", "model"]));
```

### 13. EvaluationMetrics

Standardized NLP benchmark metrics: Perplexity, BLEU, ROUGE-L, F1, Accuracy.

```javascript
const { EvaluationMetrics } = require("@putervision/grokjs");
console.log(EvaluationMetrics.bleu(["hello", "world"], ["hello", "world"])); // 1.0
console.log(
  EvaluationMetrics.rougeL(["the", "quick", "fox"], ["the", "fast", "fox"]),
);
```

### 14. InferenceEngine

Advanced text generation pipeline with Top-K, Top-P (nucleus), temperature, repetition penalty, and Beam Search.

```javascript
const { InferenceEngine, LanguageModel } = require("@putervision/grokjs");
const lm = new LanguageModel();
lm.train("grokjs is an open source language model library");

const output = InferenceEngine.generate(lm, "grokjs", 5, {
  temperature: 0.7,
  topK: 3,
  topP: 0.9,
  repetitionPenalty: 1.2,
});

const beamOutput = InferenceEngine.beamSearch(lm, "grokjs", 4, 3);
```

### 15. FactServer

RAG key-value fact store and prompt context injector.

```javascript
const { FactServer } = require("@putervision/grokjs");
const fs = new FactServer();
fs.addFact("science", "speed of light", "299,792,458 m/s");
console.log(fs.queryFacts("What is the speed of light?"));
console.log(fs.augmentPrompt("What is the speed of light?"));
```

### 16. FormAutocompleteEngine & Copy-Paste Webpage Autocomplete

Attach self-learning AI autocomplete to all HTML form inputs, textareas, and contenteditable fields on any webpage. Automatically trains as users type and persists state to `localStorage`.

```javascript
const { FormAutocompleteEngine } = require("@putervision/grokjs");

// Attach self-learning autocomplete to current webpage
FormAutocompleteEngine.inject({ autoSave: true });
```

#### 🚀 Instant Copy-Paste Browser Console Snippet

Copy-paste this one-liner into your browser Developer Console (`F12` -> `Console`) on **ANY webpage** (e.g. Gmail, GitHub, Notion, Twitter, Reddit) to instantly equip the page with self-learning AI autocomplete:

```javascript
(function () {
  if (window.__grokjs_autocomplete)
    return console.log("GrokJS Autocomplete active.");
  function init() {
    if (window.GrokJS) {
      window.__grokjs_autocomplete =
        window.GrokJS.FormAutocompleteEngine.inject();
      console.log(
        "%cGrokJS Self-Learning Autocomplete Injected! Press Tab or Right Arrow to accept completions.",
        "color:#38bdf8;font-size:14px;font-weight:bold;",
      );
    } else {
      console.error("GrokJS failed to load.");
    }
  }
  if (window.GrokJS) {
    init();
  } else {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@putervision/grokjs@1.2.0/dist/grokjs.bundle.js";
    script.onload = init;
    document.head.appendChild(script);
  }
})();
```

---

## TypeScript Support

Full TypeScript definitions are included out of the box (`index.d.ts`):

```typescript
import {
  LanguageModel,
  GenerationOptions,
  EvaluationResult,
} from "@putervision/grokjs";

const lm: LanguageModel = new LanguageModel();
lm.train("TypeScript support is fully integrated.");

const opts: GenerationOptions = { temperature: 0.8, topP: 0.9 };
const text: string = lm.generateText("TypeScript", 5, opts);
```

---

## Model Serialization

Models are serialized to JSON with proper handling of JavaScript `Map`s and `Counter` instances:

```javascript
// Save trained model
lm.saveModel("./model.json");

// Load trained model in another process
const newLm = new LanguageModel();
newLm.loadModel("./model.json");
console.log(newLm.getVocabularySize());
```

---

## Interactive Documentation Website

An interactive, single-page web documentation and live playground application is available in the `docs/` directory.

To launch locally:

```bash
npx http-server docs -p 8080
```

Open `http://localhost:8080` in your browser to experience:

- **Live LM Playground**: Train models in real-time in the browser, adjust temperature, top-k, top-p, and test text generation.
- **Attention Visualizer**: View interactive attention heatmaps for any sequence.
- **RAG Fact Server Demo**: Query key-value fact stores and observe prompt context augmentation live.

---

## Testing & Building

Run all 18 test suites (164 tests):

```bash
npm test
```

Build browser UMD bundle (`dist/grokjs.bundle.js`):

```bash
npm run build
```

---

## Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- Modern browser (ES6+ support)

---

## Security

`@putervision/grokjs` is designed with security in mind:

- **Client-side only**: All processing happens locally in your browser or Node.js process
- **No network calls**: The library never makes HTTP requests or sends data externally
- **No eval()**: No dynamic code execution or `eval()` usage
- **Minimal dependencies**: Only `franc-cjs` for language detection (read-only)
- **No data exfiltration**: Your text data never leaves your environment

The `FormAutocompleteEngine` uses `localStorage` for persistence. If you're deploying in a shared environment, be aware that stored autocomplete data is accessible to any script running on the same origin.

For vulnerability reports, see [SECURITY.md](SECURITY.md).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## License

[MIT](LICENSE) © PuterVision
