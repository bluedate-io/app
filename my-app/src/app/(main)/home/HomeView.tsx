"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";

interface OptInState {
  optedIn: boolean;
  mode: "date" | "bff" | null;
  description: string | null;
  weekStart: string;
  deadline: string;
  windowOpen: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimeParts(ms: number) {
  if (ms <= 0) return { d: "00", h: "00", m: "00", s: "00", closed: true };
  const total = Math.floor(ms / 1000);
  return {
    d: pad(Math.floor(total / 86400)),
    h: pad(Math.floor((total % 86400) / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
    closed: false,
  };
}

function formatMatchDay(deadlineIso: string): string {
  // Match day = the Saturday after Friday deadline
  const d = new Date(new Date(deadlineIso).getTime() + 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
}

// ─── Timer cell ───────────────────────────────────────────────────────────────
function TimeCell({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
      <span
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(40px, 11vw, 68px)",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: -1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TimeSep() {
  return (
    <span
      style={{
        fontFamily: SERIF,
        fontSize: "clamp(32px, 8vw, 52px)",
        fontWeight: 800,
        color: ACCENT,
        lineHeight: 1,
        alignSelf: "flex-start",
        paddingTop: 2,
        userSelect: "none",
      }}
    >
      :
    </span>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function TypeTextarea({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={3}
      maxLength={500}
      style={{
        width: "100%",
        padding: "12px 14px",
        background: "#fff",
        border: `2px solid ${DARK}`,
        boxShadow: `2px 2px 0 ${DARK}`,
        borderRadius: 12,
        fontSize: 14,
        color: DARK,
        resize: "none",
        outline: "none",
        fontFamily: "inherit",
        boxSizing: "border-box",
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function HomeView({ initial }: { initial: OptInState }) {
  const [state, setState] = useState<OptInState>(initial);
  const [parts, setParts] = useState(() => getTimeParts(new Date(initial.deadline).getTime() - Date.now()));
  const [description, setDescription] = useState(initial.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optingIn, setOptingIn] = useState(false);

  const deadlineMs = useMemo(() => new Date(state.deadline).getTime(), [state.deadline]);
  const matchDay = useMemo(() => formatMatchDay(state.deadline), [state.deadline]);

  const tick = useCallback(() => {
    setParts(getTimeParts(deadlineMs - Date.now()));
  }, [deadlineMs]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const windowOpen = !parts.closed;

  async function handleOptIn() {
    setOptingIn(true);
    try {
      const res = await fetch("/api/home/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) setState((p) => ({ ...p, ...data.data, optedIn: true }));
    } finally {
      setOptingIn(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/home/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setState((p) => ({ ...p, ...data.data }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  const modeLine = state.mode === "bff" ? "BFF" : "Date";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        paddingTop: "max(env(safe-area-inset-top), 20px)",
        paddingBottom: 24,
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Page title */}
      <div style={{ padding: "8px 20px 16px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: DARK, margin: 0, lineHeight: 1.2 }}>
          This Week
        </h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", fontWeight: 500 }}>
          Opt in by Friday midnight IST for a curated match
        </p>
      </div>

      {/* ── Hero countdown ────────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px 20px" }}>
        <div
          style={{
            background: DARK,
            border: `2.5px solid ${DARK}`,
            boxShadow: `6px 6px 0 ${ACCENT}`,
            borderRadius: 20,
            padding: "28px 20px 22px",
          }}
        >
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: ACCENT,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            margin: "0 0 20px",
            textAlign: "center",
          }}>
            {windowOpen ? "Opt-in closes in" : "Window closed"}
          </p>

          {/* DD : HH : MM : SS */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 4 }}>
            <TimeCell value={parts.d} label="Days" />
            <TimeSep />
            <TimeCell value={parts.h} label="Hours" />
            <TimeSep />
            <TimeCell value={parts.m} label="Mins" />
            <TimeSep />
            <TimeCell value={parts.s} label="Secs" />
          </div>

          {/* Next match day */}
          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            margin: "20px 0 0",
            fontWeight: 500,
          }}>
            Next Match Day: {matchDay}
          </p>
        </div>
      </div>

      {/* ── Not opted in ─────────────────────────────────────────────────── */}
      {!state.optedIn && (
        <div style={{ padding: "0 16px" }}>
          <div
            style={{
              background: "#fff",
              border: `2.5px solid ${DARK}`,
              boxShadow: `4px 4px 0 ${DARK}`,
              borderRadius: 18,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: DARK }}>
                Want a match this week?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                Opt in and we&apos;ll find you someone by the weekend.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Describe your type <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <TypeTextarea
                value={description}
                onChange={setDescription}
                disabled={!windowOpen}
                placeholder="e.g. someone outdoorsy who loves films…"
              />
            </div>

            <button
              onClick={handleOptIn}
              disabled={!windowOpen || optingIn}
              style={{
                background: windowOpen ? DARK : MUTED,
                color: "#fff",
                border: `2.5px solid ${DARK}`,
                boxShadow: windowOpen ? `4px 4px 0 ${DARK}` : "none",
                borderRadius: 999,
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 700,
                cursor: windowOpen ? "pointer" : "not-allowed",
                width: "100%",
                transition: "opacity 0.15s",
                opacity: optingIn ? 0.7 : 1,
              }}
            >
              {optingIn ? "Opting in…" : windowOpen ? "Opt In for This Week" : "Window Closed"}
            </button>
          </div>
        </div>
      )}

      {/* ── Opted in ──────────────────────────────────────────────────────── */}
      {state.optedIn && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Status badge */}
          <div
            style={{
              background: `${ACCENT}12`,
              border: `2px solid ${ACCENT}`,
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{state.mode === "bff" ? "👯" : "🗓"}</span>
            <div>
              <p style={{ margin: "0 0 2px", fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: DARK }}>
                You&apos;re in! Looking for a {modeLine}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                We&apos;ll match you before the weekend.
              </p>
            </div>
          </div>

          {/* Description card */}
          <div
            style={{
              background: "#fff",
              border: `2.5px solid ${DARK}`,
              boxShadow: `4px 4px 0 ${DARK}`,
              borderRadius: 18,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: DARK }}>
                Describe your type
              </p>
              <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                Help us find your best match — the more detail the better.
              </p>
            </div>

            <TypeTextarea
              value={description}
              onChange={(v) => { setDescription(v); setSaved(false); }}
              disabled={!windowOpen}
              placeholder="e.g. someone outdoorsy who loves films…"
            />

            {windowOpen && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saved ? "#2D7A2D" : ACCENT,
                  color: "#fff",
                  border: `2.5px solid ${DARK}`,
                  boxShadow: `3px 3px 0 ${DARK}`,
                  borderRadius: 999,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  transition: "background 0.2s",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>
            )}

            {!windowOpen && (
              <p style={{ fontSize: 12, color: MUTED, textAlign: "center" }}>
                Opt-in window is closed. See you next Monday!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
