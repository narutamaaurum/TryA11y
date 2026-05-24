import { describe, it, expect } from 'vitest';
import type { ScanResult, A11yIssue, ReportOptions } from './types.js';
import { generateReport } from './reporter.js';

function makeIssue(overrides: Partial<A11yIssue> = {}): A11yIssue {
  return {
    id: 'issue-1',
    ruleId: 'image-alt',
    impact: 'critical',
    wcagLevel: 'A',
    wcagTags: ['wcag2a', 'wcag111'],
    description: 'Images must have alternate text',
    help: 'Ensure every image has alt text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
    element: { selector: 'img', html: '<img src="hero.jpg">', tagName: 'img' },
    ...overrides,
  };
}

function makeResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    url: 'https://example.com',
    timestamp: 1700000000000,
    issues: [makeIssue()],
    violations: 1,
    passes: 10,
    incomplete: 2,
    scanDurationMs: 150,
    ...overrides,
  };
}

const baseOpts: ReportOptions = { format: 'json', includePassingRules: false, includeFixes: false };

describe('generateReport — JSON', () => {
  it('produces valid JSON with the expected top-level keys', () => {
    const output = generateReport(makeResult(), baseOpts);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('meta');
    expect(parsed).toHaveProperty('scan');
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('issues');
  });

  it('summary.violations matches result.violations', () => {
    const result = makeResult({ violations: 3, issues: [makeIssue(), makeIssue({ id: 'issue-2' }), makeIssue({ id: 'issue-3' })] });
    const parsed = JSON.parse(generateReport(result, baseOpts));
    expect(parsed.summary.violations).toBe(3);
  });

  it('excludes fix data when includeFixes is false', () => {
    const issue = makeIssue();
    issue.fix = { description: 'Add alt', type: 'add-attribute', attribute: 'alt', value: 'Logo', oldHtml: '<img>', newHtml: '<img alt="Logo">', confidence: 'high' };
    const parsed = JSON.parse(generateReport(makeResult({ issues: [issue] }), { ...baseOpts, includeFixes: false }));
    expect(parsed.issues[0].fix).toBeUndefined();
  });

  it('includes fix data when includeFixes is true', () => {
    const issue = makeIssue();
    issue.fix = { description: 'Add alt', type: 'add-attribute', attribute: 'alt', value: 'Logo', oldHtml: '<img>', newHtml: '<img alt="Logo">', confidence: 'high' };
    const parsed = JSON.parse(generateReport(makeResult({ issues: [issue] }), { ...baseOpts, includeFixes: true }));
    expect(parsed.issues[0].fix).toBeDefined();
  });
});

describe('generateReport — HTML', () => {
  it('returns a string starting with <!DOCTYPE html>', () => {
    const output = generateReport(makeResult(), { format: 'html', includePassingRules: false, includeFixes: false });
    expect(output.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('escapes special HTML characters in the URL', () => {
    const result = makeResult({ url: 'https://example.com/?a=1&b=<xss>' });
    const output = generateReport(result, { format: 'html', includePassingRules: false, includeFixes: false });
    expect(output).toContain('&lt;xss&gt;');
    expect(output).not.toContain('<xss>');
  });

  it('includes issue rule id in the output', () => {
    const output = generateReport(makeResult(), { format: 'html', includePassingRules: false, includeFixes: false });
    expect(output).toContain('image-alt');
  });
});

describe('generateReport — Markdown', () => {
  it('starts with a top-level heading', () => {
    const output = generateReport(makeResult(), { format: 'markdown', includePassingRules: false, includeFixes: false });
    expect(output.trimStart()).toMatch(/^# /);
  });

  it('includes a summary table with violation count', () => {
    const output = generateReport(makeResult({ violations: 5 }), { format: 'markdown', includePassingRules: false, includeFixes: false });
    expect(output).toContain('| **Violations** | 5 |');
  });

  it('includes issue help text in a heading', () => {
    const output = generateReport(makeResult(), { format: 'markdown', includePassingRules: false, includeFixes: false });
    expect(output).toContain('Ensure every image has alt text');
  });
});

describe('generateReport — unsupported format', () => {
  it('throws for an unknown format', () => {
    expect(() =>
      generateReport(makeResult(), { format: 'xml' as never, includePassingRules: false, includeFixes: false }),
    ).toThrow();
  });
});
