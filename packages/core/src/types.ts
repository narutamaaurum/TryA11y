// --------------------------------------------------------------------------
// @trya11y/core — Shared type definitions
// --------------------------------------------------------------------------

/** Impact on users, aligned with axe-core's rating system. */
export type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

/** @deprecated Use `Impact` instead. Kept for backwards compatibility. */
export type Severity = Impact;

/** WCAG conformance level. */
export type WcagLevel = 'A' | 'AA' | 'AAA';

/**
 * A single detected accessibility issue, normalised from axe-core results.
 */
export interface A11yIssue {
  /** Unique id for this issue instance (`ruleId-index`). */
  id: string;
  /** The axe-core rule id (e.g. `"image-alt"`). */
  ruleId: string;
  /** Human-readable description of the rule. */
  description: string;
  /** Short help text explaining how to fix the issue. */
  help: string;
  /** URL to the full rule documentation. */
  helpUrl: string;
  /** Impact rating. */
  impact: Impact;
  /** WCAG tags associated with the rule (e.g. `["wcag2a", "wcag111"]`). */
  wcagTags: string[];
  /** Highest WCAG conformance level the rule maps to. */
  wcagLevel: WcagLevel;
  /** Information about the DOM element that triggered the issue. */
  element: {
    /** CSS selector path to the element. */
    selector: string;
    /** Outer HTML snippet. */
    html: string;
    /** Lower-cased tag name. */
    tagName: string;
  };
  /** An optional heuristic fix suggestion. */
  fix?: FixSuggestion;
}

/**
 * A suggested fix for an accessibility issue.
 */
export interface FixSuggestion {
  /** Human-readable explanation of the fix. */
  description: string;
  /** Category of the fix. */
  type: FixType;
  /** Attribute being added or modified (when applicable). */
  attribute?: string;
  /** New attribute value (when applicable). */
  value?: string;
  /** The original HTML before the fix. */
  oldHtml: string;
  /** The corrected HTML after the fix. */
  newHtml: string;
  /** Confidence in the quality of the generated fix. */
  confidence: 'high' | 'medium' | 'low';
  /**
   * Human-readable explanation of WHY this confidence level was assigned —
   * e.g. which DOM signals were (or weren't) found.
   */
  reasoning?: string;
  /** Whether the fix was produced by the heuristic engine or an LLM. */
  source?: 'heuristic' | 'llm';
}

/**
 * Configuration for the optional Ollama LLM enhancement layer.
 * All fields are required so Settings can round-trip the object safely.
 */
export interface OllamaConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
}

/** The kind of DOM mutation a fix applies. */
export type FixType =
  | 'add-attribute'
  | 'modify-attribute'
  | 'add-element'
  | 'modify-element'
  | 'change-color'
  | 'restructure';

/**
 * The result of a full accessibility scan.
 */
export interface ScanResult {
  /** The URL that was scanned. */
  url: string;
  /** Epoch-millisecond timestamp of the scan. */
  timestamp: number;
  /** Normalised list of violations. */
  issues: A11yIssue[];
  /** Number of passing rules. */
  passes: number;
  /** Total number of violation nodes. */
  violations: number;
  /** Number of incomplete (needs-review) results. */
  incomplete: number;
  /** Wall-clock scan duration in milliseconds. */
  scanDurationMs: number;
}

/** Supported report output formats. */
export type ReportFormat = 'html' | 'json' | 'markdown';

/** Options for report generation. */
export interface ReportOptions {
  format: ReportFormat;
  includePassingRules: boolean;
  includeFixes: boolean;
  title?: string;
}

/**
 * A low-level patch operation for the DOM patching engine.
 */
export interface PatchOperation {
  /** The issue id this operation addresses. */
  issueId: string;
  /** CSS selector targeting the element to patch. */
  selector: string;
  /** Kind of DOM mutation. */
  type: 'setAttribute' | 'removeAttribute' | 'replaceElement' | 'wrapElement' | 'setStyle';
  /** Attribute name (for set/remove attribute). */
  attribute?: string;
  /** New value (for setAttribute / setStyle). */
  value?: string;
  /** Previous value, stored for undo. */
  oldValue?: string;
  /** Replacement or wrapper HTML (for replaceElement / wrapElement). */
  newElement?: string;
}
