"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  RotateCcw,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Filters = {
  cities: string[];
  gender: string;
  colleges: string[];
  ageMin: string;
  ageMax: string;
};

type MatchUser = {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  college: string | null;
  gender: string | null;
  selfDescription: string | null;
  idealPartner: string | null;
  photoUrl: string | null;
};

type PoolUser = MatchUser & { candidateCount: number };

// ─── Palette ──────────────────────────────────────────────────────────────────

const P = "#8F3A8F";
const P_LIGHT = "#EDE8F7";
const DARK = "#1A0A2E";
const MUTED = "#6B5E7A";
const SUBTLE = "#9B87B0";
const BG = "#F5F0FB";

// ─── Multi-select dropdown ────────────────────────────────────────────────────

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = selected.length > 0;

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition whitespace-nowrap"
        style={{
          borderColor: active ? P : "#C9B8D9",
          color: active ? P : MUTED,
          backgroundColor: active ? P_LIGHT : "#FAF5FC",
        }}
      >
        {label}
        {active ? ` (${selected.length})` : ""}
        <ChevronDown
          size={12}
          className="shrink-0"
          style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border bg-white shadow-xl p-2"
          style={{ borderColor: "#EDE8F7" }}
        >
          <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
            {options.length === 0 ? (
              <p className="text-xs py-2 px-1" style={{ color: MUTED }}>
                No options
              </p>
            ) : (
              options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-xs cursor-pointer px-2 py-1.5 rounded-lg hover:bg-violet-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                    className="rounded border-gray-300"
                  />
                  <span style={{ color: DARK }}>{opt}</span>
                </label>
              ))
            )}
          </div>
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full text-xs py-1.5 rounded-lg font-semibold hover:bg-violet-50"
              style={{ color: P }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  allCities,
  allColleges,
  onChange,
  onReset,
}: {
  filters: Filters;
  allCities: string[];
  allColleges: string[];
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-6 py-3 border-b bg-white shrink-0"
      style={{ borderColor: "#EDE8F7" }}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest mr-1" style={{ color: SUBTLE }}>
        Filters
      </span>

      <MultiSelectDropdown
        label="City"
        options={allCities}
        selected={filters.cities}
        onChange={(v) => onChange({ ...filters, cities: v })}
      />

      <select
        value={filters.gender}
        onChange={(e) => onChange({ ...filters, gender: e.target.value })}
        className="shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
        style={{
          borderColor: filters.gender ? P : "#C9B8D9",
          color: filters.gender ? P : MUTED,
          backgroundColor: filters.gender ? P_LIGHT : "#FAF5FC",
        }}
      >
        <option value="">User A: All genders</option>
        <option value="Woman">Woman</option>
        <option value="Man">Man</option>
        <option value="Nonbinary">Nonbinary</option>
      </select>

      <MultiSelectDropdown
        label="College"
        options={allColleges}
        selected={filters.colleges}
        onChange={(v) => onChange({ ...filters, colleges: v })}
      />

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          placeholder="Age min"
          value={filters.ageMin}
          onChange={(e) => onChange({ ...filters, ageMin: e.target.value })}
          className="w-20 rounded-xl border px-2.5 py-2 text-xs"
          style={{ borderColor: "#C9B8D9", color: DARK }}
          min={18}
          max={99}
        />
        <span className="text-xs" style={{ color: MUTED }}>–</span>
        <input
          type="number"
          placeholder="Age max"
          value={filters.ageMax}
          onChange={(e) => onChange({ ...filters, ageMax: e.target.value })}
          className="w-20 rounded-xl border px-2.5 py-2 text-xs"
          style={{ borderColor: "#C9B8D9", color: DARK }}
          min={18}
          max={99}
        />
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-violet-50"
        style={{ borderColor: "#C9B8D9", color: MUTED, backgroundColor: "#FAF5FC" }}
      >
        <RotateCcw size={11} />
        Reset
      </button>
    </div>
  );
}

// ─── Pool user card ────────────────────────────────────────────────────────────

