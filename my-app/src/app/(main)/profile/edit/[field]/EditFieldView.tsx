"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import {
  INTEREST_SYMBOLS,
  SUGGESTED_INTERESTS,
  SUGGESTED_INTERESTS_SET,
} from "@/domains/suggestedInterests";
import type { EditField } from "./page";
import type { ProfileData } from "../../page";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const CARD = "#fff";
const SERIF = "var(--font-playfair, Georgia, serif)";
const SANS = "var(--font-geist-sans, sans-serif)";

// ─── Config ───────────────────────────────────────────────────────────────────

const FIELD_TITLES: Record<EditField, string> = {
  basics: "Edit Profile",
  photos: "My Photos",
  interests: "Interests",
  gender: "Gender",
  "gender-preference": "Who to meet",
  "relationship-intent": "I'm here for",
  "looking-for": "Looking For",
  height: "Height",
  drinking: "Drinking",
  religion: "Religion",
  family: "Family Plans",
};

const RELATIONSHIP_GOALS = [
  "Casual dates",
  "Long-term relationship",
  "Marriage",
  "Not sure yet",
  "Friendship",
];

const DRINKING_OPTIONS = [
  { value: "Social", label: "Social drinker", desc: "A few drinks out" },
  { value: "Sometimes", label: "Sometimes", desc: "Occasionally, rarely" },
  { value: "I'm sober", label: "I'm sober", desc: "Alcohol-free lifestyle" },
];

const RELIGION_OPTIONS = [
  "Agnostic", "Atheist", "Buddhist", "Catholic", "Christian",
  "Hindu", "Jain", "Jewish", "Mormon", "Muslim",
  "Sikh", "Spiritual", "Zoroastrian", "Other",
];

const KIDS_STATUS_OPTIONS = [
  { value: "Don't have kids", label: "No kids" },
  { value: "Have kids", label: "Have kids" },
];

const KIDS_PLAN_OPTIONS = [
  "Want kids", "Open to kids", "Don't want kids", "Not sure",
];

const MAX_INTERESTS_ONBOARDING = 5;

const GENDER_OPTIONS = ["Woman", "Man", "Nonbinary"];

// ─── Shared components ────────────────────────────────────────────────────────

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "20px 20px 16px",
        borderBottom: `2px solid ${DARK}`,
        background: BG,
      }}
    >
      <button
        onClick={onBack}
        style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: CARD, border: `2px solid ${DARK}`,
          boxShadow: `2px 2px 0 ${DARK}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={18} color={DARK} />
      </button>
      <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: DARK, margin: 0 }}>
        {title}
      </h1>
    </div>
  );
}

function SaveBtn({ loading, onClick, disabled }: { loading: boolean; onClick: () => void; disabled?: boolean }) {
  const isDisabled = loading || !!disabled;
  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <button
        onClick={onClick}
        disabled={isDisabled}
        style={{
          width: "100%", padding: "16px",
          background: isDisabled ? `${DARK}80` : DARK,
          color: BG, fontFamily: SANS, fontSize: 15, fontWeight: 700,
          border: `2.5px solid ${DARK}`, borderRadius: 14,
          boxShadow: isDisabled ? "none" : `4px 4px 0 ${ACCENT}`,
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          letterSpacing: 0.2,
        }}
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

/** Pill chip — matches onboarding `Pill` for interests */
function InterestPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-all"
      style={{
        borderRadius: 999,
        border: `2px solid ${selected ? ACCENT : DARK}`,
        boxShadow: `1.5px 1.5px 0 ${selected ? ACCENT : DARK}`,
        backgroundColor: selected ? `${ACCENT}15` : "#fff",
        color: selected ? ACCENT : DARK,
      }}
    >
      {label}
      {!selected && <span style={{ color: "#9B8B78", fontSize: 15, lineHeight: 1 }}>+</span>}
    </button>
  );
}

function Chip({
  label, selected, onToggle,
}: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
        fontFamily: SANS, cursor: "pointer", transition: "all 0.1s",
        background: selected ? DARK : CARD,
        color: selected ? BG : DARK,
        border: `2px solid ${selected ? DARK : `${DARK}40`}`,
        boxShadow: selected ? `2px 2px 0 ${ACCENT}` : "none",
      }}
    >
      {label}
    </button>
  );
}

function OptionRow({
  label, desc, selected, onSelect,
}: { label: string; desc?: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderRadius: 14, textAlign: "left", cursor: "pointer",
        background: selected ? BG : CARD,
        border: `2px solid ${selected ? DARK : `${DARK}20`}`,
        boxShadow: selected ? `3px 3px 0 ${DARK}` : "none",
        transition: "all 0.1s",
        fontFamily: SANS,
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: DARK, margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{desc}</p>}
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginLeft: 12,
        background: selected ? DARK : "transparent",
        border: `2px solid ${selected ? DARK : `${DARK}40`}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <Check size={12} color={BG} strokeWidth={3} />}
      </div>
    </button>
  );
}

