// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Optional: keep analytics, but you can comment these 2 lines temporarily
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Global diagnostics for anything before React mounts
window.addEventListener("error", (e) => {
  const el = document.getElementById("boot-error");
  if (el) el.textContent = `window.onerror: ${e.error?.message || e.message || e}`;
});
window.addEventListener("unhandledrejection", (e) => {
  const el = document.getElementById("boot-error");
  if (el) el.textContent = `unhandledrejection: ${e.reason?.message || e.reason || e}`;
});

// Ensure root exists
const rootEl = document.getElementById("root");
if (!rootEl) {
  const msg = "Missing <div id='root'></div> in index.html";
  document.body.innerHTML = `<pre style="padding:16px">${msg}</pre>`;
  throw new Error(msg);
}

// Add a tiny debug area so you see messages on the page even if React fails
const debugEl = document.createElement("pre");
debugEl.id = "boot-error";
debugEl.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;background:#fff;padding:6px 8px;border:1px solid #ddd;max-width:90vw;max-height:30vh;overflow:auto;font:12px/1.4 system-ui";
document.body.appendChild(debugEl);

const root = createRoot(rootEl);

// Load App **dynamically** so we can catch import-time errors
(async function boot() {
  try {
    const mod = await import("./App.tsx");
    const App = mod.default;

    root.render(
      <React.StrictMode>
        <App />
        <Analytics />
        <SpeedInsights />
      </React.StrictMode>
    );
    debugEl.textContent = ""; // clean up if success
  } catch (err: any) {
    const msg = `App import failed: ${err?.message || String(err)}`;
    console.error(msg, err);
    debugEl.textContent = msg;
    // Also show it inline so it’s obvious
    root.render(<div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>Startup error</h2>
      <pre>{msg}</pre>
    </div>);
  }
})();
