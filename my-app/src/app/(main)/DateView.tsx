"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

export function DateView({ initialWantDate }: { initialWantDate: boolean }) {
  const [wantDate, setWantDate] = useState(initialWantDate);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !wantDate;
    setWantDate(next);
    setSaving(true);
    try {
      await fetch("/api/date/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wantDate: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F5F0FB",
        fontFamily: "var(--font-geist-sans, sans-serif)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-2"
        style={{ background: "#F5F0FB" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "#1A0A2E" }}>
          Date
        </h1>
      </div>

      {/* Toggle card */}
      <div className="mx-4 mt-3">
        <div
          className="rounded-3xl px-5 py-5"
          style={{
            background: "#fff",
            boxShadow: "0 1px 3px rgba(90,42,106,0.06)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-2xl shrink-0"
              style={{
                width: 52,
                height: 52,
                background: wantDate
                  ? "linear-gradient(135deg,#A33BB5,#6A2F8A)"
                  : "#F3EFF8",
              }}
            >
              <Flame
                size={24}
                color={wantDate ? "#fff" : "#C4B0D8"}
                strokeWidth={2}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>
                I want a date
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>
                {wantDate
                  ? "You're visible to potential matches"
                  : "You're hidden from matches right now"}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggle}
              disabled={saving}
              aria-pressed={wantDate}
              style={{
                position: "relative",
                width: 52,
                height: 30,
                borderRadius: 999,
                background: wantDate
                  ? "linear-gradient(135deg,#A33BB5,#6A2F8A)"
                  : "#D1C4E9",
                border: "none",
                cursor: saving ? "wait" : "pointer",
                transition: "background 0.2s ease",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: wantDate ? "calc(100% - 27px)" : 3,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  transition: "left 0.2s ease",
                  display: "block",
                }}
              />
            </button>
          </div>

          {wantDate && (
            <p
              className="text-xs mt-4 leading-relaxed"
              style={{ color: "#9B87B0" }}
            >
              Turn this off whenever you need a break — your profile and matches
              are saved.
            </p>
          )}
        </div>
      </div>

      {/* Placeholder */}
      <div
        className="mx-4 mt-4 rounded-3xl flex flex-col items-center justify-center py-16 gap-3"
        style={{
          background: "#fff",
          boxShadow: "0 1px 3px rgba(90,42,106,0.06)",
        }}
      >
        <span style={{ fontSize: 40 }}>💙</span>
        <p
          className="text-sm text-center"
          style={{ color: "#9B87B0", maxWidth: 220 }}
        >
          Your matches will appear here soon.
        </p>
      </div>
    </div>
  );
}
