import React from "react";

export default function Logo({ size = 34 }: { size?: number }): React.ReactElement {
  const id = "logo-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Rounded background */}
      <rect width="36" height="36" rx="9" fill={`url(#${id})`} />

      {/* Left leg of A */}
      <line x1="5" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      {/* Right leg of A */}
      <line x1="31" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round" />

      {/* "11" as crossbar — two small vertical ticks instead of a horizontal bar */}
      {/* Left tick */}
      <line x1="13" y1="19" x2="13" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right tick */}
      <line x1="23" y1="19" x2="23" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

      {/* Small dot at apex — the "." suggesting scanning/focus */}
      <circle cx="18" cy="6" r="1.6" fill="white" opacity="0.6" />
    </svg>
  );
}
