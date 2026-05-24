// --------------------------------------------------------------------------
// @trya11y/core — Public API barrel export
// --------------------------------------------------------------------------

// Types
export type {
  Severity,
  Impact,
  WcagLevel,
  A11yIssue,
  FixSuggestion,
  FixType,
  ScanResult,
  ReportFormat,
  ReportOptions,
  PatchOperation,
  OllamaConfig,
} from './types.js';

// Scanner
export { scan } from './scanner.js';
export type { ScanOptions } from './scanner.js';

// Fixer
export {
  generateFix,
  generateFixes,
  registerHeuristic,
} from './fixer.js';

// Patcher
export {
  fixToPatchOps,
  applyPatches,
  applyFix,
  highlightElement,
} from './patcher.js';

// Reporter
export { generateReport } from './reporter.js';

// LLM enhancement
export { enhanceFix, enhanceFixes, explainIssue } from './llm.js';
