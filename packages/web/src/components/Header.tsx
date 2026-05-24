import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";

interface NavItem { to: string; label: string; }

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home" },
];

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );
}

export default function Header(): React.ReactElement {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2rem",
      height: 64,
      background: "var(--header-bg)",
      borderBottom: "1px solid var(--header-border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} aria-label="TryA11y Home">
        <Logo size={34} />
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
          TryA11y
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 2 }} aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                textDecoration: "none",
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                background: isActive ? "var(--primary-light)" : "transparent",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--primary)";
          e.currentTarget.style.borderColor = "var(--primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
}
