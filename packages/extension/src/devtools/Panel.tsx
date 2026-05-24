import React, { useReducer, useCallback, useState, useEffect } from 'react';
import type { A11yIssue, FixSuggestion, ScanResult, OllamaConfig } from '@trya11y/core';
import { IssueCard } from './components/IssueCard';
import { IssueDetail } from './components/IssueDetail';
import { ScanButton } from './components/ScanButton';
import { ReportExporter } from './components/ReportExporter';
import { HistoryPanel } from './components/HistoryPanel';

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

interface PanelState {
  scanning: boolean;
  scanResult: ScanResult | null;
  fixes: Record<string, FixSuggestion>;
  selectedIssue: A11yIssue | null;
  appliedFixes: Set<string>;
  severityFilter: string;
}

type PanelAction =
  | { type: 'SCAN_START' }
  | { type: 'SCAN_COMPLETE'; result: ScanResult; fixes: Record<string, FixSuggestion> }
  | { type: 'SELECT_ISSUE'; issue: A11yIssue | null }
  | { type: 'APPLY_FIX'; issueId: string }
  | { type: 'UNDO_FIX'; issueId: string }
  | { type: 'SET_SEVERITY_FILTER'; severity: string }
  | { type: 'MERGE_LLM_FIXES'; issues: A11yIssue[] };

function reducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'SCAN_START':
      return { ...state, scanning: true, scanResult: null, fixes: {}, selectedIssue: null, appliedFixes: new Set() };
    case 'SCAN_COMPLETE':
      return { ...state, scanning: false, scanResult: action.result, fixes: action.fixes };
    case 'SELECT_ISSUE':
      return { ...state, selectedIssue: action.issue };
    case 'APPLY_FIX':
      return { ...state, appliedFixes: new Set([...state.appliedFixes, action.issueId]) };
    case 'UNDO_FIX': {
      const next = new Set(state.appliedFixes);
      next.delete(action.issueId);
      return { ...state, appliedFixes: next };
    }
    case 'SET_SEVERITY_FILTER':
      return { ...state, severityFilter: action.severity };
    case 'MERGE_LLM_FIXES': {
      if (!state.scanResult) return state;
      const issueMap = new Map(action.issues.map((i) => [i.id, i]));
      const mergedIssues = state.scanResult.issues.map((i) => issueMap.get(i.id) ?? i);
      const mergedFixes = { ...state.fixes };
      for (const issue of action.issues) {
        if (issue.fix) mergedFixes[issue.id] = issue.fix;
      }
      return { ...state, scanResult: { ...state.scanResult, issues: mergedIssues }, fixes: mergedFixes };
    }
    default:
      return state;
  }
}

