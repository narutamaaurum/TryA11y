import React, { useEffect, useState } from 'react';

interface HistoryEntry {
  url: string;
  timestamp: number;
  violations: number;
  passes?: number;
  incomplete?: number;
  fixes?: number;
  durationMs?: number;
}

const IMPACT_COLORS: Record<string, string> = {
  good: '#4ade80',
  bad: '#f87171',
  neutral: '#94a3b8',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

export function HistoryPanel(): React.ReactElement {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    chrome.storage.local.get('trya11y_history', (result) => {
      const entries = result['trya11y_history'] as HistoryEntry[] | undefined;
      if (Array.isArray(entries)) {
        // Entries are stored newest-first (unshift); show up to 50
        setHistory(entries.slice(0, 50));
      }
    });
  }, []);

  if (history.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🕐</div>
        <p style={styles.emptyTitle}>No scan history yet</p>
        <p style={styles.emptyText}>Run a scan to start tracking results over time.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>{history.length} scan{history.length !== 1 ? 's' : ''}</span>
        <span style={styles.headerSub}>most recent first</span>
      </div>

      {history.map((entry, i) => {
        const prev = history[i + 1];
        const delta = prev != null ? entry.violations - prev.violations : null;
        const trend = delta === null ? null : delta < 0 ? 'improved' : delta > 0 ? 'regressed' : 'unchanged';
        const trendIcon = trend === 'improved' ? '↓' : trend === 'regressed' ? '↑' : trend === 'unchanged' ? '→' : null;
        const trendColor = trend === 'improved' ? IMPACT_COLORS.good : trend === 'regressed' ? IMPACT_COLORS.bad : IMPACT_COLORS.neutral;
        const isOpen = expanded === i;
        const scoreColor = entry.violations === 0 ? IMPACT_COLORS.good : entry.violations <= 3 ? '#facc15' : IMPACT_COLORS.bad;

        return (
          <div
            key={entry.timestamp}
            style={{ ...styles.card, ...(isOpen ? styles.cardOpen : {}) }}
          >
            {/* Summary row — always visible */}
            <button
              style={styles.cardHeader}
              onClick={() => setExpanded(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div style={styles.cardLeft}>
                <span style={{ ...styles.violationCount, color: scoreColor }}>
                  {entry.violations}
                </span>
                <div style={styles.cardMeta}>
                  <span style={styles.urlText} title={entry.url}>
                    {stripScheme(entry.url)}
                  </span>
                  <span style={styles.dateText}>{formatDate(entry.timestamp)}</span>
                </div>
              </div>
              <div style={styles.cardRight}>
                {trendIcon && (
                  <span style={{ ...styles.trendBadge, color: trendColor }}>
                    {trendIcon} {Math.abs(delta!)}
                  </span>
                )}
                <span style={{ ...styles.chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
                  ›
                </span>
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div style={styles.cardBody}>
                <div style={styles.statsGrid}>
                  <StatCell label="Violations" value={entry.violations} color={scoreColor} />
                  <StatCell label="Passing" value={entry.passes ?? '—'} color={IMPACT_COLORS.good} />
                  <StatCell label="Needs Review" value={entry.incomplete ?? '—'} color='#facc15' />
                  <StatCell label="Auto-fixes" value={entry.fixes ?? '—'} color='#818cf8' />
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Scan duration</span>
                  <span style={styles.detailValue}>{formatDuration(entry.durationMs)}</span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Full URL</span>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.urlLink}
                    title={entry.url}
                  >
                    {entry.url.length > 60 ? entry.url.slice(0, 60) + '…' : entry.url}
                  </a>
                </div>

                {delta !== null && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>vs previous scan</span>
                    <span style={{ color: trendColor, fontWeight: 600, fontSize: 12 }}>
                      {delta === 0
                        ? 'No change'
                        : `${delta > 0 ? '+' : ''}${delta} violation${Math.abs(delta) !== 1 ? 's' : ''} (${trend})`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={styles.statCell}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 0',
    overflowY: 'auto',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 16px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerTitle: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  headerSub: { fontSize: 11, color: '#64748b' },

  card: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    transition: 'background 0.1s',
  },
  cardOpen: {
    background: 'rgba(99,102,241,0.06)',
  },
  cardHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    gap: 10,
    textAlign: 'left',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  violationCount: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
    flexShrink: 0,
    minWidth: 32,
    textAlign: 'right',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  urlText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dateText: { fontSize: 11, color: '#64748b' },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  trendBadge: {
    fontSize: 12,
    fontWeight: 700,
  },
  chevron: {
    fontSize: 18,
    color: '#64748b',
    transition: 'transform 0.15s',
    lineHeight: 1,
  },

  cardBody: {
    padding: '0 16px 14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 12,
  },
  statCell: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 16, fontWeight: 700 },
  statLabel: { fontSize: 10, color: '#64748b', textAlign: 'center' },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    padding: '4px 0',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  detailLabel: { fontSize: 11, color: '#64748b', flexShrink: 0 },
  detailValue: { fontSize: 12, color: '#94a3b8' },
  urlLink: {
    fontSize: 11,
    color: '#818cf8',
    textDecoration: 'none',
    wordBreak: 'break-all',
    textAlign: 'right',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { fontWeight: 600, color: '#e2e8f0', marginBottom: 4, fontSize: 14 },
  emptyText: { color: '#64748b', fontSize: 12, lineHeight: 1.5 },
};
