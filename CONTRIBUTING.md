# Contributing to TryA11y

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/priyasahay/trya11y.git
cd trya11y
pnpm install
pnpm build
```

Start the web app:
```bash
pnpm --filter @trya11y/web dev
```

Rebuild the Chrome extension after changes:
```bash
pnpm --filter @trya11y/extension build
# Then reload at chrome://extensions
```

Run tests:
```bash
pnpm test
```

## Adding a Fix Heuristic

1. Open `packages/core/src/fixer.ts`
2. Add a `registerHeuristic('rule-id', fn)` call after the existing heuristics
3. The function receives `(issue: A11yIssue, element: Element)` and returns a `FixSuggestion`
4. Use `setAttrHtml`, `changeTagHtml`, or other helpers — never mutate the live DOM directly
5. Add a test in `packages/core/src/fixer.test.ts`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Run `pnpm typecheck && pnpm test` before submitting
- Describe what changed and why in the PR description

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening an issue.

## Code of Conduct

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.
