import React from 'react';

const COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#dc2626', text: '#fff' },
  serious:  { bg: '#ea580c', text: '#fff' },
  moderate: { bg: '#d97706', text: '#fff' },
  minor:    { bg: '#2563eb', text: '#fff' },
};

interface SeverityBadgeProps {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export function SeverityBadge({ severity }: SeverityBadgeProps): React.ReactElement {
  const { bg, text } = COLORS[severity] ?? COLORS.moderate;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 9999,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: bg,
      color: text,
      flexShrink: 0,
    }}>
      {severity}
    </span>
  );
}
