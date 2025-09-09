// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Vercel Analytics (for pageviews, referrers, geo, etc.)
import { Analytics } from "@vercel/analytics/react";
// Vercel Speed Insights (Core Web Vitals & perf)
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
