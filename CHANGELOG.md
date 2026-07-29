# Changelog

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
