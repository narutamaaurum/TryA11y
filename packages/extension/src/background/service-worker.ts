// ---------------------------------------------------------------------------
// @trya11y/extension — MV3 Service Worker
// ---------------------------------------------------------------------------
// Handles background tasks: LLM enhancement, report generation, storage ops.
// Uses chrome.runtime.connect (Ports) for Ollama to avoid the 30s message
// channel timeout in MV3.
// ---------------------------------------------------------------------------

import type { A11yIssue, FixSuggestion, OllamaConfig } from '@trya11y/core/worker';
import { generateReport, enhanceFixes, explainIssue } from '@trya11y/core/worker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OLLAMA_CONFIG_KEY = 'trya11y_ollama_config';
const HISTORY_KEY = 'trya11y_history';

async function getOllamaConfig(): Promise<OllamaConfig> {
  const stored = await chrome.storage.local.get(OLLAMA_CONFIG_KEY);
  return (stored[OLLAMA_CONFIG_KEY] as OllamaConfig | undefined) ?? {
    enabled: false,
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  };
}

// ---------------------------------------------------------------------------
// Long-running port connections (Ollama explain — avoids 30s MV3 timeout)
// ---------------------------------------------------------------------------

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'explain-issue') return;

  port.onMessage.addListener(async (message: { issue: A11yIssue; fix?: FixSuggestion; config?: OllamaConfig }) => {
    const ollamaConfig = message.config ?? await getOllamaConfig();
    const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20_000);
    try {
      const issueWithFix = message.fix ? { ...message.issue, fix: message.fix } : message.issue;
      const explanation = await explainIssue(issueWithFix, { ...ollamaConfig, enabled: true });
      port.postMessage({ ok: true, explanation });
    } catch (err) {
      port.postMessage({ ok: false, explanation: `Could not generate explanation: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      clearInterval(keepAlive);
      port.disconnect();
    }
  });
});

// ---------------------------------------------------------------------------
// Regular message handler
// ---------------------------------------------------------------------------

type MessageType =
  | 'GET_LAST_SCAN'
  | 'EXPORT_REPORT'
  | 'GET_SCAN_HISTORY'
  | 'SET_OLLAMA_CONFIG'
  | 'ENHANCE_FIXES_LLM'
  | 'SAVE_SCAN_HISTORY';

interface ExtMessage {
  type: MessageType;
  payload?: unknown;
}

interface SetOllamaConfigMessage extends ExtMessage {
  type: 'SET_OLLAMA_CONFIG';
  payload: OllamaConfig;
}

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_LAST_SCAN': {
          const stored = await chrome.storage.local.get('lastScanSummary');
          sendResponse({ ok: true, data: stored.lastScanSummary ?? null });
          break;
        }

        case 'GET_SCAN_HISTORY': {
          const stored = await chrome.storage.local.get(HISTORY_KEY);
          sendResponse({ ok: true, data: stored[HISTORY_KEY] ?? [] });
          break;
        }

        case 'SAVE_SCAN_HISTORY': {
          const entry = message.payload as { violations: number; timestamp: number; url: string };
          const stored = await chrome.storage.local.get(HISTORY_KEY);
          const history: typeof entry[] = stored[HISTORY_KEY] ?? [];
          history.unshift(entry);
          if (history.length > 50) history.length = 50;
          await chrome.storage.local.set({ [HISTORY_KEY]: history });
          sendResponse({ ok: true });
          break;
        }

        case 'EXPORT_REPORT': {
          const { result, format } = message.payload as { result: import('@trya11y/core/worker').ScanResult; format: string };
          const report = generateReport(result, {
            format: format as import('@trya11y/core/worker').ReportFormat,
            includePassingRules: false,
            includeFixes: true,
          });
          const mime = format === 'json' ? 'application/json' : format === 'html' ? 'text/html' : 'text/markdown';
          const ext = format === 'markdown' ? 'md' : format;
          const blob = new Blob([report], { type: mime });
          const url = URL.createObjectURL(blob);
          await chrome.downloads.download({ url, filename: `trya11y-report.${ext}`, saveAs: false });
          URL.revokeObjectURL(url);
          sendResponse({ ok: true });
          break;
        }

        case 'SET_OLLAMA_CONFIG': {
          const config = (message as SetOllamaConfigMessage).payload;
          await chrome.storage.local.set({ [OLLAMA_CONFIG_KEY]: config });
          sendResponse({ ok: true });
          break;
        }

        case 'ENHANCE_FIXES_LLM': {
          const { issues, fixes: fixesObj, tabId } = message.payload as {
            issues: A11yIssue[];
            fixes: Record<string, FixSuggestion>;
            tabId: number;
          };
          const ollamaConfig = await getOllamaConfig();
          if (!ollamaConfig.enabled) { sendResponse({ ok: false }); break; }
          const fixesMap = new Map(Object.entries(fixesObj ?? {}));
          const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20_000);
          try {
            const enhanced = await enhanceFixes(issues, fixesMap, ollamaConfig);
            chrome.tabs.sendMessage(tabId, { type: 'LLM_ENHANCE_RESULT', payload: enhanced });
            sendResponse({ ok: true });
          } finally {
            clearInterval(keepAlive);
          }
          break;
        }

        default:
          sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  })();
  return true; // keep channel open for async response
});
