# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-25

### Added

**Core engine**
- Accessibility scanner wrapping axe-core 4.10 with normalised `A11yIssue` output including impact, WCAG level, tags, and element info
- Heuristic fix engine with 10 built-in rules: `image-alt`, `button-name`, `link-name`, `label`, `html-has-lang`, `color-contrast`, `heading-order`, `td-headers-attr`, `th-has-data-cells`, and a generic fallback
- Confidence rating system (`high` / `medium` / `low`) with per-fix reasoning
- Live DOM patching with full undo support
- Element highlight overlay with severity colour coding and fade-out animation
- Report generator producing self-contained HTML, structured JSON, and Markdown
- Optional Ollama LLM layer for enriching low and medium confidence fixes with plain-English explanations
- DOM-free `@trya11y/core/worker` subpath safe to import from MV3 service workers and Node.js
- `registerHeuristic()` public API for plugins and custom rule sets

**Chrome extension**
- MV3 service worker orchestrating scans, LLM enhancement, report downloads, scan history, and Ollama config
- Content script injecting axe-core, applying and undoing fixes, highlighting elements, and rendering focus order overlays
- DevTools panel with issue list, severity filter, before/after HTML diff, Apply Fix / Undo Fix, AI explanation toggle, Focus Order visualiser, report export, scan history, and Ollama settings
- Popup with quick scan, summary stats, per-format export buttons, and auto-fixable count
- Persistent `chrome.runtime.Port` for Ollama calls — bypasses the 30-second MV3 message timeout
- "Fix All High" button to apply every high-confidence fix in one click
- Accessibility score tracking applied fixes against total violations

**Web**
- React + Vite landing page deployed to GitHub Pages with feature overview and extension UI preview

**Infrastructure**
- pnpm workspaces monorepo with three packages: `core`, `extension`, `web`
- TypeScript 5.5 strict mode across all packages with shared base config
- Vite 5 with separate bundles for MV3 background, content script, DevTools panel, and popup
- Vitest 2 unit and integration tests with jsdom and code coverage
- GitHub Actions CI pipeline for build, typecheck, and test on every push and pull request
- GitHub Pages deployment workflow

**Documentation**
- README with install, usage, architecture, and development commands
- CONTRIBUTING guide with heuristic authoring walkthrough
- CHANGELOG
- CLA
- SECURITY policy
- CODE_OF_CONDUCT
- Architecture docs and developer guide for adding fix heuristics
