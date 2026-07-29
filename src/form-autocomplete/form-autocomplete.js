const LanguageModel = require("../language-model/language-model");
const Counter = require("../counter/counter");

/**
 * Default pre-training corpora for instant out-of-the-box autocomplete suggestions.
 */
const DEFAULT_PRESETS = {
  email:
    "Hi there, thank you for reaching out. Please find attached the requested details. Looking forward to speaking with you soon. Let me know if you have any questions. Best regards,",
  developer:
    "const express = require('express'); function async handler(req, res) { return new Promise(); } git commit -m 'update feature' npm run build export default class Component",
  casual:
    "Hey how is it going? That sounds awesome! Let me know when you are free to chat. Thanks again, see you soon! Have a great day!",
};

/**
 * FormAutocompleteEngine class for automatically attaching self-learning LM autocomplete
 * to HTML inputs, textareas, and contenteditable fields on any webpage.
 */
class FormAutocompleteEngine {
  /**
   * Constructs a FormAutocompleteEngine instance.
   * @param {Object} [options={}] - Configuration options
   * @param {LanguageModel} [options.model] - Optional pre-existing LanguageModel instance
   * @param {boolean} [options.autoSave=true] - Whether to save trained state to localStorage
   * @param {string} [options.storageKey="grokjs_form_lm"] - Key used for localStorage persistence
   * @param {number} [options.maxSuggestions=3] - Maximum suggestion dropdown items
   * @param {boolean} [options.showSetup=true] - Whether to display pre-training setup modal on first run
   */
  constructor(options = {}) {
    this.options = {
      autoSave: true,
      storageKey: "grokjs_form_lm",
      maxSuggestions: 3,
      showSetup: true,
      ...options,
    };

    this.model = options.model || new LanguageModel();
    this.activeElement = null;
    this.tooltipElement = null;
    this.modalElement = null;

    const isFirstRun = this.loadState();

    if (isFirstRun && this.options.showSetup && typeof document !== "undefined") {
      this.showSetupModal();
    }
  }

  /**
   * Static helper to inject self-learning autocomplete on any webpage document.
   * @param {Object} [options] - Configuration options
   * @return {FormAutocompleteEngine} - Attached engine instance
   */
  static inject(options = {}) {
    const engine = new FormAutocompleteEngine(options);
    engine.attachToDocument();
    return engine;
  }

  /**
   * Returns a self-contained, copy-pasteable JS snippet for browser console injection.
   * @return {string} - Standalone browser snippet
   */
  static getConsoleSnippet() {
    return `(function(){if(window.__grokjs_autocomplete)return console.log("GrokJS Autocomplete active.");function init(){if(window.GrokJS){window.__grokjs_autocomplete=window.GrokJS.FormAutocompleteEngine.inject();console.log("%cGrokJS Self-Learning Autocomplete Injected! Press Tab or Right Arrow to accept completions.","color:#38bdf8;font-size:14px;font-weight:bold;");}else{console.error("GrokJS failed to load.");}}if(window.GrokJS){init();}else{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@putervision/grokjs@latest/dist/grokjs.bundle.js';script.onload=init;document.head.appendChild(script);}})();`;
  }

  /**
   * Pre-trains model on selected preset corpora or custom text.
   * @param {string[]} [presets=['email', 'developer', 'casual']] - Preset keys to pre-load
   * @param {string} [customText=""] - Optional custom text to train on
   */
  preloadCorpora(presets = ["email", "developer", "casual"], customText = "") {
    presets.forEach((key) => {
      if (DEFAULT_PRESETS[key]) {
        this.model.train(DEFAULT_PRESETS[key]);
      }
    });

    if (customText && customText.trim().length > 0) {
      this.model.train(customText);
    }

    this.saveState();
  }

  /**
   * Predicts completions considering both full context and partial trailing words.
   * @param {string} text - Input text string
   * @param {number} [maxSuggestions=3] - Maximum suggestions to return
   * @return {string[]} - Array of predicted word completions
   */
  predict(text, maxSuggestions = 3) {
    if (!text || typeof text !== "string") return [];

    const hasTrailingSpace = text.endsWith(" ");
    const trimmed = text.trim();
    if (!trimmed) return [];

    const parts = trimmed.split(/\s+/);
    let contextTokens = [];
    let partialWord = "";

    if (hasTrailingSpace) {
      contextTokens = parts;
      partialWord = "";
    } else {
      contextTokens = parts.slice(0, -1);
      partialWord = parts[parts.length - 1].toLowerCase();
    }

    const candidates = new Map();

    // 1. N-gram context matching
    if (contextTokens.length > 0) {
      const contextStr = contextTokens.join(" ");
      const ngramMatches = this.model.predict(contextStr, 20);
      ngramMatches.forEach((word, idx) => {
        if (word && word !== "") {
          const lower = word.toLowerCase();
          if (!partialWord || lower.startsWith(partialWord)) {
            candidates.set(word, 100 - idx);
          }
        }
      });
    }

    // 2. Vocabulary prefix matching for partial word
    if (partialWord) {
      for (let word of this.model.vocabulary) {
        if (
          word &&
          word.toLowerCase().startsWith(partialWord) &&
          word.toLowerCase() !== partialWord
        ) {
          if (!candidates.has(word)) {
            candidates.set(word, 10);
          }
        }
      }
    }

    // 3. Fallback: if no context matching, check 1-gram most common
    if (candidates.size === 0 && contextTokens.length === 0) {
      const allMatches = this.model.predict(trimmed, maxSuggestions);
      allMatches.forEach((word, idx) => {
        if (word && word !== "") candidates.set(word, 50 - idx);
      });
    }

    const sorted = Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    return sorted.slice(0, maxSuggestions);
  }

