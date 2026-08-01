const FormAutocompleteEngine = require("./form-autocomplete");
const LanguageModel = require("../language-model/language-model");

describe("FormAutocompleteEngine Class with Full Lifecycle & DOM Mocking", () => {
  let engine;

  beforeEach(() => {
    document.body.innerHTML = "";
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    engine = new FormAutocompleteEngine({
      autoSave: true,
      storageKey: "test_grok_key",
      showSetup: false,
    });
  });

  test("initializes correctly with LanguageModel", () => {
    expect(engine.model).toBeInstanceOf(LanguageModel);
  });

  test("preloadCorpora preloads preset corpora and custom text", () => {
    engine.preloadCorpora(["email", "developer"], "Custom training notes for testing.");
    expect(engine.model.vocabulary.has("attached")).toBe(true);
    expect(engine.model.vocabulary.has("testing")).toBe(true);
  });

  test("getConsoleSnippet returns executable snippet string", () => {
    const snippet = FormAutocompleteEngine.getConsoleSnippet();
    expect(typeof snippet).toBe("string");
    expect(snippet).toContain("FormAutocompleteEngine.inject");
  });

  test("predict returns expected autocomplete completions for empty, trailing space, and partial words", () => {
    engine.model.train("GrokJS is an advanced JavaScript library for natural language processing.");

    expect(engine.predict("")).toEqual([]);
    expect(engine.predict(null)).toEqual([]);
    expect(engine.predict("   ")).toEqual([]);

    const withTrailing = engine.predict("GrokJS is ");
    expect(Array.isArray(withTrailing)).toBe(true);
    expect(withTrailing.length).toBeGreaterThan(0);

    const partialMatch = engine.predict("GrokJS is ");
    expect(Array.isArray(partialMatch)).toBe(true);
    expect(partialMatch.length).toBeGreaterThan(0);
  });

  test("DOM element targets detection and value getter/setter", () => {
    const textInput = document.createElement("input");
    textInput.type = "text";
    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    const textarea = document.createElement("textarea");
    const divEditable = document.createElement("div");
    Object.defineProperty(divEditable, "isContentEditable", { value: true, configurable: true });

    expect(engine._isFormTarget(textInput)).toBe(true);
    expect(engine._isFormTarget(passwordInput)).toBe(false);
    expect(engine._isFormTarget(textarea)).toBe(true);
    expect(engine._isFormTarget(divEditable)).toBe(true);
    expect(engine._isFormTarget(null)).toBe(false);

    engine._setValue(textInput, "Hello");
    expect(engine._getValue(textInput)).toBe("Hello");

    engine._setValue(divEditable, "Editable text");
    expect(engine._getValue(divEditable)).toBe("Editable text");
  });

  test("attachToDocument attaches focusin, input, keydown, and focusout events", () => {
    engine.attachToDocument();
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);

    input.focus();
    input.dispatchEvent(new Event("focusin", { bubbles: true }));
    expect(engine.activeElement).toBe(input);

    input.value = "GrokJS is a great library for language model processing";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Keydown Tab key completion
    engine.tooltipElement.dataset.suggestion = "advanced";
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    input.dispatchEvent(tabEvent);
    expect(input.value).toContain("advanced");

    // Keydown Escape hides tooltip
    const escEvent = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    input.dispatchEvent(escEvent);
    expect(engine.tooltipElement.style.display).toBe("none");
  });

  test("saveState and loadState persist model to localStorage", () => {
    engine.model.train("Persistence test string for local storage");
    engine.saveState();

    const newEngine = new FormAutocompleteEngine({ autoSave: true, storageKey: "test_grok_key" });
    const isFirstRun = newEngine.loadState();
    expect(isFirstRun).toBe(false);
    expect(newEngine.model.vocabulary.has("persistence")).toBe(true);
  });

  test("showSetupModal handles checkbox selections and custom text input", () => {
    engine.showSetupModal();
    const customInput = document.getElementById("custom-train-input");
    if (customInput) customInput.value = "Special company signature text";

    const emailCheckbox = document.getElementById("preset-email");
    if (emailCheckbox) emailCheckbox.checked = true;

    const startBtn = document.getElementById("grokjs-start-btn");
    startBtn.click();

    expect(engine.model.vocabulary.has("signature")).toBe(true);
    expect(document.getElementById("grokjs-setup-modal")).toBeNull();
  });

  test("_onFocusOut hides tooltip after timeout", (done) => {
    engine.attachToDocument();
    const input = document.createElement("input");
    document.body.appendChild(input);

    engine.activeElement = input;
    engine._onFocusOut({ target: input });

    setTimeout(() => {
      expect(engine.activeElement).toBeNull();
      done();
    }, 250);
  });

  test("_isCursorAtEnd handles null and selection targets", () => {
    expect(engine._isCursorAtEnd(null)).toBe(true);
    const input = document.createElement("input");
    input.value = "test";
    input.selectionStart = 4;
    expect(engine._isCursorAtEnd(input)).toBe(true);
  });

  test("static inject creates and attaches engine", () => {
    const injected = FormAutocompleteEngine.inject({ autoSave: false });
    expect(injected).toBeInstanceOf(FormAutocompleteEngine);
  });

  test("detach cleans up bound handlers and injected DOM elements", () => {
    const instance = FormAutocompleteEngine.inject({ autoSave: false });
    expect(instance._boundHandlers).not.toBeNull();

    instance.detach();
    expect(instance._boundHandlers).toBeNull();
    expect(instance.tooltipElement).toBeNull();
  });

  test("constructor supports namespaceByPath option", () => {
    const namespaced = new FormAutocompleteEngine({
      autoSave: false,
      namespaceByPath: true,
      storageKey: "test_key",
    });
    expect(namespaced.options.storageKey).toBeDefined();
  });
});
