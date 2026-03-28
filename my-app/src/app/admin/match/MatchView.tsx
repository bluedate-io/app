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
  candidateGenders: string[];
  colleges: string[];
  ageMin: string;
  ageMax: string;
  search: string;
  relationshipIntent: string;
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
  photos: string[];
  nickname?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  onboardingCompleted?: boolean;
  optInStatus?: string | null;
  optedInAt?: string | null;
  genderPreference?: string[];
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  relationshipIntent?: string | null;
  relationshipGoals?: string[];
  heightCm?: number | null;
  heightCompleted?: boolean;
  wantDate?: boolean | null;
  datingModeCompleted?: boolean;
  photosStepCompleted?: boolean;
  hobbies?: string[];
  favouriteActivities?: string[];
  musicTaste?: string[];
  foodTaste?: string[];
  bffInterests?: string[];
  bffInterestsCompleted?: boolean;
  smokingHabit?: string | null;
  drinkingHabit?: string | null;
  funFact?: string | null;
  kidsStatus?: string | null;
  kidsPreference?: string | null;
  religion?: string[];
  politics?: string[];
  importantLifeCompleted?: boolean;
  familyPlansCompleted?: boolean;
  lifeExperiences?: string[];
  lifeExperiencesCompleted?: boolean;
  relationshipStatus?: string | null;
  relationshipStatusCompleted?: boolean;
  availabilityDays?: string[];
  availabilityTimes?: string[];
  idealDate?: string | null;
  weeklyOptIns?: Array<{
    weekStart: string;
    mode: string;
    description: string | null;
    createdAt: string;
  }>;
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
  active,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  active?: boolean;
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

  const isActive = active ?? selected.length > 0;

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition whitespace-nowrap"
        style={{
          borderColor: isActive ? P : "#C9B8D9",
          color: isActive ? P : MUTED,
          backgroundColor: isActive ? P_LIGHT : "#FAF5FC",
        }}
      >
        {label}
        {isActive ? ` (${selected.length})` : ""}
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
          {selected.length > 0 && (
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
  draft,
  applied,
  allCities,
  allColleges,
  showUserAGenderFilter,
  showCandidateGender,
  onDraftChange,
  onApply,
  onClear,
}: {
  draft: Filters;
  applied: Filters;
  allCities: string[];
  allColleges: string[];
  showUserAGenderFilter: boolean;
  showCandidateGender: boolean;
  onDraftChange: (f: Filters) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const appliedHasAny =
    Boolean(applied.gender) ||
    applied.cities.length > 0 ||
    applied.candidateGenders.length > 0 ||
    applied.colleges.length > 0 ||
    Boolean(applied.ageMin) ||
    Boolean(applied.ageMax) ||
    Boolean(applied.search.trim()) ||
    Boolean(applied.relationshipIntent);

  const ageApplied = Boolean(applied.ageMin) || Boolean(applied.ageMax);
  const intentLabel = showCandidateGender ? "B intent" : "A intent";

  return (
    <div
      className="shrink-0 border-b bg-white px-6 py-3.5"
      style={{ borderColor: "#EDE8F7" }}
    >
      {/* Row 1: filters + actions — single baseline, consistent control height (h-10) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div
          className="flex h-10 items-center pr-1"
          title="Filter the list below, then click Apply"
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{ color: SUBTLE }}
          >
            Filters
          </span>
        </div>

        <MultiSelectDropdown
          label="City"
          options={allCities}
          selected={draft.cities}
          onChange={(v) => onDraftChange({ ...draft, cities: v })}
          active={applied.cities.length > 0}
        />

        {showUserAGenderFilter && (
          <select
            value={draft.gender}
            onChange={(e) => onDraftChange({ ...draft, gender: e.target.value })}
            className="h-10 shrink-0 rounded-xl border px-3 text-xs font-semibold cursor-pointer"
            style={{
              borderColor: applied.gender ? P : "#C9B8D9",
              color: applied.gender ? P : MUTED,
              backgroundColor: applied.gender ? P_LIGHT : "#FAF5FC",
            }}
          >
            <option value="">User A: All genders</option>
            <option value="Woman">Woman</option>
            <option value="Man">Man</option>
            <option value="Nonbinary">Nonbinary</option>
          </select>
        )}

        {showCandidateGender && (
          <MultiSelectDropdown
            label="User B: Gender"
            options={["Woman", "Man", "Nonbinary"]}
            selected={draft.candidateGenders}
            onChange={(v) => onDraftChange({ ...draft, candidateGenders: v })}
            active={applied.candidateGenders.length > 0}
          />
        )}

        <div
          className="flex h-10 min-w-0 max-w-[min(100%,14rem)] shrink-0 items-center gap-2 rounded-xl border px-2.5"
          style={{
            borderColor: applied.relationshipIntent ? P : "#C9B8D9",
            backgroundColor: applied.relationshipIntent ? P_LIGHT : "#FAF5FC",
          }}
        >
          <span
            className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide sm:inline"
            style={{ color: SUBTLE }}
          >
            {intentLabel}
          </span>
          <select
            value={draft.relationshipIntent}
            onChange={(e) => onDraftChange({ ...draft, relationshipIntent: e.target.value })}
            aria-label={`Relationship intent for ${showCandidateGender ? "User B" : "User A"}`}
            className="min-w-0 flex-1 cursor-pointer rounded-md border-0 bg-transparent py-1 text-xs font-semibold focus:outline-none focus:ring-0"
            style={{
              color: applied.relationshipIntent ? P : MUTED,
            }}
          >
            <option value="">All modes</option>
            <option value="date">Date</option>
            <option value="friendship">Friendship (BFF)</option>
          </select>
        </div>

        <MultiSelectDropdown
          label="College"
          options={allColleges}
          selected={draft.colleges}
          onChange={(v) => onDraftChange({ ...draft, colleges: v })}
          active={applied.colleges.length > 0}
        />

        <div
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl border px-2.5"
          style={{
            borderColor: ageApplied ? P : "#C9B8D9",
            backgroundColor: ageApplied ? P_LIGHT : "#FFFFFF",
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: SUBTLE }}
          >
            Age
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum age"
            title="Minimum age"
            value={draft.ageMin}
            onChange={(e) => onDraftChange({ ...draft, ageMin: e.target.value })}
            className="w-13 shrink-0 rounded-lg border px-1.5 py-1 text-center text-xs tabular-nums"
            style={{
              borderColor: applied.ageMin ? P : "#E5DCF0",
              color: DARK,
              backgroundColor: applied.ageMin ? P_LIGHT : "#FFFFFF",
            }}
            min={18}
            max={99}
          />
          <span className="text-xs font-medium tabular-nums" style={{ color: MUTED }}>
            –
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum age"
            title="Maximum age"
            value={draft.ageMax}
            onChange={(e) => onDraftChange({ ...draft, ageMax: e.target.value })}
            className="w-13 shrink-0 rounded-lg border px-1.5 py-1 text-center text-xs tabular-nums"
            style={{
              borderColor: applied.ageMax ? P : "#E5DCF0",
              color: DARK,
              backgroundColor: applied.ageMax ? P_LIGHT : "#FFFFFF",
            }}
            min={18}
            max={99}
          />
        </div>

        <div className="mx-0.5 hidden h-6 w-px self-center sm:block" style={{ backgroundColor: "#E8DEF5" }} />

        <button
          type="button"
          onClick={onApply}
          className="flex h-10 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition hover:opacity-90"
          style={{
            borderColor: P,
            color: P,
            backgroundColor: "#FAF5FC",
          }}
        >
          Apply
          <Check size={12} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onClear}
          className="flex h-10 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition hover:opacity-90"
          style={{
            borderColor: appliedHasAny ? P : "#C9B8D9",
            color: appliedHasAny ? P : MUTED,
            backgroundColor: appliedHasAny ? P_LIGHT : "#FAF5FC",
          }}
        >
          <RotateCcw size={12} strokeWidth={2} />
          Clear
        </button>
      </div>

      {/* Row 2: search — full width, aligned with filter column */}
      <div className="mt-3 flex w-full max-w-3xl items-center gap-2 sm:gap-3">
        <span
          className="w-11 shrink-0 text-right text-[10px] font-bold uppercase tracking-widest sm:w-14 sm:text-[11px] sm:tracking-[0.12em]"
          style={{ color: SUBTLE }}
        >
          Search
        </span>
        <input
          type="search"
          placeholder={
            showCandidateGender
              ? "Search User B by name or email"
              : "Search User A by name or email"
          }
          value={draft.search}
          maxLength={120}
          onChange={(e) => onDraftChange({ ...draft, search: e.target.value })}
          className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm"
          style={{
            borderColor: applied.search.trim() ? P : "#C9B8D9",
            color: DARK,
            backgroundColor: applied.search.trim() ? P_LIGHT : "#FFFFFF",
          }}
        />
      </div>
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
          {user.photos[0] ? (
            <Image
              src={user.photos[0]}
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
  headerRight,
}: {
  user: MatchUser;
  label: string;
  labelColor: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: "#EDE8F7" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: "#F0EBFA", backgroundColor: `${labelColor}10` }}
      >
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: labelColor }}>
          {label}
        </span>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Photo grid */}
        {user.photos.length > 0 ? (
          <div
            className={`grid gap-0.5 ${user.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {user.photos.map((url, i) => (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{ aspectRatio: "4/5" }}
              >
                <img
                  src={url}
                  alt={`${user.name} photo ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Name + details overlay on first photo */}
                {i === 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0 z-10 p-3"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.0) 100%)",
                    }}
                  >
                    <p className="font-bold text-sm leading-tight text-white">
                      {user.name}
                    </p>
                    <p className="text-xs mt-0.5 text-white/85">
                      {[
                        user.age != null ? `${user.age} yrs` : null,
                        user.gender,
                        user.city,
                        user.college,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2"
            style={{ height: 200 }}
          >
            <span className="text-5xl">👤</span>
            <p className="font-bold text-sm" style={{ color: DARK }}>{user.name}</p>
            <p className="text-xs" style={{ color: MUTED }}>
              {[
                user.age != null ? `${user.age} yrs` : null,
                user.gender,
                user.city,
                user.college,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        )}

        {/* Opt-in description */}
        {(() => {
          const desc = user.weeklyOptIns?.find((w) => w.description)?.description;
          return desc ? (
            <div className="px-4 py-3 border-b" style={{ borderColor: "#F0EBFA" }}>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: SUBTLE }}
              >
                Described Type
              </p>
              <p className="text-sm leading-relaxed" style={{ color: DARK }}>
                {desc}
              </p>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ─── Prompt box ───────────────────────────────────────────────────────────────

function buildPrompt(a: MatchUser, b: MatchUser): string {
  const value = (v: unknown) => {
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };
  const list = (arr?: string[]) => (arr && arr.length ? arr.join(", ") : "—");
  const bool = (v?: boolean | null) => (v === null || v === undefined ? "—" : v ? "Yes" : "No");
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
  };

  const weekly = (u: MatchUser) =>
    u.weeklyOptIns && u.weeklyOptIns.length > 0
      ? u.weeklyOptIns
          .map(
            (w, i) =>
              `${i + 1}. weekStart=${fmtDate(w.weekStart)}, mode=${value(w.mode)}, description=${value(w.description)}, createdAt=${fmtDate(w.createdAt)}`,
          )
          .join("\n")
      : "—";

  const userBlock = (label: string, u: MatchUser) => `${label}:
- name: ${value(u.name)}
- age: ${value(u.age)}
- dateOfBirth: ${fmtDate(u.dateOfBirth)}
- city: ${value(u.city)}
- college: ${value(u.college)}
- genderIdentity: ${value(u.gender)}
- genderPreference: ${list(u.genderPreference)}
- optInStatus: ${value(u.optInStatus)}
- optedInAt: ${fmtDate(u.optedInAt)}
- relationshipIntent: ${value(u.relationshipIntent)}
- heightCm: ${value(u.heightCm)}
- wantDate: ${bool(u.wantDate)}
- hobbies: ${list(u.hobbies)}
- bffInterests: ${list(u.bffInterests)}
- smokingHabit: ${value(u.smokingHabit)}
- drinkingHabit: ${value(u.drinkingHabit)}
- religion: ${list(u.religion)}
- politics: ${list(u.politics)}
- availabilityDays: ${list(u.availabilityDays)}
- availabilityTimes: ${list(u.availabilityTimes)}
- weeklyOptIns:
${weekly(u)}`;

  return `Here are the two users you're introducing:

${userBlock("User A", a)}

${userBlock("User B", b)}

Write the match blurb. Address it to both of them (e.g. "${a.name} and ${b.name}...").`;
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
  const noResults = !loading && candidates.length === 0;
  const total = candidates.length;
  const position = total > 0 ? Math.min(candidateIndex + 1, total) : 0;

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
        ) : noResults ? (
          <div
            className="rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 p-6"
            style={{ borderColor: "#EDE8F7" }}
          >
            <span className="text-3xl">🔍</span>
            <p className="text-sm font-semibold text-center" style={{ color: DARK }}>
              No candidates found for this user.
            </p>
            <p className="text-xs text-center" style={{ color: SUBTLE }}>
              Try adjusting the filters or go back to choose someone else.
            </p>
          </div>
        ) : currentCandidate ? (
          <ProfilePanel
            user={currentCandidate}
            label="User B"
            labelColor="#166534"
          />
        ) : null}
      </div>

      {/* User B navigation (below users) */}
      {!loading && currentCandidate && !noResults && (
        <div className="grid grid-cols-2 gap-4">
          <div />
          <div
            className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3"
            style={{ borderColor: "#EDE8F7" }}
          >
            <span className="text-sm font-semibold" style={{ color: SUBTLE }}>
              {total > 0 ? `${position}/${total}` : "—"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={noResults || loading}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-violet-50"
                style={{
                  borderColor: "#C9B8D9",
                  color: MUTED,
                  opacity: noResults || loading ? 0.4 : 1,
                  cursor: noResults || loading ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <button
                type="button"
                onClick={onSkip}
                disabled={noResults || loading}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-violet-50"
                style={{
                  borderColor: "#C9B8D9",
                  color: MUTED,
                  opacity: noResults || loading ? 0.4 : 1,
                  cursor: noResults || loading ? "not-allowed" : "pointer",
                }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt box (only when both users are available) */}
      {currentCandidate && !noResults && (
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

        {/* Match button */}
        <button
          type="button"
          onClick={onMatch}
              disabled={noResults || loading || !s3CardUrl.trim()}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition"
          style={{
            background:
                  noResults || loading || !s3CardUrl.trim()
                ? "#C9B8D9"
                : "linear-gradient(135deg,#166534,#15803d)",
            cursor:
                  noResults || loading || !s3CardUrl.trim() ? "not-allowed" : "pointer",
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
  const [draftFilters, setDraftFilters] = useState<Filters>({
    cities: [],
    gender: "",
    candidateGenders: [],
    colleges: [],
    ageMin: "",
    ageMax: "",
    search: "",
    relationshipIntent: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    cities: [],
    gender: "",
    candidateGenders: [],
    colleges: [],
    ageMin: "",
    ageMax: "",
    search: "",
    relationshipIntent: "",
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

  const fetchPool = useCallback(async (f: Filters) => {
    setPoolLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.gender) params.set("gender", f.gender);
      if (f.cities.length) params.set("city", f.cities.join(","));
      if (f.colleges.length) params.set("college", f.colleges.join(","));
      if (f.ageMin) params.set("ageMin", f.ageMin);
      if (f.ageMax) params.set("ageMax", f.ageMax);
      if (f.search.trim()) params.set("search", f.search.trim());
      if (f.relationshipIntent === "date" || f.relationshipIntent === "friendship") {
        params.set("relationshipIntent", f.relationshipIntent);
      }
      const res = await fetch(`/api/admin/match/pool?${params}`, { credentials: "include" });
      const json = await res.json();
      setPool(json.data ?? []);
    } catch {
      setToast({ type: "error", msg: "Failed to load pool" });
    } finally {
      setPoolLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPool(appliedFilters);
  }, [fetchPool, appliedFilters]);

  // ── Fetch candidates ─────────────────────────────────────────────────────────

  const fetchCandidates = useCallback(
    async (aId: string, f: Filters) => {
      setCandidatesLoading(true);
      setCandidates([]);
      setCandidateIndex(0);
      try {
        const params = new URLSearchParams({ userId: aId });
        if (f.cities.length) params.set("city", f.cities.join(","));
        if (f.candidateGenders.length) params.set("gender", f.candidateGenders.join(","));
        if (f.colleges.length) params.set("college", f.colleges.join(","));
        if (f.ageMin) params.set("ageMin", f.ageMin);
        if (f.ageMax) params.set("ageMax", f.ageMax);
        if (f.search.trim()) params.set("search", f.search.trim());
        if (f.relationshipIntent === "date" || f.relationshipIntent === "friendship") {
          params.set("relationshipIntent", f.relationshipIntent);
        }
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
    [],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  function applyFilters() {
    const next = draftFilters;
    setAppliedFilters(next);
    if (userA) fetchCandidates(userA.id, next);
    else fetchPool(next);
  }

  function clearFilters() {
    const cleared: Filters = {
      cities: [],
      gender: "",
      candidateGenders: [],
      colleges: [],
      ageMin: "",
      ageMax: "",
      search: "",
      relationshipIntent: "",
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
    if (userA) fetchCandidates(userA.id, cleared);
    else fetchPool(cleared);
  }

  function normalizeGender(v: string): "Woman" | "Man" | "Nonbinary" | null {
    const s = v.trim().toLowerCase();
    if (s === "woman" || s === "women") return "Woman";
    if (s === "man" || s === "men") return "Man";
    if (s === "nonbinary" || s === "non-binary" || s === "nb") return "Nonbinary";
    return null;
  }

  function selectUserA(user: PoolUser) {
    setUserA(user);
    setS3CardUrl("");
    const college = (user.college ?? "").trim();
    const defaultCandidateGenders = (user.genderPreference ?? [])
      .map((g) => normalizeGender(g))
      .filter((g): g is "Woman" | "Man" | "Nonbinary" => Boolean(g));

    const intentForB =
      user.relationshipIntent === "date" || user.relationshipIntent === "friendship"
        ? user.relationshipIntent
        : appliedFilters.relationshipIntent;

    const next: Filters = {
      ...appliedFilters,
      candidateGenders: defaultCandidateGenders,
      colleges: college ? [college] : [],
      search: "",
      relationshipIntent: intentForB,
    };
    setDraftFilters((d) => ({
      ...d,
      candidateGenders: next.candidateGenders,
      colleges: next.colleges,
      search: "",
      relationshipIntent: intentForB,
    }));
    setAppliedFilters(next);
    fetchCandidates(user.id, next);
  }

  function backToPool() {
    setUserA(null);
    setCandidates([]);
    setCandidateIndex(0);
    setS3CardUrl("");
    setDraftFilters((prev) => ({ ...prev, colleges: [], search: "", relationshipIntent: "" }));
    setAppliedFilters((prev) => ({ ...prev, colleges: [], search: "", relationshipIntent: "" }));
  }

  function skip() {
    setCandidateIndex((i) => {
      const n = candidates.length;
      if (n <= 0) return 0;
      return (i + 1) % n;
    });
  }

  function prev() {
    setCandidateIndex((i) => {
      const n = candidates.length;
      if (n <= 0) return 0;
      return (i - 1 + n) % n;
    });
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
      const cleared: Filters = {
        cities: [],
        gender: "",
        candidateGenders: [],
        colleges: [],
        ageMin: "",
        ageMax: "",
        search: "",
        relationshipIntent: "",
      };
      setUserA(null);
      setCandidates([]);
      setCandidateIndex(0);
      setS3CardUrl("");
      setDraftFilters(cleared);
      setAppliedFilters(cleared);
      fetchPool(cleared);
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
        draft={draftFilters}
        applied={appliedFilters}
        allCities={allCities}
        allColleges={allColleges}
        showUserAGenderFilter={userA === null}
        showCandidateGender={userA !== null}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
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
