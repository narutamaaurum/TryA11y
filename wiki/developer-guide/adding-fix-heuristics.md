# Adding Fix Heuristics

This guide explains how to contribute a new fix heuristic to `@trya11y/core`.

## How the registry works

[packages/core/src/fixer.ts](../../packages/core/src/fixer.ts) maintains a plain object that maps an axe-core rule id to a `FixHeuristic` function:

```ts
type FixHeuristic = (issue: A11yIssue, element: Element) => FixSuggestion | null;

const heuristics: Record<string, FixHeuristic> = {};
```

`registerHeuristic(ruleId, fn)` writes into this map. `generateFix` looks up the rule id and calls the heuristic; if none is registered it falls through to `genericFix`.

## The `FixSuggestion` shape

Every heuristic must return either a `FixSuggestion` or `null` (when a confident fix is impossible). The full type lives in [packages/core/src/types.ts](../../packages/core/src/types.ts):

```ts
interface FixSuggestion {
  description: string;             // Shown to the user in the UI
  type: FixType;                   // Category of mutation — see below
  attribute?: string;              // Attribute being set / removed
  value?: string;                  // New attribute value
  oldHtml: string;                 // Original outer HTML (for the diff view)
  newHtml: string;                 // Fixed outer HTML (for the diff view)
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;              // Explains WHY this confidence was chosen
  source?: 'heuristic' | 'llm';   // Filled in automatically; leave unset
}
```

### FixType values

| Value | When to use |
|---|---|
| `add-attribute` | Adding a missing attribute (e.g. `alt`, `aria-label`) |
| `modify-attribute` | Changing an existing attribute value |
| `add-element` | Inserting a new DOM node (e.g. a `<label>`) |
| `modify-element` | Changing the element itself (e.g. rewriting a heading tag) |
| `change-color` | Adjusting a CSS color for contrast |
| `restructure` | Wrapping or moving elements |

## Confidence levels

Pick the level that honestly reflects how certain you are that the fix is correct without manual review:

| Level | When to use |
|---|---|
| `high` | Strong semantic signal in the DOM — figcaption, title attribute, explicit ARIA, computed style data. A developer can merge this without reading the diff. |
| `medium` | Indirect signal — nearby text, href path, CSS class name, input type. The fix is almost always right but the developer should glance at it. |
| `low` | No usable signal found — the heuristic can only produce a placeholder or a guess. The developer must supply the actual value. |

Always include a `reasoning` string when the level is `medium` or `low` so developers understand why more context was needed.

## DOM utility helpers

These private helpers in `fixer.ts` cover the most common mutations; use them rather than writing DOM code inline:

| Helper | Signature | What it does |
|---|---|---|
| `setAttrHtml` | `(el, attr, value) → string` | Clones the element, sets the attribute, returns `outerHTML` |
| `removeAttrHtml` | `(el, attr) → string` | Clones the element, removes the attribute, returns `outerHTML` |
| `changeTagHtml` | `(el, newTag) → string` | Clones the element under a new tag, copying all attributes and innerHTML |
| `textOf` | `(el, maxLen?) → string` | Returns trimmed `textContent`, capped at `maxLen` characters (default 120) |
| `titleCase` | `(str) → string` | Converts kebab/snake/camel identifiers to Title Case |
| `humanize` | `(str) → string` | Like `titleCase` but also normalises separators |

## Step-by-step: adding a heuristic

### 1. Find the axe rule id

