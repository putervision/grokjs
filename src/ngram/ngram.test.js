const Ngram = require('./ngram');
const Counter = require('../counter/counter');

jest.spyOn(console, 'log').mockImplementation(() => {});

// Mocking DOM methods for the 'setup' test
document.body.innerHTML = '<input type="text" id="testInput" />';
let realAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener) {
    this._listeners = this._listeners || {};
    this._listeners[type] = listener;
    realAddEventListener.apply(this, arguments);
};

describe('Ngram', () => {
    let ngram;

    beforeEach(() => {
        ngram = new Ngram(3); // Test with 3-grams for simplicity
    });

    test('constructor initializes ngrams correctly', () => {
        expect(ngram.maxN).toBe(3);
        expect(ngram.ngrams.length).toBe(3);
        expect(ngram.ngrams[0] instanceof Map).toBe(true);
        expect(ngram.ngrams[1] instanceof Map).toBe(true);
        expect(ngram.ngrams[2] instanceof Map).toBe(true);
    });

    test('tokenize converts text to tokens with various inputs', () => {
        expect(ngram.tokenize('Hello world how are you')).toEqual(['hello', 'world', 'how', 'are', 'you']);
        expect(ngram.tokenize('  Multiple   spaces   ')).toEqual(['multiple', 'spaces']);
        expect(ngram.tokenize('Punctuation!@#$%^&*()')).toEqual(['punctuation']);
        expect(ngram.tokenize('')).toEqual([]); // Empty string
        expect(ngram.tokenize('   ')).toEqual([]); // Only spaces
    });

    test('updateModel handles single word input', () => {
        ngram.updateModel(['hello']);
        expect(ngram.ngrams[0].get('hello')).toBeInstanceOf(Counter);
        expect(ngram.ngrams[0].get('hello').get('')).toBe(1); // End of input
    });

    test('updateModel adds ngrams to the model with longer sequences', () => {
        ngram.updateModel(['hello', 'world', 'how', 'are', 'you']);
        expect(ngram.ngrams[0].get('hello').get('world')).toBe(1);
        expect(ngram.ngrams[1].get('hello world').get('how')).toBe(1);
        expect(ngram.ngrams[2].get('hello world how').get('are')).toBe(1);
        expect(ngram.ngrams[0].get('are').get('you')).toBe(1);
    });

    test('predictNextWord handles different n-gram levels', () => {
        ngram.updateModel(['hello', 'world', 'how', 'are', 'you', 'hello', 'world', 'again']);
        
        // Test for 3-gram prediction
        let predictions = ngram.predictNextWord('hello world how');
        expect(predictions).toEqual(['are']);
        
        // Test for 2-gram prediction
        predictions = ngram.predictNextWord('hello world');
        expect(predictions).toEqual(['how', 'again']);
        
        // Test for 1-gram prediction
        predictions = ngram.predictNextWord('world');
        expect(predictions).toEqual(['how', 'again']);
    });

    test('predictNextWord returns empty array for no match with various inputs', () => {
        let predictions = ngram.predictNextWord('unknown prefix');
        expect(predictions).toEqual([]);
        
        predictions = ngram.predictNextWord('');
        expect(predictions).toEqual([]);
    });

    test('inputHandler provides autocomplete suggestion', () => {
        ngram.updateModel(['hello', 'world', 'how', 'are', 'you']);
        let mockEvent = {
            target: {
                value: 'hello w',
                setSelectionRange: jest.fn(),
                preventDefault: jest.fn()
            }
        };
        ngram.inputHandler(mockEvent);
        expect(mockEvent.target.value).toBe('hello world');
        expect(mockEvent.target.setSelectionRange).toHaveBeenCalledWith(7, 11);
        expect(mockEvent.target.preventDefault).toHaveBeenCalled();
    });

    test('inputHandler does not autocomplete when no match', () => {
        let mockEvent = {
            target: {
                value: 'unknown p',
                setSelectionRange: jest.fn(),
                preventDefault: jest.fn()
            }
        };
        ngram.inputHandler(mockEvent);
        expect(mockEvent.target.value).toBe('unknown p');
        expect(mockEvent.target.setSelectionRange).not.toHaveBeenCalled();
        expect(mockEvent.target.preventDefault).not.toHaveBeenCalled();
    });

    test('learn method updates the model with multiple sentences', () => {
        ngram.learn('hello world how are you. hello world again');
        expect(ngram.ngrams[0].get('hello').get('world')).toBe(2);
        expect(ngram.ngrams[1].get('hello world').get('how')).toBe(1);
        expect(ngram.ngrams[1].get('hello world').get('again')).toBe(1);
    });

    test('blurHandler learns from input on blur with multiple words', () => {
        let mockEvent = {
            target: {
                value: 'hello world how are you'
            }
        };
        ngram.blurHandler(mockEvent);
        expect(ngram.ngrams[0].get('hello')).toBeInstanceOf(Counter);
        expect(ngram.ngrams[0].get('hello').get('world')).toBe(1);
        expect(ngram.ngrams[2].get('hello world how').get('are')).toBe(1);
    });

    test('keydownHandler learns from input on Enter with multiple words', () => {
        let mockEvent = {
            key: 'Enter',
            target: {
                value: 'hello world how are you'
            }
        };
        ngram.keydownHandler(mockEvent);
        expect(ngram.ngrams[0].get('hello')).toBeInstanceOf(Counter);
        expect(ngram.ngrams[0].get('hello').get('world')).toBe(1);
        expect(ngram.ngrams[2].get('hello world how').get('are')).toBe(1);
    });

    test('setup adds event listeners to multiple inputs', () => {
        document.body.innerHTML = '<input type="text" id="testInput1" /><input type="text" id="testInput2" />';
        ngram.setup();
        const input1 = document.getElementById('testInput1');
        const input2 = document.getElementById('testInput2');
        expect(input1._listeners).toEqual({
            input: expect.any(Function),
            blur: expect.any(Function),
            keydown: expect.any(Function)
        });
        expect(input2._listeners).toEqual({
            input: expect.any(Function),
            blur: expect.any(Function),
            keydown: expect.any(Function)
        });
    });

    test('setup does not add listeners to non-text inputs', () => {
        document.body.innerHTML = '<input type="checkbox" id="testCheckbox" /><input type="text" id="testInput" />';
        ngram.setup();
        const checkbox = document.getElementById('testCheckbox');
        const input = document.getElementById('testInput');
        expect(checkbox._listeners).toBeUndefined();
        expect(input._listeners).toEqual({
            input: expect.any(Function),
            blur: expect.any(Function),
            keydown: expect.any(Function)
        });
    });
});

// Restore after all tests
afterAll(() => {
    EventTarget.prototype.addEventListener = realAddEventListener;
});