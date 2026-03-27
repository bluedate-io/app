"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Heart, User } from "lucide-react";
import type { MatchListItem } from "@/types";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SUBTLE = "#9B8B78";
const SERIF = "var(--font-playfair, Georgia, serif)";
const SANS = "var(--font-geist-sans, sans-serif)";

const cardStyle: CSSProperties = {
  background: "#fff",
  border: `2.5px solid ${DARK}`,
  borderRadius: 18,
  boxShadow: `4px 4px 0 ${DARK}`,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function listPreviewLine(match: MatchListItem): string | null {
  const college = match.partner.college?.trim();
  if (college) return college;
  const bio = match.partner.bio?.trim();
  if (bio) return bio.length > 48 ? `${bio.slice(0, 48)}…` : bio;
  return null;
}

function Avatar({ url, name, size = 52 }: { url?: string; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2.5px solid ${DARK}`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#fff",
        border: `2.5px solid ${DARK}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: ACCENT,
      }}
      aria-label={name}
    >
      {initials || <User size={Math.round(size * 0.35)} strokeWidth={1.5} />}
    </div>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const empty = value === "—" || value.trim() === "";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid rgba(43, 26, 7, 0.08)",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: SUBTLE,
          fontFamily: SANS,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 15,
          lineHeight: 1.45,
          color: empty ? SUBTLE : DARK,
          fontFamily: SANS,
          fontStyle: empty ? "italic" : "normal",
        }}
      >
        {empty ? "—" : value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
        padding: "24px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          border: `2.5px solid ${DARK}`,
          boxShadow: `4px 4px 0 ${DARK}`,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <Heart size={36} strokeWidth={1.6} color={ACCENT} fill={`${ACCENT}18`} />
      </div>

      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 800,
          color: DARK,
          lineHeight: 1.3,
          margin: "0 0 10px",
        }}
      >
        Your matches are on the way
      </h2>

      <p
        style={{
          fontSize: 14,
          color: MUTED,
          lineHeight: 1.65,
          maxWidth: 280,
          margin: 0,
        }}
      >
        Our Bluedate AI agent is hand-picking one curated match for you — no swiping, just quality.
      </p>
    </div>
  );
}

function MatchList({
  matches,
  onOpen,
}: {
  matches: MatchListItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <div style={{ padding: "16px 18px 24px", display: "grid", gap: 12 }}>
      {matches.map((match) => {
        const preview = listPreviewLine(match);
        return (
          <button
            key={match.id}
            type="button"
            onClick={() => onOpen(match.id)}
            className="group w-full text-left transition-transform duration-150 ease-out hover:-translate-y-px active:translate-y-0"
            style={{
              ...cardStyle,
              padding: "14px 14px 14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <Avatar url={match.partner.photos[0]} name={match.partner.name} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: DARK,
                  fontFamily: SANS,
                  fontSize: 16,
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {match.partner.name}
                {match.partner.age ? `, ${match.partner.age}` : ""}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: MUTED,
                  fontFamily: SANS,
                  fontWeight: 500,
                }}
              >
                Matched {formatDate(match.matchedAt)}
              </p>
              {preview ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: SUBTLE,
                    fontFamily: SANS,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {preview}
                </p>
              ) : null}
            </div>
            <ChevronRight
              size={20}
              color={`${DARK}40`}
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
}

function MatchDetail({
  match,
  onBack,
}: {
  match: MatchListItem;
  onBack: () => void;
}) {
  const partner = match.partner;

  return (
    <div style={{ padding: "8px 18px 28px", display: "grid", gap: 16 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          width: "fit-content",
          border: `2.5px solid ${DARK}`,
          background: "#fff",
          borderRadius: 14,
          boxShadow: `4px 4px 0 ${DARK}`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          color: DARK,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <ChevronLeft size={16} strokeWidth={2} />
        Back
      </button>

      <div style={{ ...cardStyle, padding: "20px 18px 12px", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 4 }}>
          <Avatar url={partner.photos[0]} name={partner.name} size={72} />
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: SERIF,
                color: DARK,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -0.3,
                lineHeight: 1.2,
              }}
            >
              {partner.name}
              {partner.age ? `, ${partner.age}` : ""}
            </h2>
            <p style={{ margin: "6px 0 0", color: MUTED, fontFamily: SANS, fontSize: 13, fontWeight: 500 }}>
              Matched on {formatDate(match.matchedAt)}
            </p>
          </div>
        </div>

        <DetailRow label="Gender" value={partner.gender ?? "—"} />
        <DetailRow label="College" value={partner.college ?? "—"} />
        <DetailRow label="Weekly opt-in" value={partner.weeklyOptInDescription ?? "—"} />
        <DetailRow label="Bio" value={partner.bio ?? "—"} last />
      </div>

      {match.cardImageUrl ? (
        <div style={{ ...cardStyle, padding: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: SUBTLE,
            }}
          >
            Match card
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={match.cardImageUrl}
            alt="Match card"
            style={{
              width: "100%",
              maxHeight: 360,
              objectFit: "contain",
              borderRadius: 14,
              border: `1.5px solid ${DARK}25`,
              background: "#fff",
            }}
          />
        </div>
      ) : null}

      {partner.photos.length > 1 ? (
        <div style={{ ...cardStyle, padding: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: SUBTLE,
            }}
          >
            More photos
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {partner.photos.slice(1).map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${idx}`}
                src={url}
                alt={`${partner.name} photo ${idx + 2}`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 12,
                  border: `1.5px solid ${DARK}25`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-[18px] py-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 rounded-[20px] border border-[rgba(43,26,7,0.08)] bg-white p-4 shadow-[0_2px_8px_rgba(43,26,7,0.06)]"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-14 w-14 shrink-0 rounded-full bg-[rgba(43,26,7,0.06)]" />
          <div className="grid flex-1 gap-2">
            <div className="h-3.5 w-[72%] rounded-md bg-[rgba(43,26,7,0.08)]" />
            <div className="h-2.5 w-[45%] rounded bg-[rgba(43,26,7,0.05)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MatchesView() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load matches");
        }
        const json = (await res.json()) as { data?: MatchListItem[] };
        if (!cancelled) {
          setMatches(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load matches right now.");
          setMatches([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedId) ?? null,
    [matches, selectedId],
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        fontFamily: SANS,
        paddingBottom: "calc(92px + env(safe-area-inset-bottom))",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100%" }}>
        <header
          style={{
            padding: "22px 22px 16px",
            borderBottom: `2px solid ${DARK}`,
          }}
        >
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 28,
              fontWeight: 800,
              color: DARK,
              letterSpacing: -0.6,
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Matches
          </h1>
        </header>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div style={{ padding: "16px 18px" }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <p style={{ margin: 0, color: DARK, fontFamily: SANS, fontSize: 14, lineHeight: 1.5 }}>{error}</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : selected ? (
          <MatchDetail match={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <MatchList matches={matches} onOpen={setSelectedId} />
        )}
      </div>
    </div>
  );
}
