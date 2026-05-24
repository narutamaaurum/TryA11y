// ---------------------------------------------------------------------------
// @trya11y/extension — Content Script
// ---------------------------------------------------------------------------
// Injected into every page.  Listens for messages from the background service
// worker and executes scans, applies/undoes fixes, and highlights elements
// using @trya11y/core primitives.
// ---------------------------------------------------------------------------

import {
  scan,
  generateFixes,
  applyFix,
  highlightElement,
} from '@trya11y/core';
import type {
  A11yIssue,
  FixSuggestion,
} from '@trya11y/core';

// Guard against double-registration when injected both via manifest and
// programmatically (popup injects on demand for tabs loaded before extension).
const _w = window as Window & { __trya11y?: boolean };
if (!_w.__trya11y) {
_w.__trya11y = true;

// ---- Undo registry --------------------------------------------------------
const undoRegistry = new Map<string, () => void>();

// ---- Fix registry (populated on each scan) --------------------------------
const fixRegistry = new Map<string, { issue: A11yIssue; fix: FixSuggestion }>();

// ---- Focus Order state ----------------------------------------------------
const focusOverlays: HTMLElement[] = [];

function showFocusOrder(): number {
  hideFocusOrder();
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  });

  focusable.forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.setAttribute('data-trya11y-focus-overlay', '');
    overlay.style.cssText = [
      'position:fixed',
      `top:${rect.top}px`,
      `left:${rect.left}px`,
      'min-width:20px',
      'min-height:20px',
      'background:rgba(99,102,241,0.85)',
      'color:#fff',
      'font:bold 11px/20px system-ui',
      'text-align:center',
      'border-radius:50%',
      'z-index:2147483647',
      'pointer-events:none',
      'padding:0 4px',
    ].join(';');
    overlay.textContent = String(idx + 1);
    document.body.appendChild(overlay);
    focusOverlays.push(overlay);
  });

  return focusable.length;
}

function hideFocusOrder(): void {
  for (const el of focusOverlays) el.remove();
  focusOverlays.length = 0;
  document.querySelectorAll('[data-trya11y-focus-overlay]').forEach((el) => el.remove());
}

// ---- Message listener -----------------------------------------------------

chrome.runtime.onMessage.addListener((
  message: { type: string; issueId?: string; selector?: string; severity?: string },
  _sender,
  sendResponse,
) => {
  (async () => {
    try {
      switch (message.type) {
        case 'SCAN_PAGE': {
          const result = await scan();
          const fixMap = generateFixes(result.issues);

          // Rebuild fix registry so APPLY_FIX can look up issue+fix by id
          fixRegistry.clear();
          for (const issue of result.issues) {
            const fix = fixMap.get(issue.id);
            if (fix) fixRegistry.set(issue.id, { issue, fix });
          }

          const fixes: Record<string, FixSuggestion> = {};
          for (const [id, fix] of fixMap) fixes[id] = fix;

          sendResponse({ type: 'SCAN_RESULT', result, fixes });
          break;
        }

        case 'APPLY_FIX': {
          const { issueId } = message as { type: string; issueId: string };
          const entry = fixRegistry.get(issueId);
          if (!entry) { sendResponse({ success: false, error: 'No fix found for issue' }); break; }
          const undo = applyFix(entry.issue, entry.fix);
          undoRegistry.set(issueId, undo);
          sendResponse({ success: true });
          break;
        }

        case 'UNDO_FIX': {
          const { issueId } = message as { type: string; issueId: string };
          const undo = undoRegistry.get(issueId);
          if (undo) { undo(); undoRegistry.delete(issueId); }
          sendResponse({ success: true });
          break;
        }

        case 'HIGHLIGHT_ELEMENT': {
          const { selector, severity = 'moderate' } = message as { type: string; selector: string; severity?: string };
          highlightElement(selector, severity);
          sendResponse({ ok: true });
          break;
        }

        case 'SHOW_FOCUS_ORDER': {
          const count = showFocusOrder();
          sendResponse({ ok: true, count });
          break;
        }

        case 'HIDE_FOCUS_ORDER': {
          hideFocusOrder();
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      sendResponse({ ok: false, error: msg });
    }
  })();
  return true; // keep message channel open for async response
});

} // end double-injection guard
