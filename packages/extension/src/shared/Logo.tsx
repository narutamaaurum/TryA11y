import React from 'react';

export function Logo({ size = 22 }: { size?: number }): React.ReactElement {
  const id = `lg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill={`url(#${id})`} />
      <line x1="5" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="31" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="13" y1="19" x2="13" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="23" y1="19" x2="23" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="6" r="1.6" fill="white" opacity="0.6" />
    </svg>
  );
}
