import React from "react";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Happin</h1>
      <p>Unified AI Communication Hub — backend API is live.</p>
      <p>
        Health check: <code>/api/health</code>
      </p>
      <p>Next step after this: add Twilio webhook ingestion + AI summarizer.</p>
    </main>
  );
}

