import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { A11yIssue, ScanResult } from './types.js';

// ---------------------------------------------------------------------------
// axe-core mock
// ---------------------------------------------------------------------------

const mockAxeRun = vi.fn();
const mockAxeReset = vi.fn();

vi.mock('axe-core', () => ({
  default: { run: mockAxeRun, reset: mockAxeReset },
}));

// Import after mock is registered so the module picks up the stub.
const { scan } = await import('./scanner.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViolation(
  overrides: Partial<{
    id: string;
    description: string;
    help: string;
    helpUrl: string;
    impact: string | null;
    tags: string[];
    html: string;
    target: string[];
    nodes: { html: string; target: string[] }[];
  }> = {},
) {
  const {
    id = 'image-alt',
    description = 'Images must have alternate text',
    help = 'Ensure every image has alt text',
    helpUrl = 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
    impact = 'critical',
    tags = ['wcag2a', 'wcag111', 'cat.text-alternatives'],
    html = '<img src="hero.jpg">',
    target = ['img'],
    nodes,
  } = overrides;

  return {
    id, description, help, helpUrl, impact, tags,
    nodes: nodes ?? [{ html, target }],
  };
}

function emptyAxeResult(overrides: { violations?: unknown[]; passes?: unknown[]; incomplete?: unknown[] } = {}) {
  return {
    violations: overrides.violations ?? [],
    passes: overrides.passes ?? [],
    incomplete: overrides.incomplete ?? [],
  };
}

beforeEach(() => {
  mockAxeRun.mockResolvedValue(emptyAxeResult());
  mockAxeReset.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('scan – return shape', () => {
  it('resolves to a ScanResult with all required fields', async () => {
    const result: ScanResult = await scan();
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('passes');
    expect(result).toHaveProperty('violations');
    expect(result).toHaveProperty('incomplete');
    expect(result).toHaveProperty('scanDurationMs');
  });

  it('sets url from window.location.href', async () => {
    const result = await scan();
    expect(result.url).toBe(window.location.href);
  });

  it('sets timestamp close to the current time', async () => {
    const before = Date.now();
    const result = await scan();
    const after = Date.now();
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('sets scanDurationMs to a non-negative integer', async () => {
    const result = await scan();
    expect(result.scanDurationMs).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.scanDurationMs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Violation normalisation
// ---------------------------------------------------------------------------

describe('scan – violation normalisation', () => {
  it('returns an empty issues array when there are no violations', async () => {
    const result = await scan();
    expect(result.issues).toEqual([]);
    expect(result.violations).toBe(0);
  });

  it('counts passes and incomplete from axe results', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ passes: [{}, {}, {}], incomplete: [{}, {}] }));
    const result = await scan();
    expect(result.passes).toBe(3);
    expect(result.incomplete).toBe(2);
  });

  it('normalises a single violation node into an A11yIssue', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation()] }));
    const result = await scan();
    expect(result.issues).toHaveLength(1);
    const issue: A11yIssue = result.issues[0];
    expect(issue.id).toBe('image-alt-0');
    expect(issue.ruleId).toBe('image-alt');
    expect(issue.impact).toBe('critical');
    expect(issue.element.html).toBe('<img src="hero.jpg">');
  });

  it('creates one A11yIssue per node across multiple violations', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({
      violations: [
        makeViolation({ id: 'image-alt', nodes: [{ html: '<img src="a.jpg">', target: ['img.a'] }, { html: '<img src="b.jpg">', target: ['img.b'] }] }),
        makeViolation({ id: 'label', html: '<input type="text">', target: ['input'] }),
      ],
    }));
    const result = await scan();
    expect(result.issues).toHaveLength(3);
  });

  it('joins multi-part target arrays with " > " for the selector', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({
      violations: [makeViolation({ target: ['main', 'section', 'img'] })],
    }));
    const result = await scan();
    expect(result.issues[0].element.selector).toBe('main > section > img');
  });

  it('defaults impact to "moderate" when axe returns null', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({
      violations: [makeViolation({ impact: null })],
    }));
    const result = await scan();
    expect(result.issues[0].impact).toBe('moderate');
  });
});

// ---------------------------------------------------------------------------
// WCAG level extraction
// ---------------------------------------------------------------------------

