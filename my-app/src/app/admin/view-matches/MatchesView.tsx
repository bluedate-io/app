"use client";

import { useEffect, useState, useCallback } from "react";
import { MoreVertical, Trash2, User } from "lucide-react";
import UserDetailSheet from "@/components/admin-bd/UserDetailSheet";
import { ADMIN_BTN_DANGER_SM, ADMIN_BTN_NEUTRAL_SM, ADMIN_BTN_SECONDARY } from "@/lib/adminChrome";
import { adminTheme } from "@/lib/adminTheme";

type MatchRow = {
  id: string;
  matchedAt: string;
  blurb: string | null;
  cardImageUrl: string | null;
  woman: { id: string; name: string; age: number | null; city: string | null; photoUrl: string | null };
  man:   { id: string; name: string; age: number | null; city: string | null; photoUrl: string | null };
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
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 40, height: 40, backgroundColor: adminTheme.accentMutedBg }}
    >
      <User size={18} style={{ color: adminTheme.orange }} strokeWidth={1.5} />
    </div>
  );
}

export default function MatchesView() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

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
          <div
            key={i}
            className="animate-pulse rounded-2xl border"
            style={{ height: 80, borderColor: adminTheme.accentMutedBg, backgroundColor: adminTheme.pageBg }}
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center py-24">
        <p className="text-sm mb-3" style={{ color: "#DC2626" }}>Failed to load matches.</p>
        <button onClick={load} className={`${ADMIN_BTN_SECONDARY} text-sm`}>
          Retry
        </button>
      </div>
    );
  }

  if (state.matches.length === 0) {
    return (
      <div
        className="flex flex-col items-center rounded-2xl border py-32"
        style={{ borderColor: adminTheme.accentMutedBg, backgroundColor: "#fff" }}
      >
        <p className="text-base font-semibold" style={{ color: adminTheme.ink }}>
          No matches yet
        </p>
        <p className="mt-1 text-sm" style={{ color: adminTheme.mutedLabel }}>
          Matches you create will appear here.
        </p>
      </div>
    );
  }

  const { matches, deletingId } = state;

  return (
    <div className="space-y-3">
      {detailUserId ? (
        <UserDetailSheet userId={detailUserId} onClose={() => setDetailUserId(null)} />
      ) : null}
      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: adminTheme.accentMutedBg }}
        >
          <div className="flex items-start gap-4 px-5 py-4">
            {/* Woman */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar url={m.woman.photoUrl} name={m.woman.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: adminTheme.ink }}>
                  {m.woman.name}{m.woman.age ? `, ${m.woman.age}` : ""}
                </p>
                {m.woman.city && (
                  <p className="truncate text-xs" style={{ color: adminTheme.mutedLabel }}>
                    {m.woman.city}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailUserId(m.woman.id)}
                className="rounded-lg p-1.5 transition hover:bg-bd-table-hover"
                aria-label={`Open details for ${m.woman.name}`}
              >
                <MoreVertical size={15} style={{ color: adminTheme.textSecondary }} />
              </button>
            </div>

            {/* Connector */}
            <div className="shrink-0 flex flex-col items-center gap-0.5 pt-1">
              <span className="text-xs font-medium" style={{ color: adminTheme.orange }}>
                ♥
              </span>
              <span className="text-xs" style={{ color: adminTheme.mutedLabel }}>
                {formatDate(m.matchedAt)}
              </span>
            </div>

            {/* Man */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-row-reverse">
              <Avatar url={m.man.photoUrl} name={m.man.name} />
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold" style={{ color: adminTheme.ink }}>
                  {m.man.name}{m.man.age ? `, ${m.man.age}` : ""}
                </p>
                {m.man.city && (
                  <p className="truncate text-xs" style={{ color: adminTheme.mutedLabel }}>
                    {m.man.city}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailUserId(m.man.id)}
                className="rounded-lg p-1.5 transition hover:bg-bd-table-hover"
                aria-label={`Open details for ${m.man.name}`}
              >
                <MoreVertical size={15} style={{ color: adminTheme.textSecondary }} />
              </button>
            </div>

            {/* Delete */}
            <div className="shrink-0 pl-2">
              {confirmId === m.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setConfirmId(null)} className={ADMIN_BTN_NEUTRAL_SM}>
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMatch(m.id)}
                    disabled={deletingId === m.id}
                    className={ADMIN_BTN_DANGER_SM}
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
                  background: `linear-gradient(135deg, ${adminTheme.pageBg} 0%, #FFF8F0 50%, ${adminTheme.accentMutedBg} 100%)`,
                  border: `1px solid ${adminTheme.borderSoft}`,
                }}
              >
                <div
                  className="absolute left-0 right-0 top-0 z-1"
                  style={{
                    height: 3,
                    background: `linear-gradient(90deg, ${adminTheme.orange}, ${adminTheme.orangeBright}, ${adminTheme.terracotta})`,
                  }}
                />
                <div className="px-5 pb-4 pt-5">
                  <div className="mb-3 flex items-center gap-1.5">
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${adminTheme.orange}, ${adminTheme.orangeBright})`,
                      }}
                    >
                      <span style={{ fontSize: 8, color: "#fff", lineHeight: 1 }}>✦</span>
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: adminTheme.orange }}
                    >
                      Match card
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.cardImageUrl}
                    alt="Match card"
                    className="max-h-[280px] w-full rounded-xl bg-white/50 object-contain"
                    style={{ border: `1px solid ${adminTheme.borderSoft}` }}
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
                  background: `linear-gradient(135deg, ${adminTheme.pageBg} 0%, #FFF8F0 50%, ${adminTheme.accentMutedBg} 100%)`,
                  border: `1px solid ${adminTheme.borderSoft}`,
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute left-0 right-0 top-0"
                  style={{
                    height: 3,
                    background: `linear-gradient(90deg, ${adminTheme.orange}, ${adminTheme.orangeBright}, ${adminTheme.terracotta})`,
                  }}
                />

                <div className="px-5 pb-4 pt-5">
                  {/* Label */}
                  <div className="mb-3 flex items-center gap-1.5">
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${adminTheme.orange}, ${adminTheme.orangeBright})`,
                      }}
                    >
                      <span style={{ fontSize: 8, color: "#fff", lineHeight: 1 }}>✦</span>
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: adminTheme.orange }}
                    >
                      Match Note
                    </span>
                  </div>

                  {/* Blurb text */}
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: adminTheme.ink,
                      fontFamily: "var(--font-bd-display), Georgia, serif",
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
