import React, { useState, useEffect } from 'react';
import type { A11yIssue, FixSuggestion, OllamaConfig } from '@trya11y/core';
import { SeverityBadge } from './SeverityBadge';

interface IssueDetailProps {
  issue: A11yIssue;
  fix?: FixSuggestion;
  isApplied: boolean;
  ollamaConfig?: OllamaConfig;
  onApply: () => void;
  onUndo: () => void;
  onCopyFix: () => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  fix,
  isApplied,
  ollamaConfig,
  onApply,
  onUndo,
  onCopyFix,
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    setExplanation(null);
    setExplaining(false);
  }, [issue.id]);

  const sectionStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#94a3b8',
    marginBottom: '8px',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: '4px',
    background: '#f1f5f9',
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    marginRight: '6px',
    fontFamily: 'monospace',
  };

  const codeBlockStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '8px 10px',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: '#1e293b',
    margin: 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ ...sectionStyle, background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <SeverityBadge severity={issue.impact} />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>{issue.ruleId}</span>
          {issue.wcagTags.slice(0, 2).map((tag: string) => (
            <span key={tag} style={{ fontSize: '10px', fontWeight: 600, color: '#6366f1', backgroundColor: '#eef2ff', padding: '1px 5px', borderRadius: '3px' }}>
              {tag}
            </span>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '4px', lineHeight: '1.5' }}>{issue.description}</p>
        <a
          href={issue.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#6366f1' }}
        >
          View documentation ↗
        </a>
      </div>

      {/* Affected element */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Affected Element</div>
        <div style={{ marginBottom: '4px' }}>
          <span style={tagStyle}>&lt;{issue.element.tagName}&gt;</span>
          <code style={{ fontSize: '12px', color: '#888' }}>{issue.element.selector}</code>
        </div>
        <pre style={codeBlockStyle}>{issue.element.html}</pre>
      </div>

      {/* Fix suggestion */}
      {fix ? (
        <div style={sectionStyle}>
          <div style={headingStyle}>Suggested Fix</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
              background: fix.confidence === 'high' ? '#dcfce7' : fix.confidence === 'medium' ? '#fef9c3' : '#fee2e2',
              color: fix.confidence === 'high' ? '#166534' : fix.confidence === 'medium' ? '#854d0e' : '#991b1b',
            }}>
              {fix.confidence} confidence
            </span>
            {fix.source === 'llm' && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', borderRadius: '4px' }}>
                ✦ AI enhanced
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', lineHeight: '1.5' }}>{fix.description}</p>
          {fix.reasoning && (
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontStyle: 'italic' }}>{fix.reasoning}</p>
          )}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Before:</div>
            <pre style={{ ...codeBlockStyle, borderLeft: '3px solid #fca5a5', color: '#dc2626' }}>{fix.oldHtml}</pre>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>After:</div>
            <pre style={{ ...codeBlockStyle, borderLeft: '3px solid #86efac', color: '#16a34a' }}>{fix.newHtml}</pre>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isApplied ? (
              <button
                onClick={onApply}
                style={{ padding: '6px 14px', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Apply Fix
              </button>
            ) : (
              <button
                onClick={onUndo}
                style={{ padding: '6px 14px', borderRadius: '6px', background: '#ea580c', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Undo Fix
              </button>
            )}
            <button
              onClick={onCopyFix}
              style={{ padding: '6px 14px', borderRadius: '6px', background: 'transparent', color: '#6366f1', border: '1px solid #6366f1', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Copy HTML
            </button>
          </div>
        </div>
      ) : (
        <div style={sectionStyle}>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>No automatic fix available for this issue.</p>
        </div>
      )}

      {/* AI explanation */}
      {ollamaConfig?.enabled && (
        <div style={sectionStyle}>
          <div style={headingStyle}>AI Explanation</div>
          <button
            onClick={async () => {
              if (explanation) { setExplanation(null); return; }
              setExplaining(true);
              const config = ollamaConfig;
              const port = chrome.runtime.connect({ name: 'explain-issue' });
              port.postMessage({ issue, fix, config: { ...config, enabled: true } });
              port.onMessage.addListener((resp: { ok: boolean; explanation?: string }) => {
                setExplanation(resp?.explanation ?? 'Could not generate explanation. Make sure Ollama is running and the model is available.');
                setExplaining(false);
                port.disconnect();
              });
              port.onDisconnect.addListener(() => {
                setExplaining(false);
              });
            }}
            style={{
              padding: '6px 14px', borderRadius: '6px', background: explaining ? '#ede9fe' : '#f5f3ff',
              color: '#7c3aed', border: '1px solid #c4b5fd', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {explaining ? '⟳ Explaining…' : explanation ? 'Hide Explanation' : '✦ Explain with AI'}
          </button>
          {explanation && (
            <div style={{
              marginTop: '10px', padding: '10px 12px', background: '#faf5ff',
              borderRadius: '6px', border: '1px solid #e9d5ff',
              fontSize: '13px', color: '#4c1d95', lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
            }}>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