describe('scan – WCAG level extraction', () => {
  it('assigns level "A" when only wcag2a tags are present', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ tags: ['wcag2a', 'wcag111'] })] }));
    const result = await scan();
    expect(result.issues[0].wcagLevel).toBe('A');
  });

  it('assigns level "AA" when an "aa" tag is present', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ tags: ['wcag2a', 'wcag2aa', 'wcag143'] })] }));
    const result = await scan();
    expect(result.issues[0].wcagLevel).toBe('AA');
  });

  it('assigns level "AAA" when an "aaa" tag is present', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ tags: ['wcag2a', 'wcag2aaa'] })] }));
    const result = await scan();
    expect(result.issues[0].wcagLevel).toBe('AAA');
  });

  it('keeps only wcag-prefixed tags in wcagTags', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ tags: ['wcag2a', 'cat.text-alternatives', 'best-practice'] })] }));
    const result = await scan();
    expect(result.issues[0].wcagTags).toEqual(['wcag2a']);
  });
});

// ---------------------------------------------------------------------------
// Tag name extraction
// ---------------------------------------------------------------------------

describe('scan – tag name extraction', () => {
  it('extracts "<img src="x.jpg">" → tagName "img"', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ html: '<img src="x.jpg">' })] }));
    const result = await scan();
    expect(result.issues[0].element.tagName).toBe('img');
  });

  it('extracts "<button class="foo">" → tagName "button"', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ html: '<button class="foo">' })] }));
    const result = await scan();
    expect(result.issues[0].element.tagName).toBe('button');
  });

  it('extracts "<a href="/about">text</a>" → tagName "a"', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ html: '<a href="/about">text</a>' })] }));
    const result = await scan();
    expect(result.issues[0].element.tagName).toBe('a');
  });

  it('extracts "<INPUT type="text">" → tagName "input"', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ html: '<INPUT type="text">' })] }));
    const result = await scan();
    expect(result.issues[0].element.tagName).toBe('input');
  });

  it('falls back to "unknown" for malformed HTML snippets', async () => {
    mockAxeRun.mockResolvedValueOnce(emptyAxeResult({ violations: [makeViolation({ html: 'not html' })] }));
    const result = await scan();
    expect(result.issues[0].element.tagName).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// ScanOptions.rules
// ---------------------------------------------------------------------------

describe('scan – ScanOptions.rules', () => {
  it('does not set axeConfig.rules when options.rules is empty', async () => {
    await scan({ rules: [] });
    const calledConfig = mockAxeRun.mock.calls[0][1] as { rules?: Record<string, { enabled: boolean }> };
    expect(calledConfig.rules).toBeUndefined();
  });

  it('enables only the requested rules via axeConfig.rules', async () => {
    await scan({ rules: ['image-alt', 'label'] });
    const calledConfig = mockAxeRun.mock.calls[0][1] as { rules?: Record<string, { enabled: boolean }> };
    expect(calledConfig.rules).toEqual({ 'image-alt': { enabled: true }, label: { enabled: true } });
  });
});

// ---------------------------------------------------------------------------
// ScanOptions.wcagLevel
// ---------------------------------------------------------------------------

describe('scan – ScanOptions.wcagLevel', () => {
  it('sets runOnly tags for WCAG Level A', async () => {
    await scan({ wcagLevel: 'A' });
    const cfg = mockAxeRun.mock.calls[0][1] as { runOnly?: { type: string; values: string[] } };
    expect(cfg.runOnly?.type).toBe('tag');
    expect(cfg.runOnly?.values).toContain('wcag2a');
  });

  it('sets runOnly tags for WCAG Level AA', async () => {
    await scan({ wcagLevel: 'AA' });
    const cfg = mockAxeRun.mock.calls[0][1] as { runOnly?: { type: string; values: string[] } };
    expect(cfg.runOnly?.values).toContain('wcag2aa');
  });

  it('sets runOnly tags for WCAG Level AAA', async () => {
    await scan({ wcagLevel: 'AAA' });
    const cfg = mockAxeRun.mock.calls[0][1] as { runOnly?: { type: string; values: string[] } };
    expect(cfg.runOnly?.values).toContain('wcag2aaa');
  });

  it('does not set runOnly when wcagLevel is omitted', async () => {
    await scan();
    const cfg = mockAxeRun.mock.calls[0][1] as { runOnly?: unknown };
    expect(cfg.runOnly).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ScanOptions.context
// ---------------------------------------------------------------------------

describe('scan – ScanOptions.context', () => {
  it('passes a CSS selector string to axe.run as the context', async () => {
    await scan({ context: 'main' });
    expect(mockAxeRun.mock.calls[0][0]).toBe('main');
  });

  it('passes an HTMLElement directly to axe.run as the context', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    await scan({ context: el });
    expect(mockAxeRun.mock.calls[0][0]).toBe(el);
    document.body.removeChild(el);
  });

  it('falls back to document when no context is provided', async () => {
    await scan();
    expect(mockAxeRun.mock.calls[0][0]).toBe(document);
  });
});
