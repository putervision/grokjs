# Contributing to GrokJS

Thank you for considering contributing to `@putervision/grokjs`! We welcome bug fixes, documentation improvements, feature proposals, and unit tests.

---

## Development Setup

### 1. Prerequisites

- Node.js **>= 16.0.0**
- npm **>= 8.0.0**
- git

### 2. Fork & Clone

```bash
git clone https://github.com/your-username/grokjs.git
cd grokjs
npm install
```

---

## Development Commands

```bash
# Run unit tests (Jest)
npm test

# Run build (Browserify UMD bundle)
npm run build

# Check code formatting (Prettier)
npm run format:check

# Auto-format code
npm run format

# Full CI build & test run
npm run ci
```

---

## Code Quality Standards

1. **Pure JS / Zero Network Side Effects**: Core NLP modules must operate client-side / locally without network I/O.
2. **TypeScript Support**: Any public API method or class added to `src/` MUST be reflected in `index.d.ts`.
3. **100% Unit Test Coverage**: Every bug fix or new class must include unit tests under `src/<module>/<module>.test.js`.
4. **No Dynamic Code Execution**: Do not use `eval()`, `new Function()`, or unsafe `innerHTML` without sanitization.

---

## Submitting a Pull Request (PR)

1. Create a feature branch: `git checkout -b feat/my-new-feature`.
2. Ensure all tests pass: `npm run ci`.
3. Commit your changes with descriptive messages: `git commit -m "feat: add perplexity caching support"`.
4. Push to your fork and submit a Pull Request to `main`.

---

## Disclaimer & Limitation of Liability

This software is provided "as is", without warranty of any kind, express or implied. Under no circumstances shall the authors or contributors be liable for any data loss or other issues resulting from execution.
