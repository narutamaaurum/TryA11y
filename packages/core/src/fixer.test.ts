import { describe, it, expect, beforeEach } from 'vitest';
import type { A11yIssue } from './types.js';
import { generateFix, generateFixes } from './fixer.js';

function issue(ruleId: string, selector = 'img', html = '<img src="x.jpg">'): A11yIssue {
  return {
    id: `${ruleId}-1`,
    ruleId,
    impact: 'critical',
    wcagLevel: 'A',
    wcagTags: ['wcag2a'],
    description: `${ruleId} violation`,
    help: `Fix ${ruleId}`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.10/${ruleId}`,
    element: { selector, html, tagName: selector.split(/[#.\[]/)[0] || 'unknown' },
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('image-alt heuristic', () => {
  it('uses figcaption text when image is inside a figure (high confidence)', () => {
    document.body.innerHTML = '<figure><img id="t" src="x.jpg"><figcaption>A sunrise over mountains</figcaption></figure>';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('image-alt', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.newHtml).toContain('alt="A sunrise over mountains"');
    expect(fix!.confidence).toBe('high');
  });

  it('uses title attribute as alt when no figcaption (high confidence)', () => {
    document.body.innerHTML = '<img id="t" src="x.jpg" title="Company logo">';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('image-alt', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.newHtml).toContain('alt="Company logo"');
    expect(fix!.confidence).toBe('high');
  });

  it('falls back to a placeholder when no signals found', () => {
    document.body.innerHTML = '<img id="t" src="photo.jpg">';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('image-alt', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(['low', 'medium']).toContain(fix!.confidence);
  });
});

describe('label heuristic', () => {
  it('wraps input with a label when no label exists (medium/low confidence)', () => {
    document.body.innerHTML = '<input id="t" type="text">';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('label', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.newHtml.toLowerCase()).toMatch(/label|aria-label/);
  });

  it('uses placeholder as aria-label when available (medium confidence)', () => {
    document.body.innerHTML = '<input id="t" type="email" placeholder="Email address">';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('label', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.newHtml).toContain('Email address');
    expect(fix!.confidence).toBe('medium');
  });
});

describe('button-name heuristic', () => {
  it('uses button text content as aria-label when button has text', () => {
    document.body.innerHTML = '<button id="t">Submit</button>';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('button-name', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
  });

  it('adds aria-label placeholder for empty icon buttons (low confidence)', () => {
    document.body.innerHTML = '<button id="t"><svg></svg></button>';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('button-name', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.confidence).toBe('low');
  });
});

describe('heading-order heuristic', () => {
  it('returns a fix suggestion for heading-order violations', () => {
    document.body.innerHTML = '<h3 id="t">Section title</h3>';
    const el = document.querySelector('#t')!;
    const fix = generateFix(issue('heading-order', '#t', el.outerHTML), el);
    expect(fix).not.toBeNull();
  });
});

describe('html-has-lang heuristic', () => {
  it('adds lang="en" to the html element', () => {
    const el = document.documentElement;
    el.removeAttribute('lang');
    const fix = generateFix(issue('html-has-lang', 'html', el.outerHTML), el);
    expect(fix).not.toBeNull();
    expect(fix!.newHtml).toContain('lang=');
  });
});

describe('generateFixes (batch)', () => {
  it('returns a Map keyed by issue id', () => {
    document.body.innerHTML = '<img id="img1" src="x.jpg" title="Logo"><input id="inp1" type="text" placeholder="Name">';
    const issues: A11yIssue[] = [
      issue('image-alt', '#img1', document.querySelector('#img1')!.outerHTML),
      issue('label', '#inp1', document.querySelector('#inp1')!.outerHTML),
    ];
    const fixes = generateFixes(issues);
    expect(fixes.size).toBe(2);
    expect(fixes.has('image-alt-1')).toBe(true);
    expect(fixes.has('label-1')).toBe(true);
  });

  it('skips issues whose selector does not match any element', () => {
    const issues: A11yIssue[] = [issue('image-alt', '#nonexistent', '<img src="x.jpg">')];
    const fixes = generateFixes(issues);
    expect(fixes.size).toBe(0);
  });
});
