import React, { useState } from "react";

/* ---------- mock data for UI previews ---------- */
const MOCK_ISSUES = [
  { id: "image-alt", rule: "image-alt", desc: "Image missing alt text", impact: "critical", selector: "img.hero-photo", fixed: false },
  { id: "heading-order", rule: "heading-order", desc: "Heading levels skipped (h1 → h3)", impact: "serious", selector: "h3.section-title", fixed: false },
  { id: "label", rule: "label", desc: "Form input has no label", impact: "critical", selector: "input#email", fixed: false },
];

const IMPACT_COLOR: Record<string, string> = {
  critical: "#dc2626", serious: "#ea580c", moderate: "#d97706", minor: "#65a30d",
};

function PopupMockup(): React.ReactElement {
  return (
    <div style={{ width: 280, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1px solid #e2e8f0", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      {/* header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <defs><linearGradient id="pm" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
            <rect width="36" height="36" rx="9" fill="url(#pm)"/>
            <line x1="5" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="31" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="13" y1="19" x2="13" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="23" y1="19" x2="23" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="18" cy="6" r="1.6" fill="white" opacity="0.6"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>TryA11y</span>
        </div>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>v1.0.0</span>
      </div>
      {/* scan button */}
      <div style={{ padding: "14px" }}>
        <button style={{ width: "100%", padding: "10px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          ⚙ Scan This Page
        </button>
      </div>
      {/* results */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 8 }}>
          <span>3 issues found</span><span style={{ color: "#6366f1", fontWeight: 600 }}>2 auto-fixable</span>
        </div>
        {[{ label: "Critical", count: 2, color: "#dc2626" }, { label: "Serious", count: 1, color: "#ea580c" }].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
            <span style={{ color: "#475569" }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px", background: "#f8fafc", fontSize: 12, color: "#64748b", textAlign: "center" }}>
        Open <strong>DevTools → TryA11y</strong> for full workflow
      </div>
    </div>
  );
}

function PanelMockup(): React.ReactElement {
  const [selected, setSelected] = useState(MOCK_ISSUES[0]);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", border: "1px solid #2a2a4a", background: "#12122a", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      {/* panel header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #2a2a4a", display: "flex", alignItems: "center", gap: 10, background: "#1a1a3e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="20" height="20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <defs><linearGradient id="pp" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
            <rect width="36" height="36" rx="9" fill="url(#pp)"/>
            <line x1="5" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="31" y1="29" x2="18" y2="6" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="13" y1="19" x2="13" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="23" y1="19" x2="23" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="18" cy="6" r="1.6" fill="white" opacity="0.6"/>
          </svg>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>TryA11y</span>
        </div>
        <button style={{ padding: "5px 14px", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Scan Page</button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#818cf8" }}>3 issues · 2 fixable</span>
      </div>
      {/* body: list + detail */}
      <div style={{ display: "flex", height: 260 }}>
        {/* issue list */}
        <div style={{ width: 200, borderRight: "1px solid #2a2a4a", overflowY: "auto" }}>
          {MOCK_ISSUES.map(issue => (
            <div
              key={issue.id}
              onClick={() => setSelected(issue)}
              style={{ padding: "10px 12px", borderBottom: "1px solid #1e1e3a", cursor: "pointer", background: selected.id === issue.id ? "#1e1e4a" : "transparent", borderLeft: selected.id === issue.id ? "3px solid #6366f1" : "3px solid transparent" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: IMPACT_COLOR[issue.impact], flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: IMPACT_COLOR[issue.impact], textTransform: "capitalize" }}>{issue.impact}</span>
              </div>
              <div style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.4 }}>{issue.rule}</div>
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>{applied.has(issue.id) ? "✓ Fixed" : "Fix available"}</div>
            </div>
          ))}
        </div>
        {/* issue detail */}
        <div style={{ flex: 1, padding: "14px", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e0e0ff" }}>{selected.rule}</span>
            <span style={{ padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: IMPACT_COLOR[selected.impact] + "33", color: IMPACT_COLOR[selected.impact] }}>{selected.impact}</span>
          </div>
          <p style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 10, lineHeight: 1.5 }}>{selected.desc}</p>
          <div style={{ fontSize: 11, color: "#6366f1", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested Fix</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, background: "#0f0f26", borderRadius: 6, padding: "8px 10px", marginBottom: 6, border: "1px solid #2a2a4a" }}>
            <div style={{ color: "#f87171", marginBottom: 4 }}>− {selected.id === "image-alt" ? '<img src="hero.jpg">' : selected.id === "heading-order" ? "<h3>Section</h3>" : '<input id="email">'}</div>
            <div style={{ color: "#4ade80" }}>+ {selected.id === "image-alt" ? '<img src="hero.jpg" alt="Hero image">' : selected.id === "heading-order" ? "<h2>Section</h2>" : '<input id="email" aria-label="Email address">'}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setApplied(prev => { const s = new Set(prev); applied.has(selected.id) ? s.delete(selected.id) : s.add(selected.id); return s; })}
              style={{ padding: "6px 12px", borderRadius: 6, background: applied.has(selected.id) ? "#ea580c" : "#6366f1", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              {applied.has(selected.id) ? "Undo Fix" : "Apply to Page"}
            </button>
            <button style={{ padding: "6px 12px", borderRadius: 6, background: "transparent", color: "#818cf8", border: "1px solid #6366f1", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Copy HTML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

export default function Home(): React.ReactElement {
  return (
    <div style={{ color: "var(--text-primary)" }}>
      <style>{`
        @keyframes pulse-ring { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      {/* Hero */}
      <section style={{ padding: "6rem 2rem 5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, var(--primary-glow) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px 5px 8px", borderRadius: 9999, background: "var(--primary-light)", border: "1px solid var(--primary)", fontSize: 12, fontWeight: 600, color: "var(--primary)", marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", animation: "pulse-ring 2s ease-in-out infinite", display: "inline-block" }} />
            Open Source · MIT Licensed · 100% Offline
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.04em", marginBottom: 20 }}>
            Accessibility auditing that{" "}
            <span style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #f472b6, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "inline" }}>
              finds violations, fixes them &amp; explains why.
            </span>
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.1rem)", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
            A Chrome extension that scans any page for WCAG 2.1 violations, generates real code fixes, and explains every issue in plain English — entirely offline, powered by local AI.
          </p>
          <a
            href="https://github.com/priyasahay/trya11y"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            View on GitHub
          </a>
        </div>
      </section>

      {/* Extension popup preview */}
      <section style={{ padding: "4rem 2rem", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", marginBottom: 10 }}>Chrome Extension — Popup</div>
            <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.9rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>Quick scan from the toolbar</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
              Click the TryA11y icon in your Chrome toolbar to instantly scan the active page. See a breakdown of issues by severity and jump straight to the full DevTools panel.
            </p>
            <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {["Scan any page with one click", "Issue count broken down by severity"].map(f => (
                <li key={f} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PopupMockup />
          </div>
        </div>
      </section>

      {/* DevTools panel preview */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 48, alignItems: "center" }}>
          <div style={{ order: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", marginBottom: 10 }}>Chrome DevTools — Panel</div>
            <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.9rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>Full fix workflow in DevTools</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
              Open DevTools (F12) and go to the <strong>TryA11y</strong> tab. Browse every issue with a before/after HTML diff, apply fixes live to the DOM, and undo with one click.
            </p>
            <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {["Per-issue before/after HTML diff", "Apply & undo fixes live on the page", "Highlight affected elements with 🎯", "AI explanation in plain English (via Ollama)", "Filter by severity"].map(f => (
                <li key={f} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ order: 0 }}>
            <PanelMockup />
          </div>
        </div>
      </section>

      {/* How to install */}
      <section style={{ padding: "4rem 2rem", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,2.5vw,1.9rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Install in 3 steps</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 40 }}>The extension is loaded unpacked from source — no Chrome Web Store required.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, textAlign: "left" }}>
            {[
              { num: "1", title: "Clone & build", code: "git clone https://github.com/priyasahay/trya11y\ncd trya11y && pnpm install && pnpm build" },
              { num: "2", title: "Load unpacked", code: "chrome://extensions\n→ Enable Developer mode\n→ Load unpacked\n→ select packages/extension/dist" },
              { num: "3", title: "Open DevTools", code: "Press F12 on any page\n→ Find the TryA11y tab\n→ Click Scan Page" },
            ].map(step => (
              <div key={step.num} style={{ padding: "20px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent-pink))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, marginBottom: 12 }}>{step.num}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <pre style={{ fontFamily: "monospace", fontSize: 11, background: "var(--bg-surface)", padding: "8px 10px", borderRadius: 6, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>{step.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ padding: "32px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", marginBottom: 8 }}>✦ Optional AI Features</div>
            <h2 style={{ fontSize: "clamp(1.2rem,2.5vw,1.7rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Plain-English explanations with local AI</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
              TryA11y integrates with <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Ollama</a> to explain every issue in plain English — who is affected, why it matters, and exactly what to change. Everything runs on your machine. No data leaves your device.
            </p>
            <div style={{ fontFamily: "monospace", fontSize: 12, background: "var(--bg-surface)", padding: "14px 16px", borderRadius: 10, color: "var(--text-secondary)", lineHeight: 2, border: "1px solid var(--border)" }}>
              <div><span style={{ color: "var(--text-muted)" }}># install the model</span></div>
              <div>ollama pull llama3.2</div>
              <div style={{ marginTop: 4 }}><span style={{ color: "var(--text-muted)" }}># start with extension CORS</span></div>
              <div>OLLAMA_ORIGINS="*" ollama serve</div>
              <div style={{ marginTop: 4 }}><span style={{ color: "var(--text-muted)" }}># or from repo root</span></div>
              <div>pnpm ollama</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "3rem 2rem 5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {[
            { value: "50+", label: "WCAG rules", color: "var(--primary)" },
            { value: "WCAG 2.1 AA", label: "Coverage", color: "var(--accent-blue)" },
            { value: "100%", label: "Offline", color: "var(--accent-green)" },
            { value: "MIT", label: "Open source", color: "var(--accent-pink)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "24px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, marginBottom: 4, letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
