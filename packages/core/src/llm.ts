// ---------------------------------------------------------------------------
// @trya11y/core — Optional Ollama LLM enhancement layer
// ---------------------------------------------------------------------------
// Enhances low/medium-confidence heuristic fixes by asking a local Ollama
// model for a better suggestion.  Falls back silently to the original fix on
// any network or parse error so the rest of the app is never blocked.
// ---------------------------------------------------------------------------
8	
import type { A11yIssue, FixSuggestion, OllamaConfig } from './types.js';
10	
const ENHANCE_TARGETS = new Set<FixSuggestion['confidence']>(['low', 'medium']);
const MAX_RESPONSE_BYTES = 64 * 1024; // 64 KB guard against runaway responses
13	
function buildPrompt(issue: A11yIssue, fix: FixSuggestion): string {
  return `You are an expert in web accessibility (WCAG 2.1). A heuristic engine produced the fix below but rated it as "${fix.confidence}" confidence because it could not find strong DOM signals.
16	
Improve the fix if you can. If the current fix is already good, return it unchanged.
18	
Rule: ${issue.ruleId}
Description: ${issue.description}
Element HTML: ${issue.element.html}
Current fix description: ${fix.description}
Current proposed HTML: ${fix.newHtml}
24	
Respond with ONLY a JSON object matching this exact shape (no markdown, no commentary):
{
  "description": "concise explanation of what was changed and why",
  "newHtml": "the corrected HTML",
  "confidence": "high" | "medium" | "low",
  "reasoning": "why you chose this confidence level"
}`;
}
33	
function parseResponse(raw: string, original: FixSuggestion): FixSuggestion {
  const trimmed = raw.trim();
  // Strip optional markdown fences the model may add despite instructions
  const jsonStr = trimmed.startsWith('```')
    ? trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '')
    : trimmed;
40	
  const parsed = JSON.parse(jsonStr) as Partial<FixSuggestion>;
42	
  if (
    typeof parsed.description !== 'string' ||
    typeof parsed.newHtml !== 'string' ||
    !['high', 'medium', 'low'].includes(parsed.confidence as string)
  ) {
    throw new Error('unexpected shape');
  }
50	
  return {
    ...original,
    description: parsed.description,
    newHtml: parsed.newHtml,
    confidence: parsed.confidence!,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : original.reasoning,
    source: 'llm',
  };
}
60	
async function callOllama(prompt: string, config: OllamaConfig): Promise<string> {
  // Validate baseUrl before fetching to prevent SSRF via user-supplied config.
  const base = new URL(config.baseUrl);
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('Ollama baseUrl must use http or https');
  }
67	
  const res = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      format: 'json',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
78	
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
80	
  const raw = await res.text();
  if (raw.length > MAX_RESPONSE_BYTES) throw new Error('Ollama response too large');
83	
  const body = JSON.parse(raw) as { message?: { content?: string } };
  const content = body?.message?.content;
  if (typeof content !== 'string') throw new Error('empty Ollama response');
  return content;
}
89	
export async function enhanceFix(
  issue: A11yIssue,
  fix: FixSuggestion,
  config: OllamaConfig,
): Promise<FixSuggestion> {
  try {
    const content = await callOllama(buildPrompt(issue, fix), config);
    return parseResponse(content, fix);
  } catch {
    return fix;
  }
}
102	
export async function enhanceFixes(
  issues: A11yIssue[],
  fixes: Map<string, FixSuggestion>,
  config: OllamaConfig,
): Promise<Map<string, FixSuggestion>> {
  if (!config.enabled) return fixes;
109	
  const result = new Map(fixes);
  const targets = issues.filter((issue) => {
    const fix = fixes.get(issue.id);
    return fix && ENHANCE_TARGETS.has(fix.confidence);
  });
115	
  await Promise.all(
    targets.map(async (issue) => {
      const fix = fixes.get(issue.id)!;
      result.set(issue.id, await enhanceFix(issue, fix, config));
    }),
  );
122	
  return result;
}
125	
export async function explainIssue(
  issue: A11yIssue,
  config: OllamaConfig,
): Promise<string> {
  const fix = issue.fix;
  const fixSection = fix
    ? `Suggested fix: ${fix.description}
Before: ${fix.oldHtml}
After:  ${fix.newHtml}`
    : 'No automatic fix is available for this issue.';

  const prompt = `You are a web accessibility expert helping a developer understand an issue on their page. They may not be familiar with CSS selectors or WCAG jargon — use plain, everyday language.

Rule: ${issue.ruleId}
WCAG criteria: ${issue.wcagTags.join(', ')}
CSS selector: ${issue.element.selector}
Element HTML: ${issue.element.html}
Issue description: ${issue.description}
${fixSection}

Write a short explanation with exactly four sections:

1. Where is this element? — Explain in plain English what "${issue.element.selector}" points to (e.g. "This is the first span inside the second div on the page"). Describe it in terms of what it looks like visually — is it a button, a heading, a link, an image? Mention where on the page it likely appears.
2. What is the problem? — Describe the concrete accessibility problem with this specific element. Avoid WCAG jargon. Explain it like you'd explain it to someone who has never heard of accessibility.
3. Who is affected? — Which users does this hurt and how (e.g. "blind users using a screen reader won't hear a label for this button").
4. How to fix it? — Explain the suggested fix shown above in simple terms. Walk through what changed (Before → After) and why that change solves the problem. Do not invent a different fix.

Be concise. No markdown. Plain text only.`;
146	
  try {
    const base = new URL(config.baseUrl);
    if (!['http:', 'https:'].includes(base.protocol)) throw new Error('invalid protocol');
150	
    const res = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const raw = await res.text();
    if (raw.length > MAX_RESPONSE_BYTES) throw new Error('response too large');
    const body = JSON.parse(raw) as { message?: { content?: string } };
    const content = body?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('empty response');
    return content.trim();
  } catch {
    return 'Could not generate explanation. Make sure Ollama is running and the model is available.';
  }
}
171	