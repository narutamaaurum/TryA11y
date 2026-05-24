// Worker-safe exports: no axe-core, no DOM APIs.
// Safe to import from Chrome extension service workers and Node.js.
export type {
  A11yIssue,
  FixSuggestion,
  ScanResult,
  ReportFormat,
  ReportOptions,
  OllamaConfig,
} from './types.js';

export { generateReport } from './reporter.js';
export { enhanceFix, enhanceFixes, explainIssue } from './llm.js';