Run a scan on a representative page, open the browser DevTools console or the TryA11y panel, and note the `ruleId` reported (e.g. `video-caption`). Cross-check it in the [axe-core rule list](https://dequeuniversity.com/rules/axe/).

### 2. Understand what the rule checks

Read the axe documentation for the rule. Know:
- Which element types can trigger it.
- Which attributes or structural patterns can satisfy it.
- Which WCAG success criterion it maps to.

### 3. Implement the heuristic

Add a `registerHeuristic` call at the bottom of `fixer.ts`, after all existing heuristics but before the `genericFix` function.

Follow this checklist:
- Cast `element` to the concrete type you expect (e.g. `HTMLVideoElement`).
- Capture `const oldHtml = element.outerHTML` at the top.
- Probe signals from strongest to weakest: explicit attributes → ARIA patterns → surrounding DOM → fallback placeholder.
- Use `setAttrHtml` / `changeTagHtml` instead of mutating the live DOM.
- Return `null` only when you genuinely cannot produce any useful suggestion.

**Worked example — `video-caption`**

```ts
registerHeuristic('video-caption', (issue, element) => {
  const video = element as HTMLVideoElement;
  const oldHtml = video.outerHTML;

  // Does the element already have a <track kind="captions"> child?
  const existingTrack = video.querySelector('track[kind="captions"]');
  if (existingTrack) {
    // axe flagged it anyway — the src attribute may be missing or wrong.
    return {
      description: 'Verify the captions track src points to a valid VTT file',
      type: 'modify-attribute',
      attribute: 'src',
      value: 'captions.vtt',
      oldHtml,
      newHtml: existingTrack.getAttribute('src')
        ? oldHtml  // Can't improve without knowing the correct path
        : oldHtml.replace('</video>', '  <track kind="captions" src="captions.vtt" srclang="en" label="English">\n</video>'),
      confidence: 'low',
      reasoning: 'A captions track exists but may have an invalid src — the correct path cannot be inferred from the DOM alone.',
    };
  }

  // No track at all — suggest adding one
  const newHtml = oldHtml.replace(
    '</video>',
    '  <track kind="captions" src="captions.vtt" srclang="en" label="English">\n</video>',
  );

  return {
    description: 'Add a <track kind="captions"> element pointing to a WebVTT file',
    type: 'add-element',
    oldHtml,
    newHtml,
    confidence: 'medium',
    reasoning: 'No captions track found. The src path "captions.vtt" is a placeholder — update it to the actual file location.',
  };
});
```

### 4. Write tests

Add a `describe` block to [packages/core/src/fixer.test.ts](../../packages/core/src/fixer.test.ts). Use the `issue()` helper already defined in that file and manipulate `document.body` directly — the test environment is jsdom, which the existing `beforeEach` clears between tests.

Cover at minimum:
- The highest-confidence path (strong DOM signal present).
- At least one medium- or lower-confidence fallback.
- A case where `null` would be the correct return value (if applicable).

```ts
describe('video-caption heuristic', () => {
  it('suggests adding a captions track when none is present (medium confidence)', () => {
    const video = document.createElement('video');
    video.setAttribute('src', 'intro.mp4');
    document.body.appendChild(video);

    const fix = generateFix(issue('video-caption', 'video', video.outerHTML), video);

    expect(fix).not.toBeNull();
    expect(fix!.newHtml).toContain('track');
    expect(fix!.newHtml).toContain('captions');
    expect(fix!.confidence).toBe('medium');
  });
});
```

Run the suite with:

```bash
pnpm --filter @trya11y/core test
```

### 5. Document the heuristic

Update the heuristic count and rule list in [packages/core/src/fixer.ts](../../packages/core/src/fixer.ts) top-level comment (the numbered section headers keep the file navigable).

## Registering a heuristic from outside `fixer.ts`

`registerHeuristic` is exported. If you are building a plugin or a downstream package you can call it directly:

```ts
import { registerHeuristic } from '@trya11y/core';

registerHeuristic('my-custom-rule', (issue, element) => {
  // ...
  return null;
});
```

Registrations are global and take effect for all subsequent `generateFix` / `generateFixes` calls in the same JavaScript context.

## Checklist before opening a pull request

- [ ] `registerHeuristic` call added in `fixer.ts`
- [ ] At least one test per meaningful code path
- [ ] `pnpm --filter @trya11y/core test` passes
- [ ] `pnpm --filter @trya11y/core typecheck` passes
- [ ] Confidence levels and `reasoning` strings are honest and descriptive
- [ ] No live DOM mutations — always clone before modifying
