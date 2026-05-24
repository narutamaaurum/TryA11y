import React, { useState } from 'react';
import type { A11yIssue, FixSuggestion } from '@trya11y/core';
import { SeverityBadge } from './SeverityBadge';

interface IssueCardProps {
  issue: A11yIssue;
  selected: boolean;
  appliedFixes: Set<string>;
  onSelect: (issue: A11yIssue) => void;
  onApplyFix: (issue: A11yIssue) => void;
  onUndoFix: (issue: A11yIssue) => void;
  onHighlight: (issue: A11yIssue) => void;
  fix?: FixSuggestion;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  selected,
  appliedFixes,
  onSelect,
  onApplyFix,
  onUndoFix,
  onHighlight,
}) => {
  const isApplied = appliedFixes.has(issue.id);
  const [highlightStatus, setHighlightStatus] = useState<'idle' | 'done'>('idle');

  const handleHighlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(issue);
    setHighlightStatus('done');
    setTimeout(() => setHighlightStatus('idle'), 2500);
  };

  const cardStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid #2a2a4a',
    cursor: 'pointer',
    background: selected ? '#1e1e4a' : isApplied ? '#0d1f14' : 'transparent',
    borderLeft: selected ? '3px solid #6366f1' : isApplied ? '3px solid #27ae60' : '3px solid transparent',
    transition: 'background-color 0.15s',
  };

  const topRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  };

  const ruleNameStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: selected ? '#c7d2fe' : '#9ca3af',
    flexShrink: 0,
  };

  const descStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1.4',
    marginBottom: '4px',
  };

  const highlightBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    padding: '2px 6px',
    border: '1px solid #2a2a4a',
    borderRadius: '4px',
    background: highlightStatus === 'done' ? '#312e81' : 'transparent',
    color: highlightStatus === 'done' ? '#a5b4fc' : '#aaaacc',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12,
  };

  const truncateHtml = (html: string, max = 80): string => {
    return html.length > max ? html.slice(0, max) + '...' : html;
  };

  return (
    <div
      style={cardStyle}
      role="button"
      tabIndex={0}
      aria-label={`Issue: ${issue.ruleId} - ${issue.description}`}
      onClick={() => onSelect(issue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(issue);
        }
      }}
      onMouseEnter={() => {}}
    >
      <div style={topRowStyle}>
        <SeverityBadge severity={issue.impact} />
        <span style={ruleNameStyle}>{issue.ruleId}</span>
        {isApplied && (
          <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#27ae60' }} title="Fix applied">✓</span>
        )}
      </div>

      <div style={descStyle}>{issue.description}</div>

      {/* WCAG tag + element preview + highlight button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        {issue.wcagTags[0] && (
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#818cf8', backgroundColor: '#1e1e3a', padding: '1px 5px', borderRadius: '3px' }}>
            {issue.wcagTags[0]}
          </span>
        )}
        <span style={{ fontSize: '10px', color: '#4a4a6a', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {truncateHtml(issue.element.html)}
        </span>
        <button
          onClick={handleHighlight}
          title="Highlight element on page"
          style={highlightBtnStyle}
        >
          🎯
        </button>
      </div>

      {/* Fix/undo buttons */}
      {!isApplied ? (
        <button
          onClick={(e) => { e.stopPropagation(); onApplyFix(issue); }}
          style={{ marginTop: '6px', padding: '3px 8px', borderRadius: '4px', background: '#6366f1', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
        >
          Apply Fix
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onUndoFix(issue); }}
          style={{ marginTop: '6px', padding: '3px 8px', borderRadius: '4px', background: '#ea580c', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
        >
          Undo Fix
        </button>
      )}
    </div>
  );
};