// ─── Field editors ────────────────────────────────────────────────────────────

function BasicsEditor({
  initialName, initialCity, initialBio, initialDob, onSave, loading, errorMessage,
}: {
  initialName?: string; initialCity?: string; initialBio?: string;
  initialDob?: string | Date | null; onSave: (v: { fullName: string; city: string; bio: string; dateOfBirth: string }) => void;
  loading: boolean;
  errorMessage?: string | null;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [cityError, setCityError] = useState<string | null>(null);

  function formatDateOfBirth(value: string | Date | null | undefined): string {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return "";
  }

  function handleSave() {
    const trimmedCity = city.trim();
    if (trimmedCity.length < 2) {
      setCityError("City is required (at least 2 characters).");
      return;
    }
    setCityError(null);
    onSave({
      fullName: name,
      city: trimmedCity,
      bio,
      dateOfBirth: formatDateOfBirth(initialDob),
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", fontSize: 15, fontWeight: 500,
    background: CARD, border: `2px solid ${DARK}`, borderRadius: 12,
    boxShadow: `2px 2px 0 ${DARK}`, outline: "none", color: DARK,
    fontFamily: SANS, boxSizing: "border-box",
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 20px 8px" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", fontFamily: SANS }}>Full Name</p>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" maxLength={80} style={inputStyle} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", fontFamily: SANS }}>City</p>
          <input
            type="text"
            value={city}
            onChange={e => {
              setCity(e.target.value);
              if (cityError) setCityError(null);
            }}
            placeholder="Where do you live?"
            maxLength={80}
            style={inputStyle}
          />
          {cityError && (
            <p style={{ fontSize: 12, color: "#B33A1B", margin: "6px 2px 0", fontFamily: SANS }}>
              {cityError}
            </p>
          )}
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px", fontFamily: SANS }}>Bio</p>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people a bit about yourself…" maxLength={500} rows={4}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
          <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0", textAlign: "right", fontFamily: SANS }}>{bio.length}/500</p>
        </div>
      </div>
      {errorMessage && (
        <p style={{ fontSize: 12, color: "#B33A1B", margin: "4px 22px 0", fontFamily: SANS }}>
          {errorMessage}
        </p>
      )}
      <SaveBtn loading={loading} onClick={handleSave} />
    </>
  );
}

