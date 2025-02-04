# ngram-js

JavaScript ngrams and supporting utils

- functional classes: LanguageModel, Ngram, Counter
- todo: Tokenizer, Normalizer, FrequencyDistribution, ProbabilityDistribution, MarkovChain, Corpus, Vocaublary, Embedding, AttentionMechanism, EvaluationMetrics, InferenceEngine, FactServer

#

# LanguageModel Class

A JavaScript implementation of a basic Language Model (LM) designed to facilitate natural language processing tasks, inspired by advanced models like xAI's Grok.

## Features

- **Training**: Enables the model to learn linguistic patterns from provided textual data. Utilizes n-gram structures to capture word sequences and their frequencies, allowing the model to understand and generate language based on observed patterns.

- **Prediction**: Predicts the next word or sequence given a context or prefix. This method leverages n-gram data to suggest multiple possible continuations, with options to limit the number of predictions returned.

- **Text Generation**: Generates coherent text starting from a given sequence. The length of the generated text can be configured, and it uses the learned patterns to create contextually relevant continuations, simulating a conversation or narrative flow.

- **Context Management**: Sets or updates the context which might influence the model's predictions. This can simulate different conversational states or writing focus areas, enhancing the relevance of predictions based on interactions or specified topics.

- **Vocabulary Handling**: Manages the vocabulary of the model by adding new words during training and providing methods to retrieve the vocabulary or its size. This gives insights into the model's lexical scope and aids in understanding its capabilities.

- **Model Persistence**: Includes functionality to save the model's current state to a file or load a previously saved state. This ensures that the model's learned knowledge can be preserved, shared, or continued from where it left off.

- **Evaluation**: Performs basic performance evaluation using metrics like perplexity to gauge how well the model predicts unseen data. Additionally, it includes metrics such as BLEU score for text similarity, accuracy for prediction correctness, and F1 score for classification tasks, providing a broader assessment of model performance.

- **Fine-Tuning**: Simulates the process of fine-tuning by adjusting the frequency counts of n-grams based on new data with a specified learning rate. This allows the model to adapt to new patterns or domains without losing its general knowledge, akin to transfer learning in neural networks.

- **Embeddings**: Provides simulated embeddings for words based on their frequency in different n-gram contexts. These embeddings can be used for semantic similarity tasks or to enhance model interpretability.

- **Attention Mechanism**: Simulates attention by calculating weights for parts of the input based on n-gram frequencies. This helps in understanding which parts of the input text the model focuses on when making predictions, mimicking the concept of attention in neural networks.

- **Explanation**: Offers explanations for predictions by detailing how the context or n-gram frequencies led to the model's output, enhancing the interpretability of the model's decisions.

- **Language Adaptation** (not yet complete): Provides basic functionality to adapt the model's behavior or parameters to different languages, allowing for some level of multilingual capability or adjustment for language-specific nuances.

This class aims to build a foundation for more complex NLP applications, providing a starting point for developers looking to explore or implement language modeling in JavaScript.

example usage:

```javascript
const LanguageModel = require("./LanguageModel");
const lm = new LanguageModel();

lm.train("Hello world, how are you?");
console.log(lm.predict("Hello", 1)); // ['world']
console.log(lm.generateText("Hello", 3)); // 'Hello world how'
```

#

# Ngram Class

The `Ngram` class in JavaScript provides functionality similar to Python's N-gram models, allowing for predictive text generation and language modeling using up to 5-gram analysis. It leverages a custom `Counter` class for efficient counting of word sequences.

## Features

- **Tokenization**: Converts text into tokens, handling punctuation by removing it while preserving apostrophes.
- **Model Update**: Updates the n-gram model with new text data.
- **Prediction**: Predicts the next word based on the given prefix, using n-grams from 1 to `maxN`.
- **Learning**: Automatically learns from user input through event handlers (`input`, `blur`, `keydown`).
- **Autocomplete**: Provides real-time autocomplete suggestions in text inputs or textareas.

## Usage

To use the `Ngram` class:

```javascript
const Ngram = require("./Ngram");
const ngram = new Ngram(3); // Initialize with 3-grams

// Learn from text
ngram.learn("Hello world how are you");

// Predict next word
let prediction = ngram.predictNextWord("Hello world"); // Returns an array of predictions

// Setup for real-time learning and prediction in your application
ngram.setup();
```

#

# Counter Class

A JavaScript implementation of Python's `Counter` class for counting hashable items. This class can:

- Count occurrences of elements in iterables.
- Increment or decrement counts for specific items.
- Provide methods to get counts, sum totals, find most common items, and more.

**Usage:**

```javascript
const Counter = require("./Counter");
const counter = new Counter(["a", "b", "a", "c", "b", "b"]);
console.log(counter.get("b")); // 3
console.log(counter.mostCommon()); // [['b', 3], ['a', 2], ['c', 1]]
```