  /**
   * Attaches event listeners to document for auto-detecting and binding inputs.
   */
  attachToDocument() {
    if (typeof document === "undefined") return;

    this._createTooltip();

    document.addEventListener("focusin", (e) => this._onFocusIn(e));
    document.addEventListener("input", (e) => this._onInput(e));
    document.addEventListener("keydown", (e) => this._onKeyDown(e));
    document.addEventListener("focusout", (e) => this._onFocusOut(e));
  }

  /**
   * Loads trained model state (full n-gram tree & vocabulary) from localStorage.
   * @return {boolean} - Returns true if first run (no existing saved state)
   */
  loadState() {
    if (typeof localStorage === "undefined" || !this.options.autoSave) {
      this.preloadCorpora();
      return true;
    }

    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.model.maxN = state.maxN || 5;
        this.model.vocabulary = new Set(state.vocabulary || []);
        if (state.context) this.model.context = state.context;

        if (Array.isArray(state.ngrams)) {
          state.ngrams.forEach((ngramObj, index) => {
            if (index < this.model.ngram.ngrams.length) {
              const map = new Map();
              for (let [key, entries] of Object.entries(ngramObj)) {
                const counter = new Counter();
                if (Array.isArray(entries)) {
                  entries.forEach(([word, count]) => {
                    counter.increment(word, count);
                    if (word) this.model.vocabulary.add(word);
                  });
                }
                map.set(key, counter);
              }
              this.model.ngram.ngrams[index] = map;
            }
          });
        }
        return false;
      } else {
        // First run: pre-train default baseline
        this.preloadCorpora();
        return true;
      }
    } catch (e) {
      console.warn("GrokJS FormAutocompleteEngine: Could not load saved state", e);
      this.preloadCorpora();
      return true;
    }
  }

  /**
   * Saves current full model state (all n-grams, vocabulary, context) to localStorage.
   */
  saveState() {
    if (typeof localStorage === "undefined" || !this.options.autoSave) return;
    try {
      const serializedNgrams = this.model.ngram.ngrams.map((map) => {
        const obj = {};
        for (let [key, counter] of map.entries()) {
          obj[key] = Array.from(counter.counter.entries());
        }
        return obj;
      });

      const state = {
        maxN: this.model.maxN,
        ngrams: serializedNgrams,
        vocabulary: Array.from(this.model.vocabulary),
        context: this.model.context,
      };
      localStorage.setItem(this.options.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn("GrokJS FormAutocompleteEngine: Could not save state", e);
    }
  }

  /**
   * Displays an interactive setup modal for selecting pre-training presets & pasting custom notes.
   */
  showSetupModal() {
    if (typeof document === "undefined") return;
    if (document.getElementById("grokjs-setup-modal")) return;

    const modal = document.createElement("div");
    modal.id = "grokjs-setup-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(8px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 1rem;
    `;

    modal.innerHTML = `
      <div style="background: #1e293b; border: 1px solid #38bdf8; border-radius: 16px; width: 100%; max-width: 480px; padding: 1.75rem; color: #f8fafc; box-shadow: 0 20px 50px rgba(0,0,0,0.6); position: relative;">
        <div style="font-size: 1.25rem; font-weight: 800; color: #38bdf8; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🤖 GrokJS Autocomplete Setup</span>
        </div>
        <p style="font-size: 0.88rem; color: #94a3b8; margin-bottom: 1.2rem; line-height: 1.5;">Select pre-training topics or paste custom notes below to prime your AI language model instantly:</p>

        <div style="margin-bottom: 1rem;">
          <label style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.5rem;">PRE-TRAINING PRESETS:</label>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <label style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
              <input type="checkbox" id="preset-email" checked> 💼 Email & Business
            </label>
            <label style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
              <input type="checkbox" id="preset-developer" checked> 💻 Software Dev
            </label>
            <label style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
              <input type="checkbox" id="preset-casual" checked> 💬 Casual Chat
            </label>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label for="custom-train-input" style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.4rem;">CUSTOM PRE-TRAINING NOTES (OPTIONAL):</label>
          <textarea id="custom-train-input" placeholder="Paste custom notes, company name, signature, or common phrases here..." style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; color: #f8fafc; border-radius: 8px; padding: 0.6rem 0.8rem; font-size: 0.85rem; font-family: inherit; min-height: 70px; resize: vertical; outline: none;"></textarea>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button id="grokjs-start-btn" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4); transition: transform 0.15s ease;">Prime & Start Autocomplete</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    document.getElementById("grokjs-start-btn").addEventListener("click", () => {
      const presets = [];
      if (document.getElementById("preset-email").checked) presets.push("email");
      if (document.getElementById("preset-developer").checked) presets.push("developer");
      if (document.getElementById("preset-casual").checked) presets.push("casual");

      const customText = document.getElementById("custom-train-input").value;
      this.preloadCorpora(presets, customText);

      modal.remove();
      this.modalElement = null;
    });
  }

  _isFormTarget(el) {
    if (!el) return false;
    const tagName = el.tagName ? el.tagName.toLowerCase() : "";
    const isInput =
      tagName === "input" && ["text", "search", "url", "email", ""].includes(el.type || "");
    const isTextarea = tagName === "textarea";
    const isContentEditable = el.isContentEditable;
    return isInput || isTextarea || isContentEditable;
  }

  _getValue(el) {
    if (!el) return "";
    return el.isContentEditable ? el.innerText || el.textContent || "" : el.value || "";
  }

  _setValue(el, val) {
    if (!el) return;
    if (el.isContentEditable) {
      el.innerText = val;
    } else {
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  _onFocusIn(e) {
    if (this._isFormTarget(e.target)) {
      this.activeElement = e.target;
      this._updateSuggestions(e.target);
    }
  }

  _onInput(e) {
    if (!this._isFormTarget(e.target)) return;

    const val = this._getValue(e.target);
    if (val.trim().length > 3) {
      // Auto-train on user input
      this.model.train(val);
      this.saveState();
    }

    this._updateSuggestions(e.target);
  }

  _onKeyDown(e) {
    if (!this.activeElement || !this.tooltipElement) return;

    const currentSuggestion = this.tooltipElement.dataset.suggestion;
    if (!currentSuggestion) return;

    // Tab or Right Arrow accepts autocomplete suggestion
    if (e.key === "Tab" || (e.key === "ArrowRight" && this._isCursorAtEnd(this.activeElement))) {
      e.preventDefault();
      const val = this._getValue(this.activeElement);
      const parts = val.split(/\s+/);
      const isTrailingSpace = val.endsWith(" ");

      let updatedVal = "";
      if (isTrailingSpace || parts.length === 0) {
        updatedVal = val + currentSuggestion;
      } else {
        // Replace last partial word with the full suggested word
        parts[parts.length - 1] = currentSuggestion;
        updatedVal = parts.join(" ");
      }

      this._setValue(this.activeElement, updatedVal);
      this.model.train(updatedVal);
      this.saveState();
      this._hideTooltip();
    } else if (e.key === "Escape") {
      this._hideTooltip();
    }
  }

  _onFocusOut(e) {
    setTimeout(() => {
      if (this.activeElement === e.target) {
        this._hideTooltip();
        this.activeElement = null;
      }
    }, 200);
  }

  _isCursorAtEnd(el) {
    if (!el) return true;
    if (el.isContentEditable) return true;
    try {
      return el.selectionStart === el.value.length;
    } catch (err) {
      return true;
    }
  }

  _updateSuggestions(el) {
    const val = this._getValue(el);
    if (!val || val.trim().length === 0) {
      this._hideTooltip();
      return;
    }

    const predictions = this.predict(val, this.options.maxSuggestions);
    if (predictions && predictions.length > 0) {
      this._showTooltip(el, predictions[0]);
    } else {
      this._hideTooltip();
    }
  }

  _createTooltip() {
    if (typeof document === "undefined") return;

    if (!document.getElementById("grokjs-autocomplete-tooltip")) {
      const div = document.createElement("div");
      div.id = "grokjs-autocomplete-tooltip";
      div.style.cssText = `
        position: absolute;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid #38bdf8;
        color: #38bdf8;
        padding: 4px 10px;
        border-radius: 6px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(56, 189, 248, 0.3);
        pointer-events: none;
        display: none;
        transition: opacity 0.15s ease;
      `;
      document.body.appendChild(div);
      this.tooltipElement = div;
    } else {
      this.tooltipElement = document.getElementById("grokjs-autocomplete-tooltip");
    }
  }

  _showTooltip(el, suggestion) {
    if (!this.tooltipElement || !el) return;

    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const safeSuggestion = String(suggestion || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    this.tooltipElement.style.top = `${rect.bottom + scrollTop + 4}px`;
    this.tooltipElement.style.left = `${rect.left + scrollLeft}px`;
    this.tooltipElement.innerHTML = `Suggested: <strong>${safeSuggestion}</strong> <span style="opacity:0.6;font-size:10px;">[Tab to accept]</span>`;
    this.tooltipElement.dataset.suggestion = suggestion;
    this.tooltipElement.style.display = "block";
  }

  _hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.style.display = "none";
      this.tooltipElement.dataset.suggestion = "";
    }
  }
}

module.exports = FormAutocompleteEngine;
