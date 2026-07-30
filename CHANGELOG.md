# Changelog

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
