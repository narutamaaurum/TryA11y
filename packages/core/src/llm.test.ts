import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhanceFix, enhanceFixes, explainIssue } from './llm.js';
import type { A11yIssue, FixSuggestion, OllamaConfig } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ISSUE: A11yIssue = {
  id: 'image-alt-0',
  ruleId: 'image-alt',
  description: 'Images must have alternate text',
  help: 'Ensure every image has alt text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  impact: 'critical',
  wcagTags: ['wcag2a', 'wcag111'],
  wcagLevel: 'A',
  element: {
    selector: 'img',
    html: '<img src="hero.jpg">',
    tagName: 'img',
  },
};

const LOW_FIX: FixSuggestion = {
  description: 'Add descriptive alt text (review needed)',
  type: 'add-attribute',
  attribute: 'alt',
  value: 'TODO: Describe this image',
  oldHtml: '<img src="hero.jpg">',
  newHtml: '<img src="hero.jpg" alt="TODO: Describe this image">',
  confidence: 'low',
  reasoning: 'No context found in the DOM.',
};

const MEDIUM_FIX: FixSuggestion = {
  ...LOW_FIX,
  confidence: 'medium',
  description: 'Use nearby link text as alt',
  value: 'Homepage',
  newHtml: '<img src="hero.jpg" alt="Homepage">',
};

const HIGH_FIX: FixSuggestion = {
  ...LOW_FIX,
  confidence: 'high',
  description: 'Use figcaption text as alt',
  value: 'Sales chart for Q1',
  newHtml: '<img src="hero.jpg" alt="Sales chart for Q1">',
};

const CONFIG: OllamaConfig = {
  enabled: true,
  baseUrl: 'http://localhost:11434',
  model: 'llama3',
};

function ollamaResponse(fix: Partial<FixSuggestion>) {
  return JSON.stringify({
    message: {
      content: JSON.stringify({
        description: fix.description ?? 'Enhanced description',
        newHtml: fix.newHtml ?? '<img src="hero.jpg" alt="Enhanced">',
        confidence: fix.confidence ?? 'high',
        reasoning: fix.reasoning ?? 'LLM improved the fix.',
      }),
    },
  });
}

// ---------------------------------------------------------------------------
// enhanceFix — happy path
// ---------------------------------------------------------------------------

describe('enhanceFix – happy path', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        ollamaResponse({
          description: 'Hero image showing team at work',
          newHtml: '<img src="hero.jpg" alt="Hero image showing team at work">',
          confidence: 'high',
          reasoning: 'Inferred from surrounding text context.',
        }),
      status: 200,
    } as Response);
  });

  afterEach(() => vi.restoreAllMocks());

  it('returns an enhanced FixSuggestion on success', async () => {
    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result.description).toBe('Hero image showing team at work');
    expect(result.newHtml).toBe('<img src="hero.jpg" alt="Hero image showing team at work">');
    expect(result.confidence).toBe('high');
    expect(result.source).toBe('llm');
  });

  it('preserves original oldHtml on the enhanced fix', async () => {
    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);
    expect(result.oldHtml).toBe(LOW_FIX.oldHtml);
  });

  it('sends a POST to the correct Ollama chat endpoint', async () => {
    await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('includes the rule id and element HTML in the request body', async () => {
    await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1]!.body as string);
    expect(body.messages[0].content).toContain('image-alt');
    expect(body.messages[0].content).toContain('<img src="hero.jpg">');
  });

  it('updates reasoning when the model provides one', async () => {
    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);
    expect(result.reasoning).toBe('Inferred from surrounding text context.');
  });
});

// ---------------------------------------------------------------------------
// enhanceFix — markdown-fenced JSON
// ---------------------------------------------------------------------------

describe('enhanceFix – markdown-fenced response', () => {
  afterEach(() => vi.restoreAllMocks());

  it('strips markdown code fences before parsing', async () => {
    const content = JSON.stringify({
      description: 'Stripped fence fix',
      newHtml: '<img alt="Stripped">',
      confidence: 'high',
      reasoning: '',
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ message: { content: '```json\n' + content + '\n```' } }),
      status: 200,
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result.description).toBe('Stripped fence fix');
    expect(result.newHtml).toBe('<img alt="Stripped">');
  });
});

// ---------------------------------------------------------------------------
// enhanceFix — silent fallback on errors
// ---------------------------------------------------------------------------

describe('enhanceFix – silent fallback', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the original fix when fetch throws a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });

  it('returns the original fix when Ollama returns a non-OK status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '',
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });

  it('returns the original fix when the response body is invalid JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'not json at all',
      status: 200,
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });

  it('returns the original fix when the parsed object has an unexpected shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ message: { content: JSON.stringify({ wrong: 'fields' }) } }),
      status: 200,
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });

  it('returns the original fix when the response content is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ message: {} }),
      status: 200,
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });

  it('returns the original fix when the response exceeds 64 KB', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'x'.repeat(65 * 1024),
      status: 200,
    } as Response);

    const result = await enhanceFix(ISSUE, LOW_FIX, CONFIG);

    expect(result).toEqual(LOW_FIX);
  });
});