function InterestsEditor({
  initial,
  onSave,
  loading,
}: {
  initial: string[];
  onSave: (v: string[]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(() => initial.filter(Boolean));
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? SUGGESTED_INTERESTS.filter((i) => i.toLowerCase().includes(search.trim().toLowerCase()))
    : [...SUGGESTED_INTERESTS];

  const extraSelected = selected.filter((s) => !SUGGESTED_INTERESTS_SET.has(s));

  function toggleSuggested(interest: string) {
    setSelected((p) => {
      if (p.includes(interest)) return p.filter((x) => x !== interest);
      if (p.length >= MAX_INTERESTS_ONBOARDING) return p;
      return [...p, interest];
    });
  }

  function handleSave() {
    if (selected.length < 1 || selected.length > MAX_INTERESTS_ONBOARDING) return;
    onSave(selected);
  }

  const canSave = selected.length >= 1 && selected.length <= MAX_INTERESTS_ONBOARDING;

  return (
    <>
      <div className="flex flex-col flex-1 px-5 pt-4 pb-2">
        <div className="flex justify-start mb-6">
          <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black leading-tight mb-2" style={{ fontFamily: SERIF, color: DARK }}>
          Choose 5 things you&apos;re really into
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Add interests to help you match with people who love them too.
        </p>

        {extraSelected.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">On your profile</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {extraSelected.map((interest) => (
                <InterestPill
                  key={interest}
                  label={interest}
                  selected
                  onClick={() => setSelected((p) => p.filter((x) => x !== interest))}
                />
              ))}
            </div>
          </>
        )}

        <div className="relative mb-5">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="What are you into?"
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
          />
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">You might like...</p>

        <div className="flex flex-wrap gap-2">
          {filtered.map((interest) => {
            const isSelected = selected.includes(interest);
            const symbol = INTEREST_SYMBOLS[interest] ?? "•";
            const displayLabel = `${symbol} ${interest}`;
            return (
              <InterestPill
                key={interest}
                label={displayLabel}
                selected={isSelected}
                onClick={() => toggleSuggested(interest)}
              />
            );
          })}
        </div>

        <p className="text-sm text-gray-400 mt-6">{selected.length}/{MAX_INTERESTS_ONBOARDING} selected</p>

        {selected.length > MAX_INTERESTS_ONBOARDING && (
          <p style={{ fontSize: 12, color: "#B33A1B", marginTop: 8, fontFamily: SANS }}>
            Remove interests until you have at most {MAX_INTERESTS_ONBOARDING} to save (same as when you signed up).
          </p>
        )}
        {selected.length === 0 && (
          <p style={{ fontSize: 12, color: MUTED, marginTop: 8, fontFamily: SANS }}>
            Select at least one interest to save.
          </p>
        )}
      </div>
      <SaveBtn loading={loading} disabled={!canSave} onClick={handleSave} />
    </>
  );
}

function LookingForEditor({ initial, onSave, loading }: { initial: string[]; onSave: (v: string[]) => void; loading: boolean }) {
  const [selected, setSelected] = useState<string[]>(initial);
  function toggle(v: string) {
    setSelected(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px 8px" }}>
        {RELATIONSHIP_GOALS.map(g => (
          <OptionRow key={g} label={g} selected={selected.includes(g)} onSelect={() => toggle(g)} />
        ))}
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(selected)} />
    </>
  );
}

function GenderEditor({
  initial,
  genderUpdateCount,
  onSave,
  loading,
  errorMessage,
}: {
  initial?: string;
  genderUpdateCount?: number;
  onSave: (v: string) => void;
  loading: boolean;
  errorMessage?: string | null;
}) {
  const [selected, setSelected] = useState(initial ?? "");
  const count = genderUpdateCount ?? 0;
  const remaining = Math.max(0, 2 - count);
  const isLocked = count >= 2;
  const lockMessage = "You updated gender too many times, please contact admin to change the gender.";

  function handleSave() {
    if (isLocked || !selected) return;
    onSave(selected);
  }

  return (
    <>
      <div style={{ padding: "16px 20px 8px" }}>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 14px" }}>
          Choose the gender that best describes you.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {GENDER_OPTIONS.map((option) => (
            <OptionRow
              key={option}
              label={option}
              selected={selected === option}
              onSelect={() => {
                if (!isLocked) setSelected(option);
              }}
            />
          ))}
        </div>
      </div>
      {isLocked ? (
        <p style={{ fontSize: 12, color: "#B33A1B", margin: "4px 22px 0", fontFamily: SANS }}>
          {lockMessage}
        </p>
      ) : (
        <p style={{ fontSize: 12, color: MUTED, margin: "4px 22px 0", fontFamily: SANS }}>
          You can update gender {remaining} more time{remaining === 1 ? "" : "s"}.
        </p>
      )}
      {errorMessage && (
        <p style={{ fontSize: 12, color: "#B33A1B", margin: "6px 22px 0", fontFamily: SANS }}>
          {errorMessage}
        </p>
      )}
      <SaveBtn loading={loading} disabled={isLocked || !selected} onClick={handleSave} />
    </>
  );
}