const initialState: PanelState = {
  scanning: false,
  scanResult: null,
  fixes: {},
  selectedIssue: null,
  appliedFixes: new Set(),
  severityFilter: 'all',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeScore(result: ScanResult, appliedFixes: Set<string>): number {
  if (result.violations === 0) return 100;
  const remaining = Math.max(0, result.violations - appliedFixes.size);
  return Math.round(((result.violations - remaining) / result.violations) * 100);
}

function sendToActiveTab(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { resolve({ ok: false }); return; }
      chrome.tabs.sendMessage(tabId, { type, payload }, resolve);
    });
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Panel() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeTab, setActiveTab] = useState<'issues' | 'history' | 'settings'>('issues');
  const [focusOrderActive, setFocusOrderActive] = useState(false);
  const [focusOrderCount, setFocusOrderCount] = useState<number | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>({ enabled: false, baseUrl: 'http://localhost:11434', model: 'llama3.2' });

  useEffect(() => {
    chrome.storage.local.get('trya11y_ollama_config', (stored) => {
      if (stored.trya11y_ollama_config) setOllamaConfig(stored.trya11y_ollama_config as OllamaConfig);
    });
  }, []);

  useEffect(() => {
    const listener = (message: { type: string; payload?: A11yIssue[] }) => {
      if (message.type === 'LLM_ENHANCE_RESULT' && message.payload) {
        dispatch({ type: 'MERGE_LLM_FIXES', issues: message.payload });
        setEnhancing(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleScan = useCallback(() => {
    dispatch({ type: 'SCAN_START' });
    setEnhancing(false);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE' }, (response) => {
        if (response?.type === 'SCAN_RESULT') {
          dispatch({ type: 'SCAN_COMPLETE', result: response.result, fixes: response.fixes ?? {} });
          setEnhancing(true);
          chrome.runtime.sendMessage({
            type: 'SAVE_SCAN_HISTORY',
            payload: {
              url: response.result.url,
              timestamp: response.result.timestamp,
              violations: response.result.violations,
            },
          });
        }
      });
    });
  }, []);

  const handleApplyFix = useCallback((issue: A11yIssue) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'APPLY_FIX', issueId: issue.id, selector: issue.element.selector }, (response) => {
        if (response?.success) dispatch({ type: 'APPLY_FIX', issueId: issue.id });
      });
    });
  }, []);

  const handleUndoFix = useCallback((issue: A11yIssue) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'UNDO_FIX', issueId: issue.id }, () => {
        dispatch({ type: 'UNDO_FIX', issueId: issue.id });
      });
    });
  }, []);

  const handleApplyAllHighConfidence = useCallback(() => {
    if (!state.scanResult) return;
    state.scanResult.issues
      .filter((i) => state.fixes[i.id]?.confidence === 'high' && !state.appliedFixes.has(i.id))
      .forEach((issue) => handleApplyFix(issue));
  }, [state.scanResult, state.fixes, state.appliedFixes, handleApplyFix]);

  const handleToggleFocusOrder = useCallback(async () => {
    if (focusOrderActive) {
      await sendToActiveTab('HIDE_FOCUS_ORDER');
      setFocusOrderActive(false);
      setFocusOrderCount(null);
    } else {
      const response = await sendToActiveTab('SHOW_FOCUS_ORDER') as { ok: boolean; count?: number };
      if (response?.ok) {
        setFocusOrderActive(true);
        setFocusOrderCount(response.count ?? null);
      }
    }
  }, [focusOrderActive]);

  const filteredIssues = state.scanResult?.issues.filter(
    (i) => state.severityFilter === 'all' || i.impact === state.severityFilter
  ) ?? [];

  const severityCounts = state.scanResult?.issues.reduce((acc, i) => {
    acc[i.impact] = (acc[i.impact] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  const fixableCount = Object.keys(state.fixes).length;
  const highConfidenceRemaining = state.scanResult
    ? state.scanResult.issues.filter(
        (i) => state.fixes[i.id]?.confidence === 'high' && !state.appliedFixes.has(i.id)
      ).length
    : 0;
  const score = state.scanResult ? computeScore(state.scanResult, state.appliedFixes) : null;
  const scoreColor = score === null ? '#9ca3af' : score >= 80 ? '#27ae60' : score >= 50 ? '#e67e22' : '#e74c3c';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>TryA11y</span>
          <ScanButton scanning={state.scanning} onScan={handleScan} />
          <button
            onClick={handleToggleFocusOrder}
            style={{ ...styles.toolBtn, ...(focusOrderActive ? styles.toolBtnActive : {}) }}
            title={focusOrderActive ? 'Hide focus order overlays' : 'Visualize keyboard tab order'}
          >
            {focusOrderActive ? `Focus Order (${focusOrderCount ?? '…'})` : 'Focus Order'}
          </button>
        </div>

        {activeTab === 'issues' && (
          <div style={styles.filterTabs}>
            {(['all', 'critical', 'serious', 'moderate', 'minor'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => dispatch({ type: 'SET_SEVERITY_FILTER', severity: sev })}
                style={{ ...styles.filterTab, ...(state.severityFilter === sev ? styles.filterTabActive : {}) }}
              >
                {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                {sev !== 'all' && severityCounts[sev] ? ` (${severityCounts[sev]})` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'issues' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('issues')}
        >
          Issues{state.scanResult ? ` (${state.scanResult.violations})` : ''}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'history' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'settings' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('settings')}
        >
          ⚙ AI Settings
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div style={{ padding: '24px', maxWidth: '480px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e0e0e0', marginBottom: '6px' }}>Ollama — Local AI</h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px', lineHeight: '1.6' }}>
            Connect to a local Ollama instance to get plain-English explanations for each accessibility issue.
            Start Ollama with: <code style={{ background: '#2a2a4a', padding: '1px 6px', borderRadius: '4px' }}>OLLAMA_ORIGINS="*" ollama serve</code>
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ollamaConfig.enabled}
              onChange={(e) => setOllamaConfig((c) => ({ ...c, enabled: e.target.checked }))}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: 600 }}>Enable AI explanations</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: ollamaConfig.enabled ? 1 : 0.4, pointerEvents: ollamaConfig.enabled ? 'auto' : 'none' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>Base URL</div>
              <input
                type="text"
                value={ollamaConfig.baseUrl}
                onChange={(e) => setOllamaConfig((c) => ({ ...c, baseUrl: e.target.value }))}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #2a2a4a', background: '#16162a', color: '#e0e0e0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>Model</div>
              <input
                type="text"
                value={ollamaConfig.model}
                onChange={(e) => setOllamaConfig((c) => ({ ...c, model: e.target.value }))}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #2a2a4a', background: '#16162a', color: '#e0e0e0', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              chrome.storage.local.set({ trya11y_ollama_config: ollamaConfig });
              chrome.runtime.sendMessage({ type: 'SET_OLLAMA_CONFIG', config: ollamaConfig });
              setActiveTab('issues');
            }}
            style={{ marginTop: '20px', padding: '8px 20px', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Save &amp; Close
          </button>
        </div>
      ) : activeTab === 'history' ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <HistoryPanel key={activeTab} />
        </div>
      ) : (
        <div style={styles.body}>
          <div style={styles.issueList}>
            {!state.scanResult && !state.scanning && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>{'<>'}</div>
                <p style={styles.emptyTitle}>No scan results yet</p>
                <p style={styles.emptyText}>Click "Scan" to analyze this page for accessibility issues.</p>
              </div>
            )}
            {state.scanning && (
              <div style={styles.emptyState}>
                <div style={styles.spinner} />
                <p style={styles.emptyTitle}>Scanning page…</p>
              </div>
            )}
            {enhancing && !state.scanning && (
              <div style={{ ...styles.emptyState, padding: '12px 24px', flexDirection: 'row', gap: '10px', justifyContent: 'center' }}>
                <div style={{ ...styles.spinner, width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#a78bfa', marginBottom: 0 }} />
                <span style={{ color: '#a78bfa', fontSize: '12px' }}>AI enhancing fixes…</span>
              </div>
            )}
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                selected={state.selectedIssue?.id === issue.id}
                appliedFixes={state.appliedFixes}
                onSelect={() => dispatch({ type: 'SELECT_ISSUE', issue })}
                onApplyFix={() => handleApplyFix(issue)}
                onUndoFix={() => handleUndoFix(issue)}
                onHighlight={() => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                      const tabId = tabs[0]?.id;
                      if (!tabId) return;
                      chrome.tabs.sendMessage(tabId, { type: 'HIGHLIGHT_ELEMENT', selector: issue.element.selector, severity: issue.impact });
                    });
                  }}
              />
            ))}
          </div>

          <div style={styles.detailPanel}>
            {state.selectedIssue ? (
              <IssueDetail
                issue={state.selectedIssue}
                fix={state.fixes[state.selectedIssue.id]}
                isApplied={state.appliedFixes.has(state.selectedIssue.id)}
                ollamaConfig={ollamaConfig}
                onApply={() => handleApplyFix(state.selectedIssue!)}
                onUndo={() => handleUndoFix(state.selectedIssue!)}
                onCopyFix={() => {
                  const fix = state.fixes[state.selectedIssue!.id];
                  if (fix) navigator.clipboard.writeText(fix.newHtml);
                }}
              />
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Select an issue to view details and fix suggestions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={styles.bottomBar}>
        <div style={styles.stats}>
          {state.scanResult && (
            <>
              <span style={{ color: scoreColor, fontWeight: 600 }}>
                {state.appliedFixes.size}/{state.scanResult.violations} fixed
              </span>
              <span style={styles.statDivider}>|</span>
              <span>{fixableCount} auto-fixable</span>
              <span style={styles.statDivider}>|</span>
              <span>{state.scanResult.scanDurationMs}ms</span>
            </>
          )}
        </div>
        <div style={styles.actions}>
          {highConfidenceRemaining > 0 && (
            <button
              onClick={handleApplyAllHighConfidence}
              style={styles.applyAllBtn}
              title={`Apply ${highConfidenceRemaining} high-confidence fixes at once`}
            >
              Fix All High ({highConfidenceRemaining})
            </button>
          )}
          {state.scanResult && (
            <ReportExporter
              result={state.scanResult}
              fixes={new Map(Object.entries(state.fixes))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px', color: '#e0e0e0', background: '#1a1a2e',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', borderBottom: '1px solid #2a2a4a', background: '#16162a',
    flexWrap: 'wrap', gap: '8px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  logo: { fontWeight: 700, fontSize: '16px', color: '#818cf8' },
  toolBtn: {
    padding: '4px 10px', border: '1px solid #2a2a4a', borderRadius: '4px',
    background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '12px',
  },
  toolBtnActive: { background: '#312e81', color: '#a5b4fc', borderColor: '#4f46e5' },
  filterTabs: { display: 'flex', gap: '4px' },
  filterTab: {
    padding: '4px 10px', border: '1px solid #2a2a4a', borderRadius: '4px',
    background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '12px',
  },
  filterTabActive: { background: '#6366f1', color: '#fff', borderColor: '#6366f1' },
  tabBar: { display: 'flex', borderBottom: '1px solid #2a2a4a', background: '#16162a' },
  tab: {
    padding: '6px 16px', border: 'none', borderBottom: '2px solid transparent',
    background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
  },
  tabActive: { color: '#818cf8', borderBottomColor: '#6366f1' },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  issueList: {
    width: '380px', minWidth: '300px', borderRight: '1px solid #2a2a4a',
    overflowY: 'auto' as const, background: '#1a1a2e',
  },
  detailPanel: { flex: 1, overflowY: 'auto' as const, background: '#fff', color: '#1e293b' },
  bottomBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', borderTop: '1px solid #2a2a4a', background: '#16162a',
  },
  stats: { display: 'flex', gap: '4px', color: '#9ca3af', fontSize: '12px', alignItems: 'center' },
  statDivider: { color: '#4a4a6a' },
  actions: { display: 'flex', gap: '8px', alignItems: 'center' },
  emptyState: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    justifyContent: 'center', padding: '48px 24px', textAlign: 'center' as const,
  },
  emptyIcon: { fontSize: '32px', color: '#4a4a6a', marginBottom: '12px' },
  emptyTitle: { fontWeight: 600, marginBottom: '4px' },
  emptyText: { color: '#9ca3af', fontSize: '12px' },
  spinner: {
    width: '24px', height: '24px', border: '3px solid #2a2a4a',
    borderTop: '3px solid #6366f1', borderRadius: '50%',
    animation: 'spin 1s linear infinite', marginBottom: '12px',
  },
  applyAllBtn: {
    padding: '4px 12px', border: 'none', borderRadius: '4px',
    background: '#27ae60', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
};
