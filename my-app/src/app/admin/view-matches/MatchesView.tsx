"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, User } from "lucide-react";

type MatchRow = {
  id: string;
  matchedAt: string;
  blurb: string | null;
  cardImageUrl: string | null;
  woman: { name: string; age: number | null; city: string | null; photoUrl: string | null };
  man:   { name: string; age: number | null; city: string | null; photoUrl: string | null };
};

type State =
  | { status: "loading" }
  | { status: "ready"; matches: MatchRow[]; deletingId: string | null }
  | { status: "error" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: 40, height: 40 }} />
  ) : (
    <div className="rounded-full shrink-0 flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: "#F0EBFA" }}>
      <User size={18} style={{ color: "#C060C0" }} strokeWidth={1.5} />
    </div>
  );
}

export default function MatchesView() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/matches");
      const { data } = await res.json();
      setState({ status: "ready", matches: data, deletingId: null });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteMatch(id: string) {
    setState((s) => s.status === "ready" ? { ...s, deletingId: id } : s);
    await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    setState((s) =>
      s.status === "ready"
        ? { ...s, matches: s.matches.filter((m) => m.id !== id), deletingId: null }
        : s,
    );
    setConfirmId(null);
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border animate-pulse" style={{ height: 80, borderColor: "#EDE8F7", backgroundColor: "#FAF8FF" }} />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-sm mb-3" style={{ color: "#DC2626" }}>Failed to load matches.</p>
        <button onClick={load} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}>Retry</button>
      </div>
    );
  }

  if (state.matches.length === 0) {
    return (
      <div className="flex flex-col items-center py-32 rounded-2xl border" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
        <p className="text-base font-semibold" style={{ color: "#1A0A2E" }}>No matches yet</p>
        <p className="text-sm mt-1" style={{ color: "#9B87B0" }}>Matches you create will appear here.</p>
      </div>
    );
  }

  const { matches, deletingId } = state;

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: "#EDE8F7" }}
        >
          <div className="flex items-start gap-4 px-5 py-4">
            {/* Woman */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar url={m.woman.photoUrl} name={m.woman.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#1A0A2E" }}>
                  {m.woman.name}{m.woman.age ? `, ${m.woman.age}` : ""}
                </p>
                {m.woman.city && <p className="text-xs truncate" style={{ color: "#9B87B0" }}>{m.woman.city}</p>}
              </div>
            </div>

            {/* Connector */}
            <div className="shrink-0 flex flex-col items-center gap-0.5 pt-1">
              <span className="text-xs font-medium" style={{ color: "#C060C0" }}>♥</span>
              <span className="text-xs" style={{ color: "#9B87B0" }}>{formatDate(m.matchedAt)}</span>
            </div>

            {/* Man */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-row-reverse">
              <Avatar url={m.man.photoUrl} name={m.man.name} />
              <div className="min-w-0 text-right">
                <p className="text-sm font-semibold truncate" style={{ color: "#1A0A2E" }}>
                  {m.man.name}{m.man.age ? `, ${m.man.age}` : ""}
                </p>
                {m.man.city && <p className="text-xs truncate" style={{ color: "#9B87B0" }}>{m.man.city}</p>}
              </div>
            </div>

            {/* Delete */}
            <div className="shrink-0 pl-2">
              {confirmId === m.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs px-2.5 py-1 rounded-lg border"
                    style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMatch(m.id)}
                    disabled={deletingId === m.id}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    {deletingId === m.id ? "Deleting…" : "Confirm"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(m.id)}
                  className="p-1.5 rounded-lg transition hover:bg-red-50"
                  title="Delete match"
                >
                  <Trash2 size={15} style={{ color: "#DC2626" }} strokeWidth={1.8} />
                </button>
              )}
            </div>
          </div>

          {/* Match card image */}
          {m.cardImageUrl && (
            <div className="px-5 pb-5">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #F5F0FB 0%, #FDF3FF 50%, #F0EBFA 100%)",
                  border: "1px solid #E8DEFF",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 z-1"
                  style={{ height: 3, background: "linear-gradient(90deg, #8F3A8F, #C060C0, #E080A0)" }}
                />
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                    >
                      <span style={{ fontSize: 8, color: "#fff", lineHeight: 1 }}>✦</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8F3A8F" }}>
                      Match card
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.cardImageUrl}
                    alt="Match card"
                    className="w-full rounded-xl object-contain max-h-[280px] bg-white/50"
                    style={{ border: "1px solid #E8DEFF" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Blurb */}
          {m.blurb && (
            <div className="px-5 pb-5">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #F5F0FB 0%, #FDF3FF 50%, #F0EBFA 100%)",
                  border: "1px solid #E8DEFF",
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: 3, background: "linear-gradient(90deg, #8F3A8F, #C060C0, #E080A0)" }}
                />

                <div className="px-5 pt-5 pb-4">
                  {/* Label */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                    >
                      <span style={{ fontSize: 8, color: "#fff", lineHeight: 1 }}>✦</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8F3A8F" }}>
                      Match Note
                    </span>
                  </div>

                  {/* Blurb text */}
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "#3B2056",
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{m.blurb}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