// ---------------------------------------------------------------------------
// enhanceFix — baseUrl protocol validation
// ---------------------------------------------------------------------------

describe('enhanceFix – baseUrl validation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the original fix for a non-http/https baseUrl', async () => {
    const badConfig: OllamaConfig = { ...CONFIG, baseUrl: 'ftp://evil.example.com' };
    const result = await enhanceFix(ISSUE, LOW_FIX, badConfig);
    expect(result).toEqual(LOW_FIX);
  });

  it('accepts https:// baseUrl without falling back', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ollamaResponse({ confidence: 'high' }),
      status: 200,
    } as Response);

    const httpsConfig: OllamaConfig = { ...CONFIG, baseUrl: 'https://ollama.example.com' };
    const result = await enhanceFix(ISSUE, LOW_FIX, httpsConfig);

    expect(result.source).toBe('llm');
  });
});

// ---------------------------------------------------------------------------
// enhanceFixes — batch processing
// ---------------------------------------------------------------------------

describe('enhanceFixes', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the original map unchanged when enabled is false', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const fixes = new Map([['image-alt-0', HIGH_FIX]]);
    const disabledConfig: OllamaConfig = { ...CONFIG, enabled: false };

    const result = await enhanceFixes([ISSUE], fixes, disabledConfig);

    expect(result).toBe(fixes);
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not call Ollama for high-confidence fixes', async () => {
    vi.spyOn(globalThis, 'fetch');
    const fixes = new Map([['image-alt-0', HIGH_FIX]]);

    await enhanceFixes([ISSUE], fixes, CONFIG);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls Ollama for low-confidence fixes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ollamaResponse({ confidence: 'high' }),
      status: 200,
    } as Response);

    const fixes = new Map([['image-alt-0', LOW_FIX]]);

    await enhanceFixes([ISSUE], fixes, CONFIG);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('calls Ollama for medium-confidence fixes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ollamaResponse({ confidence: 'high' }),
      status: 200,
    } as Response);

    const fixes = new Map([['image-alt-0', MEDIUM_FIX]]);

    await enhanceFixes([ISSUE], fixes, CONFIG);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('skips issues that have no entry in the fixes map', async () => {
    vi.spyOn(globalThis, 'fetch');
    const emptyFixes = new Map<string, FixSuggestion>();

    await enhanceFixes([ISSUE], emptyFixes, CONFIG);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns a new Map with enhanced fixes merged in', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        ollamaResponse({ description: 'LLM improved', confidence: 'high' }),
      status: 200,
    } as Response);

    const fixes = new Map([['image-alt-0', LOW_FIX]]);
    const result = await enhanceFixes([ISSUE], fixes, CONFIG);

    expect(result.get('image-alt-0')!.description).toBe('LLM improved');
    expect(result.get('image-alt-0')!.source).toBe('llm');
  });

  it('processes multiple low/medium fixes in parallel', async () => {
    const issue2: A11yIssue = { ...ISSUE, id: 'button-name-0', ruleId: 'button-name' };
    const fix2: FixSuggestion = { ...MEDIUM_FIX };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ollamaResponse({ confidence: 'high' }),
      status: 200,
    } as Response);

    const fixes = new Map([
      ['image-alt-0', LOW_FIX],
      ['button-name-0', fix2],
    ]);

    await enhanceFixes([ISSUE, issue2], fixes, CONFIG);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// explainIssue
// ---------------------------------------------------------------------------

describe('explainIssue', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the explanation string from Ollama on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          message: { content: '1. Where is this element? ... 2. What is the problem? ...' },
        }),
      status: 200,
    } as Response);

    const explanation = await explainIssue(ISSUE, CONFIG);

    expect(explanation).toContain('Where is this element?');
  });

  it('trims whitespace from the explanation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ message: { content: '   Some explanation   ' } }),
      status: 200,
    } as Response);

    const explanation = await explainIssue(ISSUE, CONFIG);

    expect(explanation).toBe('Some explanation');
  });

  it('returns a fallback message when Ollama is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const explanation = await explainIssue(ISSUE, CONFIG);

    expect(explanation).toContain('Could not generate explanation');
  });

  it('returns a fallback message when the response status is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as Response);

    const explanation = await explainIssue(ISSUE, CONFIG);

    expect(explanation).toContain('Could not generate explanation');
  });

  it('returns a fallback message when the response content is empty', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ message: { content: '   ' } }),
      status: 200,
    } as Response);

    const explanation = await explainIssue(ISSUE, CONFIG);

    expect(explanation).toContain('Could not generate explanation');
  });

  it('returns a fallback message for a non-http/https baseUrl', async () => {
    const badConfig: OllamaConfig = { ...CONFIG, baseUrl: 'file:///etc/passwd' };

    const explanation = await explainIssue(ISSUE, badConfig);

    expect(explanation).toContain('Could not generate explanation');
  });

  it('includes the issue rule id in the request body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ message: { content: 'explanation text' } }),
      status: 200,
    } as Response);

    await explainIssue(ISSUE, CONFIG);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1]!.body as string);
    expect(body.messages[0].content).toContain('image-alt');
  });
});