const GP_PREF_OPTIONS = ["Men", "Women", "Nonbinary people"] as const;
const GP_PREF_DEFAULT_ALL: string[] = [...GP_PREF_OPTIONS];

function deriveGenderPreferenceUiState(pref: string[] | null | undefined): {
  openToAll: boolean;
  selection: string[];
} {
  const p = pref?.filter(Boolean) ?? [];
  if (p.length === 0) return { openToAll: false, selection: [] };
  const hasFullSet = GP_PREF_DEFAULT_ALL.every((x) => p.includes(x));
  if (hasFullSet) return { openToAll: true, selection: [] };
  const selection = GP_PREF_OPTIONS.filter((x) => p.includes(x));
  return { openToAll: false, selection };
}

function GpInfoLine({ text }: { text: string }) {
  return (
    <p className="text-sm mt-5 flex items-start gap-1.5" style={{ color: "#9B8B78" }}>
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" strokeWidth={2} />
      </svg>
      {text}
    </p>
  );
}

function GenderPreferenceEditor({
  initialPreference,
  onSave,
  loading,
  errorMessage,
}: {
  initialPreference: string[] | undefined | null;
  onSave: (payload: { genderPreference: string[] }) => void;
  loading: boolean;
  errorMessage?: string | null;
}) {
  const initial = deriveGenderPreferenceUiState(initialPreference ?? undefined);
  const [openToAll, setOpenToAll] = useState(initial.openToAll);
  const [selection, setSelection] = useState<string[]>(initial.selection);

  const canSave = openToAll || selection.length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      genderPreference: openToAll ? GP_PREF_DEFAULT_ALL : [...selection],
    });
  }

  return (
    <>
      <div className="flex flex-col flex-1 px-5 pt-4 pb-2">
        <div className="flex justify-start mb-6">
          <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z"
            />
          </svg>
        </div>
        <h1
          className="text-3xl font-black leading-tight mb-2"
          style={{ fontFamily: SERIF, color: DARK }}
        >
          Who would you like to meet?
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          You can choose more than one answer and change it any time.
        </p>

        <div
          className="flex items-center gap-3 py-4 border-b border-gray-200 cursor-pointer select-none"
          onClick={() => {
            setOpenToAll((v) => !v);
            if (!openToAll) setSelection([]);
          }}
        >
          <div
            className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
            style={{ backgroundColor: openToAll ? ACCENT : "#D1D5DB" }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: openToAll ? "translateX(22px)" : "translateX(2px)" }}
            />
          </div>
          <span className="text-base text-gray-900 font-medium">I&apos;m open to dating everyone</span>
        </div>

        <div
          className={`transition-opacity duration-200 ${openToAll ? "opacity-40 pointer-events-none" : ""}`}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {GP_PREF_OPTIONS.map((g) => {
            const sel = selection.includes(g);
            return (
              <OptionRow
                key={g}
                label={g}
                selected={sel}
                onSelect={() =>
                  setSelection((p) => (sel ? p.filter((x) => x !== g) : [...p, g]))
                }
              />
            );
          })}
        </div>

        <GpInfoLine text="You'll only be shown to people looking to date your gender." />
      </div>
      {errorMessage && (
        <p style={{ fontSize: 12, color: "#B33A1B", margin: "6px 22px 0", fontFamily: SANS }}>
          {errorMessage}
        </p>
      )}
      <SaveBtn loading={loading} disabled={!canSave} onClick={handleSave} />
    </>
  );
}

