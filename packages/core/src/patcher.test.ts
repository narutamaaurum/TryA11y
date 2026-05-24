import { describe, it, expect, beforeEach } from 'vitest';
import type { A11yIssue, FixSuggestion } from './types.js';
import { fixToPatchOps, applyPatches, applyFix } from './patcher.js';

function issue(selector: string): A11yIssue {
  return {
    id: 'test-1',
    ruleId: 'image-alt',
    impact: 'critical',
    wcagLevel: 'A',
    wcagTags: ['wcag2a'],
    description: 'test',
    help: 'test',
    helpUrl: 'https://example.com',
    element: { selector, html: '', tagName: 'img' },
  };
}

function fix(overrides: Partial<FixSuggestion> = {}): FixSuggestion {
  return {
    description: 'Test fix',
    type: 'add-attribute',
    attribute: 'alt',
    value: 'Logo',
    oldHtml: '<img src="x.jpg">',
    newHtml: '<img src="x.jpg" alt="Logo">',
    confidence: 'high',
    ...overrides,
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('fixToPatchOps', () => {
  it('maps add-attribute to a setAttribute op', () => {
    const ops = fixToPatchOps(issue('img'), fix({ type: 'add-attribute', attribute: 'alt', value: 'Logo' }));
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe('setAttribute');
    expect(ops[0].attribute).toBe('alt');
    expect(ops[0].value).toBe('Logo');
  });

  it('maps modify-attribute to a setAttribute op', () => {
    const ops = fixToPatchOps(issue('img'), fix({ type: 'modify-attribute', attribute: 'role', value: 'img' }));
    expect(ops[0].type).toBe('setAttribute');
  });

  it('maps modify-element to a replaceElement op', () => {
    const ops = fixToPatchOps(issue('img'), fix({ type: 'modify-element', newHtml: '<img src="x.jpg" alt="Logo">' }));
    expect(ops[0].type).toBe('replaceElement');
  });

  it('maps add-element to a replaceElement op', () => {
    const ops = fixToPatchOps(issue('input'), fix({ type: 'add-element', newHtml: '<label>Name <input></label>' }));
    expect(ops[0].type).toBe('replaceElement');
  });

  it('maps change-color to a setStyle op', () => {
    const ops = fixToPatchOps(issue('p'), fix({ type: 'change-color', value: 'color: #000000' }));
    expect(ops[0].type).toBe('setStyle');
    expect(ops[0].attribute).toBe('color');
    expect(ops[0].value).toBe('#000000');
  });
});

describe('applyPatches — setAttribute', () => {
  it('sets the attribute on the target element', () => {
    document.body.innerHTML = '<img id="t" src="x.jpg">';
    applyPatches([{ issueId: 'x', selector: '#t', type: 'setAttribute', attribute: 'alt', value: 'Logo' }]);
    expect(document.querySelector('#t')!.getAttribute('alt')).toBe('Logo');
  });

  it('undo restores the original attribute value', () => {
    document.body.innerHTML = '<img id="t" src="x.jpg" alt="old">';
    const undo = applyPatches([{ issueId: 'x', selector: '#t', type: 'setAttribute', attribute: 'alt', value: 'new' }]);
    undo();
    expect(document.querySelector('#t')!.getAttribute('alt')).toBe('old');
  });

  it('undo removes the attribute when it did not exist before', () => {
    document.body.innerHTML = '<img id="t" src="x.jpg">';
    const undo = applyPatches([{ issueId: 'x', selector: '#t', type: 'setAttribute', attribute: 'alt', value: 'Logo' }]);
    undo();
    expect(document.querySelector('#t')!.hasAttribute('alt')).toBe(false);
  });
});

describe('applyPatches — setStyle', () => {
  it('sets the CSS property on the element', () => {
    document.body.innerHTML = '<p id="t" style="color:red">text</p>';
    applyPatches([{ issueId: 'x', selector: '#t', type: 'setStyle', attribute: 'color', value: 'black' }]);
    expect((document.querySelector('#t') as HTMLElement).style.color).toBe('black');
  });

  it('undo restores the original style', () => {
    document.body.innerHTML = '<p id="t" style="color:red">text</p>';
    const undo = applyPatches([{ issueId: 'x', selector: '#t', type: 'setStyle', attribute: 'color', value: 'black' }]);
    undo();
    expect((document.querySelector('#t') as HTMLElement).style.color).toBe('red');
  });
});

describe('applyFix convenience wrapper', () => {
  it('applies the fix and returns an undo function', () => {
    document.body.innerHTML = '<img id="t" src="x.jpg">';
    const el = document.querySelector('#t')!;
    const undo = applyFix(issue('#t'), fix({ type: 'add-attribute', attribute: 'alt', value: 'Logo' }));
    expect(el.getAttribute('alt')).toBe('Logo');
    undo();
    expect(el.hasAttribute('alt')).toBe(false);
  });
});
