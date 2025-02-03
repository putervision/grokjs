# ngram-js
JavaScript ngrams and supporting utils 

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
const Ngram = require('./Ngram');
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
const Counter = require('./Counter');
const counter = new Counter(['a', 'b', 'a', 'c', 'b', 'b']);
console.log(counter.get('b')); // 3
console.log(counter.mostCommon()); // [['b', 3], ['a', 2], ['c', 1]]