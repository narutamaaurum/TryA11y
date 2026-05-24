import React from "react";

export default function Footer(): React.ReactElement {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", padding: "2.5rem 2rem", marginTop: "auto" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "1.5rem" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>TryA11y</span>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 280 }}>
            Accessibility auditing that finds, fixes, and explains — entirely offline.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 13, color: "var(--text-muted)" }}>
        <span>Made with ♥ by{" "}
          <a href="https://github.com/priyasahay" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Priya</a>
        </span>
      </div>
    </footer>
  );
}
