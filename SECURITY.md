# Security Policy

## Supported Versions

Only the latest version of TryA11y receives security updates.

| Version | Supported |
|---------|-----------|
| latest  | ✅        |
| older   | ❌        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability, contact the maintainer directly via GitHub: [@priyasahay](https://github.com/priyasahay).

Include:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fixes (optional)

You will receive a response within 72 hours. If the issue is confirmed, a fix will be prioritised and you will be credited in the release notes (unless you prefer to remain anonymous).

## Security Architecture

TryA11y is designed with a local-only architecture:

- **No external servers** — all scanning and fix generation runs in your browser or Chrome extension. No page content, HTML, or scan results are sent anywhere.
- **No API keys or accounts** — the tool requires no authentication and stores no credentials.
- **Local AI only** — the optional AI features use [Ollama](https://ollama.com), which runs entirely on your own machine. No data is sent to any cloud LLM provider.
- **Chrome extension storage** — scan results are stored in `chrome.storage.local`, accessible only to the extension itself.

## Known Limitations

- The Ollama integration requires running `OLLAMA_ORIGINS="*"` to allow the Chrome extension to connect. This opens Ollama to any local origin — only run this on a trusted machine and network.
- The web app is a client-side only application. When deployed to GitHub Pages it serves static assets only — there is no backend.
