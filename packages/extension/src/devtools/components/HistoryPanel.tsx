import React, { useEffect, useState } from 'react';

interface HistoryEntry {
  url: string;
  timestamp: number;
  violations: number;
}

export function HistoryPanel(): React.ReactElement {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    chrome.storage.local.get('trya11y_history', (result) => {
      const entries = result['trya11y_history'] as HistoryEntry[] | undefined;
      if (Array.isArray(entries)) {
        setHistory(entries.slice(-20).reverse());
      }
    });
  }, []);

  if (history.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        No scan history yet. Run a scan to start tracking.
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {history.map((entry, i) => {
        const prev = history[i + 1];
        const delta = prev ? entry.violations - prev.violations : 0;
        const trend = delta < 0 ? '↓' : delta > 0 ? '↑' : '→';
        const trendColor = delta < 0 ? '#22c55e' : delta > 0 ? '#ef4444' : '#94a3b8';
        const date = new Date(entry.timestamp).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

        return (
          <div key={entry.timestamp} style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18, color: trendColor, flexShrink: 0 }}>{trend}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: '#e2e8f0', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={entry.url}>
                {entry.url.replace(/^https?:\/\//, '')}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{date}</div>
            </div>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: entry.violations > 0 ? '#f87171' : '#4ade80',
              flexShrink: 0,
            }}>
              {entry.violations}
            </span>
          </div>
        );
      })}
    </div>
  );
}
