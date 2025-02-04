const LanguageModel = require('../language-model/language-model');
const Ngram = require('../ngram/ngram');

// Initialize the LanguageModel with a 3-gram model
const languageModel = new LanguageModel(new Ngram(3));

// Train the model
languageModel.train('hello world how are you hello world again. the dog says hello hello and he says goodbye. cheese-its are delicious. hello how are goodbye. hello bye. hi byybye. hello world can we get cheese, it goes really well with everything.');

// Predict the next word
console.log('Predictions for "hello world":', languageModel.predict('hello world'));

// Check vocabulary
console.log('Vocabulary size:', languageModel.getVocabularySize());
console.log('Vocabulary:', Array.from(languageModel.getVocabulary()));

// Generate text
console.log('Generated text starting with "hello":', languageModel.generateText('hello', 3));
console.log('Generated text starting with "hello":', languageModel.generateText('hello', 4));
console.log('Generated text starting with "hello":', languageModel.generateText('hello', 5));

// Evaluate the model
const testData = [
  { input: 'hello world', reference: 'hello world how' },
  { input: 'world how', reference: 'world how are' }
];
console.log('Evaluation results:', languageModel.evaluate(testData));