function HeightEditor({ initial, onSave, loading }: { initial?: number; onSave: (v: number) => void; loading: boolean }) {
  const [cm, setCm] = useState(initial ? String(initial) : "");
  return (
    <>
      <div style={{ padding: "16px 20px 8px" }}>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px" }}>Enter your height in centimetres</p>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "14px 16px",
          background: CARD, border: `2px solid ${DARK}`, borderRadius: 14,
          boxShadow: `2px 2px 0 ${DARK}`,
        }}>
          <input
            type="number" min={91} max={220} value={cm}
            onChange={e => setCm(e.target.value)}
            placeholder="e.g. 170"
            style={{ flex: 1, fontSize: 16, fontWeight: 600, background: "transparent", outline: "none", border: "none", color: DARK, fontFamily: SANS }}
          />
          <span style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>cm</span>
        </div>
        {cm && (
          <p style={{ fontSize: 12, color: MUTED, margin: "6px 0 0", fontFamily: SANS }}>
            ≈ {Math.floor(Number(cm) / 30.48)}′{Math.round((Number(cm) % 30.48) / 2.54)}″
          </p>
        )}
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(Number(cm))} />
    </>
  );
}

function DrinkingEditor({ initial, onSave, loading }: { initial?: string; onSave: (v: string) => void; loading: boolean }) {
  const [val, setVal] = useState(initial ?? "");
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px 8px" }}>
        {DRINKING_OPTIONS.map(opt => (
          <OptionRow key={opt.value} label={opt.label} desc={opt.desc} selected={val === opt.value} onSelect={() => setVal(opt.value)} />
        ))}
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(val)} />
    </>
  );
}

function ReligionEditor({ initial, onSave, loading }: { initial?: string; onSave: (v: string) => void; loading: boolean }) {
  const [val, setVal] = useState(initial ?? "");
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "16px 20px 8px" }}>
        {RELIGION_OPTIONS.map(r => (
          <Chip key={r} label={r} selected={val === r} onToggle={() => setVal(r)} />
        ))}
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(val)} />
    </>
  );
}

