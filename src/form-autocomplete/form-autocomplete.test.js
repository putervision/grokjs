const FormAutocompleteEngine = require("./form-autocomplete");
const LanguageModel = require("../language-model/language-model");

describe("FormAutocompleteEngine Class with Pre-Training", () => {
  let engine;

  beforeEach(() => {
    engine = new FormAutocompleteEngine({ autoSave: false, showSetup: false });
  });

  test("initializes correctly with LanguageModel", () => {
    expect(engine.model).toBeInstanceOf(LanguageModel);
  });

  test("preloadCorpora preloads preset corpora and custom text", () => {
    engine.preloadCorpora(["email", "developer"], "Custom training notes for testing.");
    expect(engine.model.vocabulary.has("email")).toBe(false); // tokenized lowercased words
    expect(engine.model.vocabulary.has("attached")).toBe(true);
    expect(engine.model.vocabulary.has("testing")).toBe(true);
  });

  test("getConsoleSnippet returns executable snippet string", () => {
    const snippet = FormAutocompleteEngine.getConsoleSnippet();
    expect(typeof snippet).toBe("string");
    expect(snippet).toContain("FormAutocompleteEngine.inject()");
  });
});
