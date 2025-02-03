# ngram-js
JavaScript ngrams and supporting utils 


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