function FamilyEditor({ initialStatus, initialPref, onSave, loading }: { initialStatus?: string; initialPref?: string; onSave: (s: string, p: string) => void; loading: boolean }) {
  const [status, setStatus] = useState(initialStatus ?? "");
  const [pref, setPref] = useState(initialPref ?? "");
  return (
    <>
      <div style={{ padding: "16px 20px 8px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px", fontFamily: SANS }}>
          Do you have kids?
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {KIDS_STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              style={{
                flex: 1, padding: "12px 8px", borderRadius: 14, fontSize: 13, fontWeight: 600,
                fontFamily: SANS, cursor: "pointer",
                background: status === o.value ? DARK : CARD,
                color: status === o.value ? BG : DARK,
                border: `2px solid ${status === o.value ? DARK : `${DARK}30`}`,
                boxShadow: status === o.value ? `3px 3px 0 ${ACCENT}` : "none",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px 8px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px", fontFamily: SANS }}>
          Future plans
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {KIDS_PLAN_OPTIONS.map(p => (
            <OptionRow key={p} label={p} selected={pref === p} onSelect={() => setPref(p)} />
          ))}
        </div>
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(status, pref)} />
    </>
  );
}

/** Matches onboarding step 3 (dating mode); cream selected bg like other profile rows */
function DatingModeRadioRow({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between text-left transition-all mb-3"
      style={{
        padding: "14px 16px",
        background: selected ? BG : "#fff",
        border: `2px solid ${selected ? ACCENT : DARK}`,
        borderRadius: 14,
        boxShadow: selected ? `2px 2px 0 ${ACCENT}` : `2px 2px 0 ${DARK}`,
      }}
    >
      <div>
        <p className="text-base font-semibold" style={{ color: DARK }}>{label}</p>
        {sublabel && <p className="text-sm mt-0.5" style={{ color: "#9B8B78" }}>{sublabel}</p>}
      </div>
      <span
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 transition-colors"
        style={{ borderColor: selected ? ACCENT : "#C0B0A0" }}
      >
        {selected && (
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
        )}
      </span>
    </button>
  );
}

function DatingModeInfoLine({ text }: { text: string }) {
  return (
    <p className="text-sm mt-5 flex items-start gap-1.5" style={{ color: "#9B8B78" }}>
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" strokeWidth={2} />
      </svg>
      {text}
    </p>
  );
}

function relationshipIntentToMode(intent: string | null | undefined): "date" | "bff" | null {
  if (!intent) return null;
  if (intent === "friendship") return "bff";
  if (intent === "date" || intent === "undecided") return "date";
  return null;
}

function DatingModeEditor({
  initialRelationshipIntent,
  onSave,
  loading,
  errorMessage,
}: {
  initialRelationshipIntent: string | null | undefined;
  onSave: (mode: "date" | "bff") => void;
  loading: boolean;
  errorMessage?: string | null;
}) {
  const initial = relationshipIntentToMode(initialRelationshipIntent);
  const [mode, setMode] = useState<"date" | "bff" | "">(initial ?? "");

  function handleSave() {
    if (mode !== "date" && mode !== "bff") return;
    onSave(mode);
  }

  const canSave = mode === "date" || mode === "bff";

  return (
    <>
      <div className="flex flex-col flex-1 px-5 pt-4 pb-2">
        <div className="flex justify-start mb-6">
          <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black leading-tight mb-2" style={{ fontFamily: SERIF, color: DARK }}>
          What brings you to bluedate?
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Romance and butterflies or a beautiful friendship? Choose a mode to find your people.
        </p>

        <div>
          {(
            [
              { id: "date" as const, label: "Date", sub: "Find a relationship, something casual, or anything in-between" },
              { id: "bff" as const, label: "BFF", sub: "Make new friends and find your community" },
            ] as const
          ).map(({ id, label, sub }) => (
            <DatingModeRadioRow
              key={id}
              label={label}
              sublabel={sub}
              selected={mode === id}
              onClick={() => setMode(id)}
            />
          ))}
        </div>

        <DatingModeInfoLine text="You'll only be shown to people in the same mode as you." />
      </div>
      {errorMessage && (
        <p style={{ fontSize: 12, color: "#B33A1B", margin: "6px 22px 0", fontFamily: SANS }}>
          {errorMessage}
        </p>
      )}
      <SaveBtn loading={loading} disabled={!canSave} onClick={handleSave} />
    </>
  );
}

function PhotosEditor({ initial }: { initial: { id: string; url: string; order: number }[] }) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/onboarding/photos", { method: "POST", body: fd });
      if (res.ok) {
        const json = await res.json();
        setPhotos(p => [...p, { id: json.data?.id ?? json.id, url: json.data?.url ?? json.url, order: p.length }]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photoId: string) {
    setDeleting(photoId);
    try {
      const res = await fetch(`/api/onboarding/photos/${photoId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setPhotos(p => p.filter(ph => ph.id !== photoId));
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px", fontFamily: SANS }}>
        Add at least 2 photos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {photos.map((p) => (
          <div key={p.id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", border: `2px solid ${DARK}`, boxShadow: `2px 2px 0 ${DARK}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => deletePhoto(p.id)}
              disabled={deleting === p.id}
              style={{
                position: "absolute", top: 6, right: 6,
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {deleting === p.id ? (
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #fff4", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <X size={13} color="#fff" strokeWidth={2.5} />
              )}
            </button>
          </div>
        ))}
        {photos.length < 9 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              aspectRatio: "3/4", borderRadius: 14, cursor: "pointer",
              background: CARD, border: `2px dashed ${DARK}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {uploading ? (
              <div style={{ width: 24, height: 24, borderRadius: "50%", border: `3px solid ${DARK}30`, borderTopColor: DARK, animation: "spin 0.8s linear infinite" }} />
            ) : (
              <Plus size={28} color={`${DARK}60`} />
            )}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function EditFieldView({ field, data }: { field: EditField; data: ProfileData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push("/profile"), 700);
        return;
      }

      let message = "Couldn't save changes. Please check your inputs.";
      try {
        const json = await res.json();
        if (typeof json?.error?.message === "string" && json.error.message.trim()) {
          message = json.error.message;
        } else if (typeof json?.message === "string" && json.message.trim()) {
          message = json.message;
        }
      } catch {
        // ignore parse errors and keep fallback message
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const { preferences, interests, personality, photos } = data;

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
        <Header title={FIELD_TITLES[field]} onBack={() => router.push("/profile")} />

        {saved && (
          <div style={{
            margin: "12px 20px 0", padding: "12px 16px", borderRadius: 12,
            background: "#E8F9F0", border: `1.5px solid #6FD8A0`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Check size={15} color="#22A06B" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#22A06B", fontFamily: SANS }}>Saved!</span>
          </div>
        )}

        {field === "basics" && (
          <BasicsEditor
            initialName={data.profile?.fullName}
            initialCity={data.profile?.city}
            initialBio={data.profile?.bio}
            initialDob={data.profile?.dateOfBirth}
            onSave={v => post("/api/onboarding/profile", v)}
            loading={loading}
            errorMessage={error}
          />
        )}
        {field === "interests" && (
          <InterestsEditor
            initial={interests?.hobbies?.filter(h => h && h !== "Not specified") ?? []}
            onSave={hobbies => post("/api/onboarding/interests", { hobbies, favouriteActivities: interests?.favouriteActivities ?? [] })}
            loading={loading}
          />
        )}
        {field === "gender" && (
          <GenderEditor
            initial={preferences?.genderIdentity ?? undefined}
            genderUpdateCount={preferences?.genderUpdateCount ?? 0}
            onSave={genderIdentity => post("/api/onboarding/gender", { genderIdentity })}
            loading={loading}
            errorMessage={error}
          />
        )}
        {field === "gender-preference" && (
          <GenderPreferenceEditor
            initialPreference={preferences?.genderPreference}
            onSave={(v) => post("/api/onboarding/gender-preference", v)}
            loading={loading}
            errorMessage={error}
          />
        )}
        {field === "relationship-intent" && (
          <DatingModeEditor
            initialRelationshipIntent={preferences?.relationshipIntent}
            onSave={(m) => post("/api/onboarding/dating-mode", { mode: m })}
            loading={loading}
            errorMessage={error}
          />
        )}
        {field === "looking-for" && (
          <LookingForEditor
            initial={preferences?.relationshipGoals?.filter(Boolean) ?? []}
            onSave={goals => post("/api/onboarding/relationship-goals", { relationshipGoals: goals })}
            loading={loading}
          />
        )}
        {field === "height" && (
          <HeightEditor
            initial={preferences?.heightCm ?? undefined}
            onSave={heightCm => post("/api/onboarding/height", { heightCm })}
            loading={loading}
          />
        )}
        {field === "drinking" && (
          <DrinkingEditor
            initial={personality?.drinkingHabit ?? undefined}
            onSave={drinkingHabit => post("/api/onboarding/personality", { drinkingHabit, smokingHabit: personality?.smokingHabit ?? "No, I don't smoke" })}
            loading={loading}
          />
        )}
        {field === "religion" && (
          <ReligionEditor
            initial={personality?.religion?.[0] ?? undefined}
            onSave={religion => post("/api/onboarding/important-life", { religion: [religion], politics: [] })}
            loading={loading}
          />
        )}
        {field === "family" && (
          <FamilyEditor
            initialStatus={personality?.kidsStatus ?? undefined}
            initialPref={personality?.kidsPreference ?? undefined}
            onSave={(kidsStatus, kidsPreference) => post("/api/onboarding/family-plans", { kidsStatus, kidsPreference })}
            loading={loading}
          />
        )}
        {field === "photos" && <PhotosEditor initial={photos} />}
      </div>
    </div>
  );
}