function PoolCard({ user, onClick }: { user: PoolUser; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border bg-white p-4 transition hover:shadow-md"
      style={{ borderColor: "#EDE8F7" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C060C0")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDE8F7")}
    >
      <div className="flex gap-3 items-start">
        {/* Photo */}
        <div
          className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ width: 56, height: 56, backgroundColor: "#F5F0FB" }}
        >
          {user.photoUrl ? (
            <Image
              src={user.photoUrl}
              alt={user.name}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-semibold text-sm truncate" style={{ color: DARK }}>
              {user.name}
            </p>
            <span
              className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                color: user.candidateCount > 0 ? "#166534" : "#9ca3af",
                backgroundColor: user.candidateCount > 0 ? "#dcfce7" : "#f3f4f6",
              }}
            >
              {user.candidateCount} match{user.candidateCount !== 1 ? "es" : ""}
            </span>
          </div>
          <p className="text-xs" style={{ color: MUTED }}>
            {[
              user.age != null ? `${user.age}y` : null,
              user.gender,
              user.city,
              user.college,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {user.selfDescription && (
            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: SUBTLE }}>
              {user.selfDescription.split("\n")[0]}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Profile panel ────────────────────────────────────────────────────────────

function ProfilePanel({
  user,
  label,
  labelColor,
}: {
  user: MatchUser;
  label: string;
  labelColor: string;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: "#EDE8F7" }}
    >
      {/* Header */}
      <div
        className="flex items-center px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: "#F0EBFA", backgroundColor: `${labelColor}10` }}
      >
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: labelColor }}>
          {label}
        </span>
      </div>

      {/* Photo */}
      <div
        className="relative w-full shrink-0"
        style={{ aspectRatio: "4/3", backgroundColor: "#F5F0FB" }}
      >
        {user.photoUrl ? (
          <Image
            src={user.photoUrl}
            alt={user.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">👤</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        <div>
          <p className="font-bold text-base" style={{ color: DARK }}>
            {user.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {[user.age != null ? `${user.age} yrs` : null, user.gender]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {[user.city, user.college].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        {user.selfDescription && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: SUBTLE }}>
              About
            </p>
            <p className="text-sm leading-relaxed" style={{ color: DARK }}>
              {user.selfDescription}
            </p>
          </div>
        )}

        {user.idealPartner && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: SUBTLE }}>
              Looking for
            </p>
            <p className="text-sm leading-relaxed" style={{ color: DARK }}>
              {user.idealPartner}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Prompt box ───────────────────────────────────────────────────────────────

function buildPrompt(a: MatchUser, b: MatchUser): string {
  return `Here are the two users you're introducing:

User A:
- Name: ${a.name}
- Age: ${a.age ?? "—"}
- College: ${a.college ?? "—"}
- About them: ${a.selfDescription ?? "—"}
- What they're looking for: ${a.idealPartner ?? "—"}

User B:
- Name: ${b.name}
- Age: ${b.age ?? "—"}
- College: ${b.college ?? "—"}
- About them: ${b.selfDescription ?? "—"}
- What they're looking for: ${b.idealPartner ?? "—"}

Write the match blurb. Address it to both of them (e.g. "Hey ${a.name} and ${b.name}...").`;
}

function PromptBox({ userA, userB }: { userA: MatchUser; userB: MatchUser }) {
  const [copied, setCopied] = useState(false);
  const prompt = buildPrompt(userA, userB);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-2xl border bg-white p-4"
      style={{ borderColor: "#EDE8F7" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SUBTLE }}>
          Prompt
        </p>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-violet-50"
          style={{ borderColor: "#C9B8D9", color: P }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        rows={12}
        className="w-full resize-none rounded-xl border bg-gray-50 p-3 text-xs font-mono leading-relaxed outline-none"
        style={{ borderColor: "#EDE8F7", color: DARK }}
      />
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({
  userA,
  userB,
  onCancel,
  onConfirm,
  confirming,
}: {
  userA: MatchUser;
  userB: MatchUser;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onCancel}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border bg-white shadow-2xl p-6"
        style={{ borderColor: "#EDE8F7" }}
      >
        <p className="text-base font-bold mb-1" style={{ color: DARK }}>
          Confirm Match
        </p>
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          {userA.name} + {userB.name}
        </p>

        <ul className="flex flex-col gap-2 mb-6">
          {[
            "Match record created in DB",
            "Both users opted out automatically",
            "Match emails sent with card image",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
              <Check size={14} className="shrink-0" style={{ color: "#166534" }} />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-gray-50"
            style={{ borderColor: "#C9B8D9", color: MUTED }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition"
            style={{
              background: confirming
                ? SUBTLE
                : "linear-gradient(135deg,#8F3A8F,#C060C0)",
              opacity: confirming ? 0.7 : 1,
            }}
          >
            {confirming ? "Matching…" : "Confirm Match"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-medium"
      style={{
        backgroundColor: type === "success" ? "#f0fdf4" : "#fef2f2",
        borderColor: type === "success" ? "#166534" : "#dc2626",
        color: type === "success" ? "#166534" : "#dc2626",
        maxWidth: 360,
      }}
    >
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onClose} className="shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Pool view (State 1) ──────────────────────────────────────────────────────

function PoolView({
  pool,
  loading,
  showUnmatchable,
  onToggleUnmatchable,
  onSelectUser,
}: {
  pool: PoolUser[];
  loading: boolean;
  showUnmatchable: boolean;
  onToggleUnmatchable: () => void;
  onSelectUser: (u: PoolUser) => void;
}) {
  const displayedPool = showUnmatchable ? pool : pool.filter((u) => u.candidateCount > 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: DARK }}>
            Opted-in Pool
          </h2>
          <p className="text-xs mt-0.5" style={{ color: SUBTLE }}>
            {loading ? "Loading…" : `${displayedPool.length} user${displayedPool.length !== 1 ? "s" : ""}`}
            {!showUnmatchable && !loading && pool.length !== displayedPool.length
              ? ` (${pool.length - displayedPool.length} unmatchable hidden)`
              : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showUnmatchable}
            onChange={onToggleUnmatchable}
            className="rounded border-gray-300"
          />
          <span className="text-xs font-medium" style={{ color: MUTED }}>
            Show unmatchable users
          </span>
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: SUBTLE }}>
            Loading…
          </p>
        </div>
      ) : displayedPool.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm font-medium" style={{ color: MUTED }}>
            No opted-in users match the current filters.
          </p>
          <p className="text-xs" style={{ color: SUBTLE }}>
            Try adjusting or resetting the filters above.
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {displayedPool.map((u) => (
            <PoolCard key={u.id} user={u} onClick={() => onSelectUser(u)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Match phase view (State 2) ───────────────────────────────────────────────

function MatchPhaseView({
  userA,
  candidates,
  candidateIndex,
  loading,
  s3CardUrl,
  onS3CardUrlChange,
  onBack,
  onPrev,
  onSkip,
  onMatch,
}: {
  userA: PoolUser;
  candidates: MatchUser[];
  candidateIndex: number;
  loading: boolean;
  s3CardUrl: string;
  onS3CardUrlChange: (v: string) => void;
  onBack: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onMatch: () => void;
}) {
  const currentCandidate = candidates[candidateIndex] ?? null;
  const exhausted = !loading && candidateIndex >= candidates.length && candidates.length > 0;
  const noResults = !loading && candidates.length === 0;

  return (
    <div className="h-full overflow-y-auto px-6 py-5 flex flex-col gap-5">
      {/* Two panels */}
      <div className="grid grid-cols-2 gap-4" style={{ minHeight: 480 }}>
        {/* User A — locked left */}
        <ProfilePanel user={userA} label="User A (locked)" labelColor={P} />

        {/* User B — cycling right */}
        {loading ? (
          <div
            className="rounded-2xl border bg-white flex items-center justify-center"
            style={{ borderColor: "#EDE8F7" }}
          >
            <p className="text-sm" style={{ color: SUBTLE }}>
              Loading candidates…
            </p>
          </div>
        ) : exhausted || noResults ? (
          <div
            className="rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 p-6"
            style={{ borderColor: "#EDE8F7" }}
          >
            <span className="text-3xl">🔍</span>
            <p className="text-sm font-semibold text-center" style={{ color: DARK }}>
              {noResults
                ? "No candidates found for this user."
                : "No more candidates for this user this week."}
            </p>
            <p className="text-xs text-center" style={{ color: SUBTLE }}>
              Try adjusting the filters or go back to choose someone else.
            </p>
          </div>
        ) : currentCandidate ? (
          <ProfilePanel user={currentCandidate} label="User B" labelColor="#166534" />
        ) : null}
      </div>

      {/* Prompt box (only when both users are available) */}
      {currentCandidate && !exhausted && !noResults && (
        <>
          <PromptBox userA={userA} userB={currentCandidate} />

          {/* S3 card URL input */}
          <div
            className="rounded-2xl border bg-white p-4"
            style={{ borderColor: "#EDE8F7" }}
          >
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: SUBTLE }}
            >
              Match Card Image URL (required to match)
            </label>
            <input
              type="url"
              value={s3CardUrl}
              onChange={(e) => onS3CardUrlChange(e.target.value)}
              placeholder="Paste S3 / CDN image URL…"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
              style={{ borderColor: s3CardUrl.trim() ? "#166534" : "#C9B8D9", color: DARK }}
            />
          </div>
        </>
      )}

      {/* Action bar */}
      <div
        className="flex items-center justify-between rounded-2xl border bg-white px-5 py-4 shrink-0"
        style={{ borderColor: "#EDE8F7" }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-50"
          style={{ borderColor: "#C9B8D9", color: MUTED }}
        >
          <ArrowLeft size={15} />
          Back to Pool
        </button>

        {/* Counter + navigation */}
        <div className="flex items-center gap-3">
          {!loading && candidates.length > 0 && (
            <span className="text-sm font-medium" style={{ color: SUBTLE }}>
              {Math.min(candidateIndex + 1, candidates.length)} of {candidates.length}
            </span>
          )}
          <button
            type="button"
            onClick={onPrev}
            disabled={candidateIndex === 0 || loading}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition"
            style={{
              borderColor: "#C9B8D9",
              color: MUTED,
              opacity: candidateIndex === 0 || loading ? 0.4 : 1,
              cursor: candidateIndex === 0 || loading ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={15} />
            Prev
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={exhausted || noResults || loading}
            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-50"
            style={{
              borderColor: "#C9B8D9",
              color: MUTED,
              opacity: exhausted || noResults || loading ? 0.4 : 1,
              cursor: exhausted || noResults || loading ? "not-allowed" : "pointer",
            }}
          >
            Skip
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Match button */}
        <button
          type="button"
          onClick={onMatch}
          disabled={exhausted || noResults || loading || !s3CardUrl.trim()}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition"
          style={{
            background:
              exhausted || noResults || loading || !s3CardUrl.trim()
                ? "#C9B8D9"
                : "linear-gradient(135deg,#166534,#15803d)",
            cursor:
              exhausted || noResults || loading || !s3CardUrl.trim() ? "not-allowed" : "pointer",
          }}
        >
          <Check size={15} />
          Match
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatchView({
  cities: allCities,
  colleges: allColleges,
}: {
  cities: string[];
  colleges: string[];
}) {
  const [filters, setFilters] = useState<Filters>({
    cities: [],
    gender: "",
    colleges: [],
    ageMin: "",
    ageMax: "",
  });

  const [pool, setPool] = useState<PoolUser[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [showUnmatchable, setShowUnmatchable] = useState(false);

  const [userA, setUserA] = useState<PoolUser | null>(null);
  const [candidates, setCandidates] = useState<MatchUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const [s3CardUrl, setS3CardUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [matching, setMatching] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Fetch pool ───────────────────────────────────────────────────────────────

  const fetchPool = useCallback(async () => {
    setPoolLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.cities.length) params.set("city", filters.cities.join(","));
      if (filters.colleges.length) params.set("college", filters.colleges.join(","));
      if (filters.ageMin) params.set("ageMin", filters.ageMin);
      if (filters.ageMax) params.set("ageMax", filters.ageMax);
      const res = await fetch(`/api/admin/match/pool?${params}`, { credentials: "include" });
      const json = await res.json();
      setPool(json.data ?? []);
    } catch {
      setToast({ type: "error", msg: "Failed to load pool" });
    } finally {
      setPoolLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  // ── Fetch candidates ─────────────────────────────────────────────────────────

  const fetchCandidates = useCallback(
    async (aId: string) => {
      setCandidatesLoading(true);
      setCandidates([]);
      setCandidateIndex(0);
      try {
        const params = new URLSearchParams({ userId: aId });
        if (filters.cities.length) params.set("city", filters.cities.join(","));
        if (filters.colleges.length) params.set("college", filters.colleges.join(","));
        if (filters.ageMin) params.set("ageMin", filters.ageMin);
        if (filters.ageMax) params.set("ageMax", filters.ageMax);
        const res = await fetch(`/api/admin/match/candidates?${params}`, {
          credentials: "include",
        });
        const json = await res.json();
        setCandidates(json.data ?? []);
      } catch {
        setToast({ type: "error", msg: "Failed to load candidates" });
      } finally {
        setCandidatesLoading(false);
      }
    },
    [filters],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  function selectUserA(user: PoolUser) {
    setUserA(user);
    setS3CardUrl("");
    fetchCandidates(user.id);
  }

  function backToPool() {
    setUserA(null);
    setCandidates([]);
    setCandidateIndex(0);
    setS3CardUrl("");
  }

  function skip() {
    setCandidateIndex((i) => i + 1);
  }

  function prev() {
    setCandidateIndex((i) => Math.max(0, i - 1));
  }

  async function handleConfirmMatch() {
    const currentCandidate = candidates[candidateIndex];
    if (!userA || !currentCandidate || !s3CardUrl.trim()) return;
    setMatching(true);
    try {
      const res = await fetch("/api/admin/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userAId: userA.id,
          userBId: currentCandidate.id,
          s3CardUrl: s3CardUrl.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", msg: json?.error?.message ?? "Match failed" });
        return;
      }
      setShowModal(false);
      setToast({ type: "success", msg: `Match created: ${userA.name} + ${currentCandidate.name} ✓` });
      backToPool();
      fetchPool();
    } catch {
      setToast({ type: "error", msg: "Match failed — please try again" });
    } finally {
      setMatching(false);
    }
  }

  const currentCandidate = candidates[candidateIndex] ?? null;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: BG }}>
      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Confirm modal */}
      {showModal && userA && currentCandidate && (
        <ConfirmModal
          userA={userA}
          userB={currentCandidate}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmMatch}
          confirming={matching}
        />
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        allCities={allCities}
        allColleges={allColleges}
        onChange={setFilters}
        onReset={() =>
          setFilters({ cities: [], gender: "", colleges: [], ageMin: "", ageMax: "" })
        }
      />

      {/* Page header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-1 shrink-0">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            {userA ? `Matching: ${userA.name}` : "Matchmaking"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: SUBTLE }}>
            {userA
              ? "Select a candidate on the right, then click Match."
              : "Select a user from the pool to start matching."}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {userA === null ? (
          <PoolView
            pool={pool}
            loading={poolLoading}
            showUnmatchable={showUnmatchable}
            onToggleUnmatchable={() => setShowUnmatchable((v) => !v)}
            onSelectUser={selectUserA}
          />
        ) : (
          <MatchPhaseView
            userA={userA}
            candidates={candidates}
            candidateIndex={candidateIndex}
            loading={candidatesLoading}
            s3CardUrl={s3CardUrl}
            onS3CardUrlChange={setS3CardUrl}
            onBack={backToPool}
            onPrev={prev}
            onSkip={skip}
            onMatch={() => setShowModal(true)}
          />
        )}
      </div>
    </div>
  );
}
