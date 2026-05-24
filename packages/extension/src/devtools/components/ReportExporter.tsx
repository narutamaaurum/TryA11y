import React, { useState } from 'react';
import type { A11yIssue, ScanResult, FixSuggestion } from '@trya11y/core';

interface ReportExporterProps {
  result: ScanResult;
  fixes: Map<string, FixSuggestion>;
}

function resultWithFixes(result: ScanResult, fixes: Map<string, FixSuggestion>): ScanResult {
  return {
    ...result,
    issues: result.issues.map((issue: A11yIssue) => ({
      ...issue,
      fix: fixes.get(issue.id),
    })),
  };
}

export function ReportExporter({ result, fixes }: ReportExporterProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  async function exportAs(format: 'html' | 'json' | 'markdown') {
    setExporting(format);
    setOpen(false);
    const r = resultWithFixes(result, fixes);
    chrome.runtime.sendMessage(
      { type: 'EXPORT_REPORT', payload: { result: r, format } },
      () => setExporting(null),
    );
  }

  const btnStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '8px 14px',
    background: 'transparent', border: 'none', textAlign: 'left',
    fontSize: 13, color: '#e2e8f0', cursor: 'pointer',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!exporting}
        style={{
          padding: '6px 12px', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent', color: exporting ? '#6366f1' : '#94a3b8',
          fontSize: 12, cursor: exporting ? 'default' : 'pointer',
        }}
      >
        {exporting ? `Exporting ${exporting}…` : 'Export ▾'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 10,
          background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, minWidth: 140, overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {(['html', 'json', 'markdown'] as const).map((fmt) => (
            <button
              key={fmt}
              style={btnStyle}
              onClick={() => exportAs(fmt)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {fmt.toUpperCase()} report
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
