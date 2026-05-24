import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const manifest = {
  manifest_version: 3,
  name: "TryA11y",
  version: "1.0.0",
  description: "Accessibility scanner with offline fix generation and report export",
  permissions: ["activeTab", "storage", "scripting", "contextMenus", "downloads"],
  host_permissions: ["<all_urls>", "http://localhost:11434/*"],
  background: {
    service_worker: "background/service-worker.js",
    type: "module",
  },
  devtools_page: "src/devtools/devtools.html",
  action: {
    default_popup: "src/popup/popup.html",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content/index.js"],
      run_at: "document_idle",
    },
  ],
};

const outPath = resolve(__dirname, "../dist/manifest.json");
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("✓ manifest.json written to dist/");
