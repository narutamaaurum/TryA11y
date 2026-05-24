import React from 'react';

interface ScanButtonProps {
  onScan: () => void;
  scanning: boolean;
  disabled?: boolean;
}

export function ScanButton({ onScan, scanning, disabled }: ScanButtonProps): React.ReactElement {
  return (
    <button
      onClick={onScan}
      disabled={scanning || disabled}
      style={{
        width: '100%',
        padding: '10px 16px',
        borderRadius: 8,
        border: 'none',
        background: scanning || disabled
          ? 'rgba(99,102,241,0.4)'
          : 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: scanning || disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'opacity 0.15s',
      }}
    >
      {scanning ? (
        <>
          <span style={{
            width: 12, height: 12,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'trya11y-spin 0.8s linear infinite',
          }} />
          Scanning…
        </>
      ) : '⚙ Scan Page'}
      <style>{`@keyframes trya11y-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
