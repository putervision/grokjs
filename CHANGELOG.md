# Changelog

## [1.2.4] - 2026-08-01

### Fixed

- **Duplicate DOM Event Listener Prevention & Teardown API**: Bound named listener callbacks to `_boundHandlers` with an attachment guard in `FormAutocompleteEngine.attachToDocument()` and added a `detach()` method to unbind listeners and remove injected DOM nodes on component teardown.
- **Sandboxed Storage Security**: Moved `typeof localStorage` checks inside `try/catch` blocks in `FormAutocompleteEngine.loadState()` and `saveState()` to prevent unhandled `SecurityError` DOMExceptions in sandboxed iframes. Added `namespaceByPath` option to auto-namespace storage keys by `window.location.pathname`.
- **NPM Package Payload Optimization**: Excluded `src/test/**` from the `files` array in `package.json`, removing test runner script `src/test/exercise.js` from the published npm package tarball.
- **FactServer Input Sanitization & Deduplication**: Added non-null object type guards to `FactServer.deserialize()` and deduplicated identical fact insertions in `FactServer.addFact()`.
- **Atomic Model State Import**: Refactored `LanguageModel.importState()` to parse and instantiate new model structures atomically before updating instance fields.
- **Prototype Collision Safety**: Used `Object.create(null)` for `contractions` dictionary in `Tokenizer.tokenize()`.
- **TypeScript Declarations (`index.d.ts`)**: Added `Counter<T = any>`, `seed` parameter to `Corpus.split()`, `detach()` to `FormAutocompleteEngine`, and `namespaceByPath` to `FormAutocompleteOptions`.

### Changed

- **Build Target Compatibility**: Configured `--target=es2020` in the `esbuild` build script.
- **Documentation & Website Alignment**: Added Open Graph (`og:`) and Twitter Card meta tags to `docs/index.html` and updated hero badge dependency claims.

## [1.2.3] - 2026-08-01

### Fixed

- **`Counter.elements()` Float Safety**: Added `Math.floor(Math.max(0, count))` safeguard to prevent `RangeError: Invalid array length` when handling fractional/float counts.
- **`ProbabilityDistribution.stupidBackoff()` Penalty**: Fixed backoff match probability scaling to properly apply `alpha` backoff penalty per context shift level and removed hardcoded `0.4` factor compounding.
- **`Embedding` Case Consistency**: Standardized exact and lowercased key lookups across `build()`, `getVector()`, `mostSimilar()`, and `vectorArithmetic()`.
- **`InferenceEngine.beamSearch()` Length Normalization**: Applied sequence length normalization `(score / Math.pow(len, 0.75))` to candidate scores to prevent long sequence penalties.
- **`FactServer` Jaccard Relevance & Deserialization**: Replaced length-penalized relevance with Jaccard token set intersection-over-union scoring, and fixed ID auto-increment tracking on `deserialize()`.
- **TypeScript Declarations (`index.d.ts`)**: Corrected ambient generator declaration for `InferenceEngine.generateStream()` and fixed `FormAutocompleteEngine.loadState()` and `predict()` return signatures.
- **Corpus Reproducibility**: Added optional `seed` parameter to `Corpus.split()` for deterministic pseudo-random shuffles.

### Added

- **Expanded Test Suite**: Raised overall test line and statement coverage to **≥ 95%** with 193 unit and integration tests passing cleanly.

## [1.2.2] - 2026-07-29

### Fixed

- **Document Trainer File Input & Drag-Drop**: Fixed recursive event bubbling issue when triggering file picker click handlers inside `#drop-zone`.
- **Drag & Drop Handling**: Added `pointer-events: none` to inner drop zone text elements and proper drag event lifecycle management to prevent unexpected browser navigation.
- **Dependency Vulnerabilities**: Fixed 20 high-severity security vulnerabilities (`brace-expansion` DoS) by adding explicit package overrides in `package.json`.
- **License & Copyright Attribution**: Standardized copyright notice to PuterVision LLC across `LICENSE` and documentation files.

## [1.2.1] - 2026-07-29

### Added

- **Browser Document Trainer & Checkpoint Studio**: Real-time browser document training (.txt, .md, .csv, .json) via `FileReader` API.
- **`LanguageModel.exportState()` & `LanguageModel.importState()`**: Browser-native JSON model state export/import without requiring Node `fs`.
- **Live Checkpoint Inference & Autocomplete Widget**: Interactive widget with real-time confidence percentage badges and embeddable code snippet.

### Fixed

- **Setup Modal Triggering**: Disabled default popup on website page load (`showSetup: false`) while keeping explicit popup on browser console snippet injection (`showSetup: true`).
- **Responsive Layout**: Improved Document Trainer grid responsiveness and button layout on high-resolution desktop displays.

## [1.2.0] - 2026-07-29

### Fixed

- **`LanguageModel.evaluate()` F1 score**: Was hardcoded to check for "targetWord"/"world" strings, making the metric meaningless. Now computes proper token set overlap between predicted and reference tokens.
- **`LanguageModel.evaluate()` accuracy**: Was comparing against `refTokens[refTokens.length - 1]` (last token of reference). Now compares against the actual next word after the input context.
- **`LanguageModel.evaluate()` empty result**: Returns `NaN` for f1Score instead of `0` when no test data is provided.
- **`InferenceEngine._sampleToken()`**: Added probability normalization before Top-K/Top-P sampling. Was operating on unnormalized raw probabilities, causing incorrect sampling distributions.
- **`Counter.increment()` / `Counter.decrement()`**: Added `Number.isFinite()` validation. Was accepting `NaN`, `Infinity`, and non-numeric types that passed the old `n < 0` check.
- **`Corpus.split()`**: Added Fisher-Yates shuffle before splitting. Was producing biased splits on ordered datasets.

### Added

- **`LanguageModel.healthCheck()`**: Returns model readiness status with vocabulary size and ngram level info.
- **`LanguageModel.predictWithConfidence()`**: Returns predictions with probability scores and n-gram level metadata.
- **`InferenceEngine.generateStream()`**: Async generator for token-by-token streaming output.
- **`FactServer.serialize()` / `FactServer.deserialize()`**: JSON persistence for fact stores.
- **ESM import support** via `package.json` exports field.
- **`browser` field** in `package.json` for bundler compatibility.

### Changed

- TypeScript definitions completed for all 16 exported classes.
- Test files excluded from published npm package via `.npmignore`.

### Security

- Documented security characteristics in README (client-side only, no network calls, no eval).

[1.2.4]: https://github.com/putervision/grokjs/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/putervision/grokjs/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/putervision/grokjs/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/putervision/grokjs/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/putervision/grokjs/releases/tag/v1.2.0
