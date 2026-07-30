# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Open a private GitHub security advisory or email security@putervision.com
3. Include steps to reproduce and potential impact

## Security Characteristics

- **Client-side only**: All processing happens in the browser/Node.js — no network calls
- **No data exfiltration**: Text data never leaves your environment
- **No eval() or dynamic code execution**
- **Zero external dependencies** (except `franc-cjs` for language detection)

## Dependencies

This project uses:

- `franc-cjs` — Language detection (read-only, no network calls)
- `esbuild`, `jest`, `prettier` — Dev dependencies only

All dependencies are audited regularly via `npm audit`.
