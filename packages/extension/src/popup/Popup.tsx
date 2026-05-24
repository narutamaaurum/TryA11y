import React, { useState, useEffect, useCallback } from 'react';

type ReportFormat = 'html' | 'json' | 'markdown';

interface ScanSummary {
  violations: number;
  passes: number;
  fixesAvailable: number;
  timestamp: number;
}

interface ScanResult {
  violations: number;
  passes: number;
  issues: Array<{ fix?: unknown }>;
}

export function Popup() {
  const [scanning, setScanning] = useState(false);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.local.get('lastScanSummary', (stored) => {
      if (stored.lastScanSummary) setSummary(stored.lastScanSummary as ScanSummary);
    });
  }, []);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setScanError(null);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) { setScanning(false); return; }

    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/index.js'] });
    } catch {
      // Already injected — safe to ignore
    }

    chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE' }, (response) => {
      setScanning(false);
      if (chrome.runtime.lastError) {
        setScanError('Could not connect to page. Try reloading the tab.');
        return;
      }
      if (response?.type === 'SCAN_RESULT') {
        const result = response.result as ScanResult;
        const s: ScanSummary = {
          violations: result.violations,
          passes: result.passes,
          fixesAvailable: result.issues.filter((i) => i.fix).length,
          timestamp: Date.now(),
        };
        setSummary(s);
        chrome.storage.local.set({ lastScanSummary: s });
      }
    });
  }, []);

  const handleExport = useCallback((format: ReportFormat) => {
    setExporting(format);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) { setExporting(null); return; }
      chrome.tabs.sendMessage(tabId, { type: 'EXPORT_REPORT', format }, () => {
        setExporting(null);
      });
    });
  }, []);

  const openDevTools = useCallback(() => {
    chrome.tabs.create({ url: 'chrome://inspect/#other' });
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <defs><linearGradient id="logo" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
            <rect width="36" height="36" rx="9" fill="url(#logo)"/>
            <line x1="5" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="31" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="13" y1="19" x2="13" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="23" y1="19" x2="23" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="18" cy="6" r="1.6" fill="white" opacity="0.6"/>
          </svg>
          <span style={styles.logo}>TryA11y</span>
        </div>
        <span style={styles.version}>v1.0.0</span>
      </div>

      {/* Scan button */}
      <div style={{ padding: '14px 16px 0' }}>
        <button
          onClick={handleScan}
          disabled={scanning}
          style={{ ...styles.scanBtn, ...(scanning ? styles.scanBtnDisabled : {}) }}
        >
          {scanning ? '⟳ Scanning…' : '⚙ Scan This Page'}
        </button>
      </div>

      {/* Error */}
      {scanError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: '#dc2626', lineHeight: '1.4' }}>
          {scanError}
        </div>
      )}

      {/* Results summary */}
      {summary && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            <span>{summary.violations} issues found</span>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>{summary.fixesAvailable} auto-fixable</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Violations', value: summary.violations, color: '#dc2626' },
              { label: 'Passes', value: summary.passes, color: '#16a34a' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '4px', background: '#f8fafc', fontSize: '12px' }}>
                <span style={{ color: '#475569' }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
            Last scan: {formatTime(summary.timestamp)}
          </div>
        </div>
      )}

      {/* Export */}
      {summary && (
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Export report:</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['html', 'json', 'markdown'] as ReportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={!!exporting}
                style={{ ...styles.exportBtn, ...(exporting === fmt ? styles.exportBtnActive : {}) }}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      <div style={{ padding: '10px 16px 14px', fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
        Open <strong>DevTools &rarr; TryA11y</strong> panel for full fix workflow.
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: '280px', padding: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: '13px', color: '#1e293b', background: '#fff' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  logo: { fontWeight: 700, fontSize: '18px', color: '#1a1a2e' },
  version: { fontSize: '11px', color: '#94a3b8' },
  scanBtn: {
    width: '100%', padding: '10px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  scanBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  exportBtn: {
    flex: 1, padding: '4px 0', borderRadius: '4px', background: '#f1f5f9',
    color: '#475569', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
  },
  exportBtnActive: { background: '#6366f1', color: '#fff', borderColor: '#6366f1' },
  footer: { borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'center' },
  link: { fontSize: '11px', color: '#6366f1', fontWeight: 600, textDecoration: 'none' },
};
