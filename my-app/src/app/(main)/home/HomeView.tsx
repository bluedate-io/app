"use client";

import { useState, useEffect, useCallback } from "react";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";

interface OptInState {
  optedIn: boolean;
  mode: "date" | "bff" | null;
  description: string | null;
  weekStart: string;
  deadline: string;
  windowOpen: boolean;
}

interface HomeViewProps {
  initial: OptInState;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Closed";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}

export function HomeView({ initial }: HomeViewProps) {
  const [state, setState] = useState<OptInState>(initial);
  const [countdown, setCountdown] = useState("");
  const [description, setDescription] = useState(initial.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optingIn, setOptingIn] = useState(false);

  const deadline = new Date(state.deadline);

  const tick = useCallback(() => {
    const ms = deadline.getTime() - Date.now();
    setCountdown(formatCountdown(ms));
  }, [state.deadline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  async function handleOptIn() {
    setOptingIn(true);
    try {
      const res = await fetch("/api/home/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setState((prev) => ({ ...prev, ...data.data, optedIn: true }));
        setSaved(false);
      }
    } finally {
      setOptingIn(false);
    }
  }

  async function handleSaveDescription() {
    setSaving(true);
    try {
      const res = await fetch("/api/home/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setState((prev) => ({ ...prev, ...data.data }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  const windowOpen = new Date(state.deadline).getTime() > Date.now();
  const modeLine = state.mode === "bff" ? "BFF" : "Date";
  const modeEmoji = state.mode === "bff" ? "👯" : "🗓";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        padding: "0 20px",
        paddingTop: "max(env(safe-area-inset-top), 24px)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ paddingTop: 8 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: DARK,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          This Week
        </h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", fontWeight: 500 }}>
          Opt in by Friday midnight IST for a curated match
        </p>
      </div>

      {/* Countdown card */}
      <div
        style={{
          background: "white",
          border: `2.5px solid ${DARK}`,
          boxShadow: `4px 4px 0 ${DARK}`,
          borderRadius: 16,
          padding: "20px 24px",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase" }}>
          Opt-in window closes in
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32,
            fontWeight: 700,
            color: windowOpen ? DARK : MUTED,
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {countdown}
        </p>
        {!windowOpen && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: MUTED }}>
            Window opens again next Monday.
          </p>
        )}
      </div>

      {/* Not opted in yet */}
      {!state.optedIn && (
        <div
          style={{
            background: "white",
            border: `2.5px solid ${DARK}`,
            boxShadow: `4px 4px 0 ${DARK}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 18,
                fontWeight: 700,
                color: DARK,
              }}
            >
              Want a match this week?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
              Opt in and we&apos;ll find you someone by the weekend.
            </p>
          </div>

          {/* Optional description before opting in */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Describe your type (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. someone outdoorsy who loves films…"
              disabled={!windowOpen}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "white",
                border: `2px solid ${DARK}`,
                boxShadow: `2px 2px 0 ${DARK}`,
                borderRadius: 12,
                fontSize: 14,
                color: DARK,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                opacity: windowOpen ? 1 : 0.5,
              }}
              maxLength={500}
            />
          </div>

          <button
            onClick={handleOptIn}
            disabled={!windowOpen || optingIn}
            style={{
              background: windowOpen ? DARK : MUTED,
              color: "white",
              border: `2.5px solid ${DARK}`,
              boxShadow: windowOpen ? `4px 4px 0 ${DARK}` : "none",
              borderRadius: 999,
              padding: "14px 24px",
              fontSize: 15,
              fontWeight: 700,
              cursor: windowOpen ? "pointer" : "not-allowed",
              transition: "box-shadow 0.15s",
              opacity: optingIn ? 0.7 : 1,
            }}
          >
            {optingIn ? "Opting in…" : windowOpen ? "Opt In for This Week" : "Window Closed"}
          </button>
        </div>
      )}

      {/* Opted in — show status */}
      {state.optedIn && (
        <div
          style={{
            background: "white",
            border: `2.5px solid ${DARK}`,
            boxShadow: `4px 4px 0 ${DARK}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Mode badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: `2.5px solid ${DARK}`,
                boxShadow: `3px 3px 0 ${DARK}`,
                background: `${ACCENT}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {modeEmoji}
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 2px",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: DARK,
                }}
              >
                You&apos;re in! Looking for a {modeLine}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                We&apos;ll match you before the weekend.
              </p>
            </div>
          </div>

          {/* Description editor */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Describe your type
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
              placeholder="e.g. someone outdoorsy who loves films…"
              disabled={!windowOpen}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "white",
                border: `2px solid ${DARK}`,
                boxShadow: `2px 2px 0 ${DARK}`,
                borderRadius: 12,
                fontSize: 14,
                color: DARK,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                opacity: windowOpen ? 1 : 0.5,
              }}
              maxLength={500}
            />
          </div>

          {windowOpen && (
            <button
              onClick={handleSaveDescription}
              disabled={saving}
              style={{
                background: saved ? "#3A7A3A" : ACCENT,
                color: "white",
                border: `2.5px solid ${DARK}`,
                boxShadow: `4px 4px 0 ${DARK}`,
                borderRadius: 999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s, box-shadow 0.15s",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Update Description"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
