"use client";
// ─── OnboardingShell — matches login/OTP page aesthetic ──────────────────────

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingStatus } from "./page";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SUB_STEPS = 12;

const HEIGHT_CM_MIN = 91;
const HEIGHT_CM_MAX = 220;
const HEIGHT_OPTIONS = Array.from(
  { length: HEIGHT_CM_MAX - HEIGHT_CM_MIN + 1 },
  (_, i) => HEIGHT_CM_MIN + i,
);
const ACCENT = "#E8622A";
const BG = "#EDE8D5";
const FAB_BG = "#2B1A07";
const FONT_SERIF = "var(--font-playfair), Georgia, serif";

const SUGGESTED_INTERESTS = [
  "Skiing", "Museums & galleries", "LGBTQ+ rights", "Wine", "Writing",
  "Horror", "Yoga", "Cats", "Dogs", "Crafts", "Festivals", "Coffee",
  "Art", "City breaks", "Camping", "Foodie", "R&B", "Tennis", "Dancing",
  "Vegetarian", "Gardening", "Baking", "Gigs", "Country", "Photography",
  "Travel", "Gaming", "Cooking", "Reading", "Hiking", "Fitness", "Movies",
];

/** Emoji/symbol per interest for the suggestions grid (label only; API still receives plain name) */
const INTEREST_SYMBOLS: Record<string, string> = {
  "Skiing": "⛷️",
  "Museums & galleries": "🖼️",
  "LGBTQ+ rights": "🏳️‍🌈",
  "Wine": "🍷",
  "Writing": "✍️",
  "Horror": "🎃",
  "Yoga": "🧘",
  "Cats": "🐱",
  "Dogs": "🐕",
  "Crafts": "🎨",
  "Festivals": "🎪",
  "Coffee": "☕",
  "Art": "🖌️",
  "City breaks": "🌆",
  "Camping": "⛺",
  "Foodie": "🍽️",
  "R&B": "🎵",
  "Tennis": "🎾",
  "Dancing": "💃",
  "Vegetarian": "🥬",
  "Gardening": "🌱",
  "Baking": "🧁",
  "Gigs": "🎸",
  "Country": "🤠",
  "Photography": "📷",
  "Travel": "✈️",
  "Gaming": "🎮",
  "Cooking": "👨‍🍳",
  "Reading": "📚",
  "Hiking": "🥾",
  "Fitness": "💪",
  "Movies": "🎬",
};

const DEFAULT_GENDER_PREFERENCE = ["Men", "Women", "Nonbinary people"];

const DRINKING_OPTIONS = [
  "Yes, I drink", "I drink sometimes", "I rarely drink",
  "No, I don't drink", "I'm sober",
];
const SMOKING_OPTIONS = ["I smoke sometimes", "No, I don't smoke"];
const RELIGION_OPTIONS = [
  "Agnostic",
  "Atheist",
  "Buddhist",
  "Catholic",
  "Christian",
  "Hindu",
  "Jain",
  "Jewish",
  "Mormon",
  "Latter-day Saint",
  "Muslim",
  "Zoroastrian",
  "Sikh",
  "Spiritual",
  "Other",
] as const;

const RELIGION_SYMBOLS: Record<(typeof RELIGION_OPTIONS)[number], string> = {
  Agnostic: "❓",
  Atheist: "🚫",
  Buddhist: "☸️",
  Catholic: "✝️",
  Christian: "✝️",
  Hindu: "🕉️",
  Jain: "🪔",
  Jewish: "✡️",
  Mormon: "🏛️",
  "Latter-day Saint": "🏛️",
  Muslim: "☪️",
  Zoroastrian: "🔥",
  Sikh: "🛡️",
  Spiritual: "✨",
  Other: "🌈",
};

const POLITICS_OPTIONS = [
  "Apolitical",
  "Moderate",
  "Left",
  "Right",
  "Communist",
  "Socialist",
] as const;

const POLITICS_SYMBOLS: Record<(typeof POLITICS_OPTIONS)[number], string> = {
  Apolitical: "🤝",
  Moderate: "⚖️",
  Left: "⬅️",
  Right: "➡️",
  Communist: "🛠️",
  Socialist: "🤲",
};
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FIRST_NAME_MIN_LENGTH = 3;
const FIRST_NAME_LETTERS_ONLY = /^[a-zA-Z]*$/;
const BIRTH_YEAR_MIN = 1947;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function isPastDate(day: number, month: number, year: number): boolean {
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

function isValidBirthDate(day: string, month: string, year: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!d || !m || !y || year.length !== 4) return false;
  const maxDay = getDaysInMonth(y, m);
  if (d < 1 || d > maxDay) return false;
  if (m < 1 || m > 12) return false;
  if (y < BIRTH_YEAR_MIN || y > new Date().getFullYear()) return false;
  return isPastDate(d, m, y);
}

function validateFirstName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < FIRST_NAME_MIN_LENGTH)
    return `First name must be at least ${FIRST_NAME_MIN_LENGTH} characters.`;
  if (!FIRST_NAME_LETTERS_ONLY.test(trimmed))
    return "First name can only contain letters (no numbers or special characters).";
  return null;
}

function getInitialSubStep(status: OnboardingStatus): number {
  if (!status.hasProfile) return 0;
  if (!status.hasPreferences) return 1;
  // Require an explicit Date/BFF choice before moving past step 3
  if (!status.hasDatingMode) return 3;
  const hasHeight = status.hasHeight;
  // Always respect in-progress ordering for Date/BFF, even if hasPreferencesComplete is true.
  // Date: who to meet (4) → height (7) → interests (8)
  if (status.relationshipIntent === "date") {
    if (!status.hasGenderPreference) return 4;
    if (!hasHeight) return 7;
    if (!status.hasInterests) return 8;
    if (!status.hasPersonality || !status.hasAvailability) return 9;
    if (!status.hasImportantLife) return 11;
    if (!status.hasPhotosStepCompleted) return 12;
    return 12;
  }
  // BFF: photos (12) → life experiences (13) → BFF interests (14) → relationship status (15)
  if (status.relationshipIntent === "friendship") {
    if (!status.hasPhotosStepCompleted) return 12;
    if (!status.hasLifeExperiences) return 13;
    if (!status.hasBffInterests) return 14;
    if (!status.hasRelationshipStatus) return 15;
  }

  if (!status.hasInterests) return 8;
  if (!status.hasPersonality || !status.hasAvailability) return 9;
  if (!status.hasImportantLife) return 11;
  return 12; // photos step (Date and BFF)
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

/** Bordered FAB — landing page "Join Now" style */
function Fab({
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="focus:outline-none cursor-pointer disabled:opacity-40 shrink-0 transition-all active:translate-y-[1px] active:shadow-none"
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2.5px solid ${FAB_BG}`,
        boxShadow: `3px 3px 0 ${FAB_BG}`,
        backgroundColor: FAB_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {loading ? (
        <span
          style={{
            display: "block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        <svg
          width="20" height="20" viewBox="0 0 20 20"
          fill="none" stroke="#ffffff" strokeWidth="2.25"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M8 6l6 4-6 4" />
        </svg>
      )}
    </button>
  );
}

/** Plain back arrow — no background, just a chevron < */
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="focus:outline-none border-0 bg-transparent p-0 cursor-pointer text-gray-900"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

/** Full-screen loader — centred spinner, slightly blurred background */
function GlobalLoader() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backdropFilter: "blur(3px)", backgroundColor: "rgba(245,240,220,0.75)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="block rounded-full border-[3px] animate-spin"
          style={{
            width: 40,
            height: 40,
            borderColor: "#D1D5DB",
            borderTopColor: ACCENT,
          }}
        />
      </div>
    </div>
  );
}

/** Single-select row with radio dot */
function RadioRow({
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
        background: selected ? `${ACCENT}12` : "#fff",
        border: `2px solid ${selected ? ACCENT : FAB_BG}`,
        borderRadius: 14,
        boxShadow: selected ? `2px 2px 0 ${ACCENT}` : `2px 2px 0 ${FAB_BG}`,
      }}
    >
      <div>
        <p className="text-base font-semibold" style={{ color: FAB_BG }}>{label}</p>
        {sublabel && <p className="text-sm mt-0.5" style={{ color: "#9B8B78" }}>{sublabel}</p>}
      </div>
      <span
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 transition-colors"
        style={{ borderColor: selected ? ACCENT : "#C0B0A0" }}
      >
        {selected && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: ACCENT }}
          />
        )}
      </span>
    </button>
  );
}

/** Multi-select row with checkbox */
function CheckRow({
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
      className="w-full flex items-center justify-between text-left transition-all mb-3"
      style={{
        padding: "14px 16px",
        background: selected ? `${ACCENT}12` : "#fff",
        border: `2px solid ${selected ? ACCENT : FAB_BG}`,
        borderRadius: 14,
        boxShadow: selected ? `2px 2px 0 ${ACCENT}` : `2px 2px 0 ${FAB_BG}`,
      }}
    >
      <span className="text-base font-semibold" style={{ color: FAB_BG }}>{label}</span>
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 ml-4 transition-all border-2"
        style={{
          borderColor: selected ? ACCENT : "#C0B0A0",
          backgroundColor: selected ? ACCENT : "transparent",
        }}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}

/** Pill chip for interests / habits */
function Pill({
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
        border: `2px solid ${selected ? ACCENT : FAB_BG}`,
        boxShadow: `1.5px 1.5px 0 ${selected ? ACCENT : FAB_BG}`,
        backgroundColor: selected ? `${ACCENT}15` : "#fff",
        color: selected ? ACCENT : FAB_BG,
      }}
    >
      {label}
      {!selected && <span style={{ color: "#9B8B78", fontSize: 15, lineHeight: 1 }}>+</span>}
    </button>
  );
}

/** Bordered card-style input — matches landing page aesthetic */
const inputCls =
  "w-full px-4 py-3 bg-white text-base focus:outline-none placeholder:text-[#9B8B78]"
  + " text-[#1A0A00] rounded-xl"
  + " border-[2px] border-[#1A0A00]"
  + " shadow-[2px_2px_0_#1A0A00]"
  + " transition-shadow";

/** Serif heading — landing page style */
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="text-3xl font-black leading-tight mb-2"
      style={{ fontFamily: FONT_SERIF, color: FAB_BG }}
    >
      {children}
    </h1>
  );
}

/** Small muted info line */
function InfoLine({ text }: { text: string }) {
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

/** Inline error */
function InlineError({ message }: { message: string }) {
  return (
    <p
      className="mt-3 flex items-start gap-2 text-sm rounded-xl px-3 py-2"
      style={{ background: "#FFF0EE", border: "1.5px solid #E8622A30", color: "#C0392B" }}
      role="alert"
    >
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
      {message}
    </p>
  );
}

const LIFE_EXPERIENCE_SYMBOLS: Record<string, string> = {
  // Travel
  "New to town": "👋",
  "Living abroad": "🌍",
  "Moved country": "✈️",
  Travelling: "🧳",
  // Education
  "At uni": "🎓",
  University: "🎓",
  "Just graduated": "🎉",
  "Working and studying": "💼",
  "Postgrad degree": "📚",
  "Gap year": "🌎",
  "Studying abroad": "🗺️",
  // Working it
  "Career focused": "💻",
  "New job": "🎊",
  "First job": "🆕",
  "In-between jobs": "↔️",
  "Changing career": "🔁",
  "Armed forces": "🎖️",
  "Stay at home parent": "🏡",
  "Working parent": "👨‍💻",
  // House and home
  "Roommate life": "🏠",
  "Putting down roots": "🪴",
  "Buying a house": "📝",
  "First time home owner": "🔑",
  "Living with family": "👨‍👩‍👧‍👦",
  "Living with partner": "🏡",
  // LGBTQIA+
  "Exploring my identity": "🏳️‍🌈",
  "Community leader": "🌈",
  Transitioning: "🦋",
  "Out and proud": "🏳️‍🌈",
  Questioning: "❓",
  // Family life
  Pregnant: "💖",
  "New parent": "👶",
  "Got toddlers": "🍼",
  "Have teenagers": "🧑",
  "Empty nester": "🏡",
  "Planning for a family": "📝",
  "Fertility journey": "🌱",
  "Adoption journey": "🤝",
  // Self-love
  "Fresh start": "✨",
  "Exploring my culture": "🌏",
  "Enjoying each day as it comes": "🌅",
  "Sober life": "🚫🍸",
  "Working on myself": "💪",
  "Body positivity": "😍",
  "Going to therapy": "💬",
  "Exploring spirituality": "🕊️",
};

const LIFE_EXPERIENCE_SECTIONS = [
  {
    title: "Travel",
    options: ["New to town", "Living abroad", "Moved country", "Travelling"],
  },
  {
    title: "Education",
    options: [
      "At uni",
      "University",
      "Just graduated",
      "Working and studying",
      "Postgrad degree",
      "Gap year",
      "Studying abroad",
    ],
  },
  {
    title: "Working it",
    options: [
      "Career focused",
      "New job",
      "First job",
      "In-between jobs",
      "Changing career",
      "Armed forces",
      "Stay at home parent",
      "Working parent",
    ],
  },
  {
    title: "House and home",
    options: [
      "Roommate life",
      "Putting down roots",
      "Buying a house",
      "First time home owner",
      "Living with family",
      "Living with partner",
    ],
  },
  {
    title: "LGBTQIA+",
    options: [
      "Exploring my identity",
      "Community leader",
      "Transitioning",
      "Out and proud",
      "Questioning",
    ],
  },
  {
    title: "Family life",
    options: [
      "Pregnant",
      "New parent",
      "Got toddlers",
      "Have teenagers",
      "Empty nester",
      "Planning for a family",
      "Fertility journey",
      "Adoption journey",
    ],
  },
  {
    title: "Self-love",
    options: [
      "Fresh start",
      "Exploring my culture",
      "Enjoying each day as it comes",
      "Sober life",
      "Working on myself",
      "Body positivity",
      "Going to therapy",
      "Exploring spirituality",
    ],
  },
];

/** Custom month dropdown — single select, styled like other inputs */
function MonthDropdown({
  value,
  onChange,
  onOpenChange,
  open,
  buttonRef,
  onFocusYear,
}: {
  value: string;
  onChange: (monthIndex: number) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onFocusYear: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        listRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange, buttonRef]);

  const display = value ? MONTHS[parseInt(value, 10) - 1] ?? "" : "";
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`${inputCls} w-full text-left flex items-center justify-between pr-2`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Month"
      >
        <span className={display ? "text-gray-900" : "text-gray-400"}>{display || "Month"}</span>
        <svg className="w-4 h-4 text-gray-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 shadow-md z-50 py-1"
          style={{ backgroundColor: BG }}
          role="listbox"
        >
          {MONTHS.map((name, i) => {
            const selected = value === String(i + 1);
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                className={`w-full px-4 py-2.5 text-left text-sm text-gray-900 focus:outline-none transition-colors hover:bg-[#E8622A]/10 focus:bg-[#E8622A]/10 ${selected ? "bg-[#E8622A]/10" : ""}`}
                onClick={() => {
                  onChange(i + 1);
                  onOpenChange(false);
                  onFocusYear();
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Photos step ──────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string;
  url: string;
  order: number;
}

function PhotosStep({
  token,
  status,
  mode,
  onDone,
}: {
  token: string;
  status: OnboardingStatus;
  mode: "date" | "bff";
  onDone: () => void;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/onboarding/photos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPhotos((json.data ?? []) as PhotoItem[]);
      }
    } catch {
      // network error — photos list won't update but won't crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPhotos();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchPhotos is stable

  const count = photos.length;

  const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  const isImage = (file: File) => file.type.startsWith("image/");

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const toUpload = files.slice(0, 6 - count);
      for (const file of toUpload) {
        if (!isImage(file)) {
          setError("Only image files are allowed (e.g. JPEG, PNG).");
          return;
        }
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
          setError("The size is too big. Please upload an image of size below 5MB.");
          return;
        }
      }
      let nextOrder = count;
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("order", String(nextOrder));
        const res = await fetch("/api/onboarding/photos", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          nextOrder += 1;
          await fetchPhotos();
        } else {
          const j = await res.json().catch(() => ({}));
          setError((j as { error?: { message?: string } }).error?.message ?? "Upload failed. Please try again.");
          break;
        }
      }
    } catch (err) {
      setError((err as Error).message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const complete = async () => {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/photos-step-complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error?.message ?? "Could not save photos step");
      }
      onDone();
      setCompleting(false);
    } catch (err) {
      setError((err as Error).message);
      setCompleting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col p-6"
      style={{ backgroundColor: BG }}
    >
      {/* Full progress */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ backgroundColor: ACCENT }} />

      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Icon */}
        <div className="flex justify-start mb-6">
          <div
            className="w-14 h-14 rounded-full border-2 border-gray-900 flex items-center justify-center shrink-0"
          >
            <svg className="w-7 h-7 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
            </svg>
          </div>
        </div>

        <Heading>Time to put a face to the name</Heading>
        <p className="text-sm text-gray-500 mb-8">
          Add at least 2 photos — you with your pet, eating your fave food, or in a place you love.
        </p>

        {/* Photo upload overlay */}
        {uploading && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backdropFilter: "blur(3px)", backgroundColor: "rgba(245,240,220,0.80)" }}
          >
            <div className="bg-white rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-xl">
              <div className="relative w-14 h-14">
                {/* Outer ring */}
                <span
                  className="absolute inset-0 rounded-full border-[3px] animate-spin"
                  style={{ borderColor: "#E0E0E0", borderTopColor: ACCENT }}
                />
                {/* Camera icon in centre */}
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6" style={{ color: ACCENT }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                    <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
                  </svg>
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">Uploading photo…</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {loading ? (
            <div className="col-span-3 aspect-square max-w-[200px] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <span
                className="block rounded-full border-[3px] animate-spin"
                style={{ width: 28, height: 28, borderColor: "#D1D5DB", borderTopColor: ACCENT }}
              />
            </div>
          ) : (
            Array.from({ length: 6 }).map((_, i) => {
              const photo = photos[i];
              return (
                <label
                  key={photo?.id ?? `slot-${i}`}
                  className={`aspect-square rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden transition-colors
                    ${photo ? "border-gray-300 bg-gray-100 cursor-default" : "border-gray-300 cursor-pointer hover:border-gray-400"}`}
                >
                  {photo ? (
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={upload}
                        disabled={uploading || count >= 6}
                      />
                      <svg className="w-7 h-7 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </>
                  )}
                </label>
              );
            })
          )}
        </div>

        {error && <InlineError message={error} />}

        <p className="text-sm text-gray-400 mb-8">
          {count}/6 photos added
        </p>

        <div className="mt-auto pt-8 flex flex-col gap-4">
          {count >= 2 && (
            <div className="flex items-end justify-end">
              <Fab onClick={complete} disabled={completing} loading={completing} />
            </div>
          )}
          <p className="text-sm text-gray-400">
            Want to make sure you really shine?{" "}
            <a href="#" className="font-medium hover:underline" style={{ color: ACCENT }}
              onClick={(e) => e.preventDefault()}>
              Photo tips
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props {
  step: string;
  token: string;
  status: OnboardingStatus;
}

export default function OnboardingShell({ step: _step, token, status }: Props) {
  const router = useRouter();
  const [subStep, setSubStep] = useState(() => getInitialSubStep(status));

  /** Call after /api/onboarding/complete succeeds. Updates cookie with fresh JWT then hard-navigates. */
  async function finishOnboarding() {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: { message?: string } }).error?.message ?? "Could not complete onboarding");
    }
    const j = await res.json() as { data?: { accessToken?: string; expiresIn?: number } };
    const newToken = j.data?.accessToken;
    if (newToken) {
      const maxAge = j.data?.expiresIn ?? 7 * 24 * 60 * 60;
      document.cookie = `access_token=${newToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    window.location.assign("/home");
  }
  const [loading, setLoading] = useState(false);
  /** API error for the current step — shown inline below the step form, not in a top alert */
  const [stepError, setStepError] = useState<string | null>(null);

  // ── Refs for DOB auto-focus ────────────────────────────────────────────────
  const dayInputRef = useRef<HTMLInputElement>(null);
  const monthButtonRef = useRef<HTMLButtonElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const heightListRef = useRef<HTMLDivElement>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [birthday, setBirthday] = useState({ day: "", month: "", year: "" });
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [genderIdentity, setGenderIdentity] = useState(() => status.genderIdentity ?? "");
  const [datingMode, setDatingMode] = useState<"date" | "bff" | "">(() => {
    if (status.relationshipIntent === "friendship") return "bff";
    if (status.relationshipIntent === "undecided" || status.relationshipIntent === "date") return "date";
    return "";
  });
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [openToAll, setOpenToAll] = useState(false);
  const [heightCm, setHeightCm] = useState<number>(() => {
    const h = status.heightCm;
    return h != null && h >= HEIGHT_CM_MIN && h <= HEIGHT_CM_MAX ? h : 168;
  });
  const [heightTouched, setHeightTouched] = useState(false);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestSearch, setInterestSearch] = useState("");
  const [bffInterests, setBffInterests] = useState<string[]>([]);
  const [drinkingHabit, setDrinkingHabit] = useState("");
  const [smokingHabit, setSmokingHabit] = useState("");
  const [religion, setReligion] = useState<string[]>([]);
  const [politics, setPolitics] = useState<string[]>([]);
  const [lifeExperiences, setLifeExperiences] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<string>("");
  // Scroll height list so the current selection appears centered initially,
  // to signal that the list can be scrolled.
  useEffect(() => {
    if (subStep !== 7) return;
    const el = document.getElementById(`height-option-${heightCm}`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
  }, [subStep, heightCm]);

  const apiPost = async (path: string, body: unknown) => {
    const res = await fetch(`/api/onboarding/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      router.push("/login");
      throw new Error("Session expired. Please log in again.");
    }
    let json: { success?: boolean; error?: { message?: string; details?: Record<string, string[]> } } = {};
    try {
      json = await res.json();
    } catch {
      if (!res.ok) throw new Error("Invalid response from server. Please try again.");
    }
    if (!res.ok) {
      const msg = json.error?.message ?? "Something went wrong";
      const details = json.error?.details as Record<string, string[]> | undefined;
      const firstFieldMsg = details && typeof details === "object"
        ? Object.values(details).flat().find(Boolean)
        : undefined;
      throw new Error(firstFieldMsg ?? msg);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    setStepError(null);
    setFirstNameError(null);
    setBirthdayError(null);
    try {
      if (subStep === 3 && !datingMode) {
        setStepError("Please select Date or BFF to continue.");
        setLoading(false);
        return;
      }
      if (subStep === 7) {
        setHeightError(null);
        if (heightCm < HEIGHT_CM_MIN || heightCm > HEIGHT_CM_MAX) {
          setHeightError(`Please choose a height between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm.`);
          setLoading(false);
          return;
        }
        await apiPost("height", { heightCm });
        setSubStep(8);
        setLoading(false);
        return;
      }
      if (subStep === 0) {
        const nameErr = validateFirstName(firstName);
        if (nameErr) {
          setFirstNameError(nameErr);
          setLoading(false);
          return;
        }
        if (!isValidBirthDate(birthday.day, birthday.month, birthday.year)) {
          setBirthdayError("Please enter a valid past date (day, month, and year).");
          setLoading(false);
          return;
        }
        const y = parseInt(birthday.year, 10);
        const m = parseInt(birthday.month, 10);
        const d = parseInt(birthday.day, 10);
        const birthDate = new Date(y, m - 1, d);
        const now = new Date();
        let age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;
        if (age < 18) {
          setBirthdayError("You must be at least 18 years old.");
          setLoading(false);
          return;
        }
        const dateOfBirth = `${birthday.year}-${String(birthday.month).padStart(2, "0")}-${String(birthday.day).padStart(2, "0")}`;
        await apiPost("profile", { fullName: firstName.trim(), dateOfBirth });
      }

      if (subStep === 1) {
        await apiPost("gender", { genderIdentity });
        setSubStep(3);
        setLoading(false);
        return;
      }

      if (subStep === 3 && datingMode === "bff") {
        await apiPost("dating-mode", { mode: "bff" });
        // For BFF intent, navigate directly to the photos upload step
        setSubStep(12);
        setLoading(false);
        return;
      }

      if (subStep === 3 && datingMode === "date") {
        await apiPost("dating-mode", { mode: "date" });
      }

      if (subStep === 4) {
        await apiPost("gender-preference", {
          genderPreference: openToAll ? DEFAULT_GENDER_PREFERENCE : genderPreference,
        });
        setSubStep(7);
        setLoading(false);
        return;
      }

      if (subStep === 8) {
        await apiPost("interests", {
          hobbies: interests.length > 0 ? interests : ["Other"],
          favouriteActivities: [], musicTaste: [], foodTaste: [],
        });
      }

      if (subStep === 9) {
        await apiPost("personality", {
          socialLevel: drinkingHabit || "Not specified",
          conversationStyle: smokingHabit || "Not specified",
        });
        await apiPost("availability", { days: ["fri", "sat", "sun"], times: ["evening"] });
        setSubStep(11);
        setLoading(false);
        return;
      }

      if (subStep === 11 && datingMode === "date") {
        await apiPost("important-life", {
          religion,
          politics,
        });
      }

      setSubStep((s) => s + 1);
    } catch (e) {
      const msg = (e as Error).message;
      if (subStep === 7) setHeightError(msg);
      else setStepError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Step 3 (dating mode): back goes to gender step (1)
    if (subStep === 3) {
      setSubStep(1);
      return;
    }
    // Steps 5 and 6 removed — back from 7 goes to 4
    if (subStep === 7) {
      setSubStep(4);
      return;
    }
    // Step 10 removed — back from 11 goes to 9
    if (subStep === 11) {
      setSubStep(9);
      return;
    }
    setSubStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = async () => {
    setLoading(true);
    setStepError(null);
    try {
      if (subStep === 8) {
        await apiPost("interests", { hobbies: ["Other"], favouriteActivities: [], musicTaste: [], foodTaste: [] });
      }
      if (subStep === 9) {
        await apiPost("personality", { socialLevel: "Not specified", conversationStyle: "Not specified" });
        await apiPost("availability", { days: ["fri", "sat", "sun"], times: ["evening"] });
        setSubStep(11);
        setLoading(false);
        return;
      }
      if (subStep === 11) {
        await apiPost("important-life", { religion: [], politics: [] });
      }
      setSubStep((s) => s + 1);
    } catch (e) {
      setStepError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = (() => {
    switch (subStep) {
      case 0: {
        const trimmed = firstName.trim();
        return trimmed.length >= FIRST_NAME_MIN_LENGTH
          && FIRST_NAME_LETTERS_ONLY.test(trimmed)
          && birthday.day !== ""
          && birthday.month !== ""
          && birthday.year.length === 4;
      }
      case 1: return genderIdentity !== "";
      case 3: return datingMode !== "";
      case 4: return openToAll || genderPreference.length > 0;
      case 7: return heightTouched && heightCm >= HEIGHT_CM_MIN && heightCm <= HEIGHT_CM_MAX;
      case 8: return interests.length > 0;
      case 9: return !!drinkingHabit || !!smokingHabit;
      case 11: return religion.length > 0 || politics.length > 0;
      case 15: return relationshipStatus !== "";
      default: return true;
    }
  })();

  const isSkippable = subStep === 8 || subStep === 9 || subStep === 11;
  const progressPct = Math.round(((subStep + 1) / TOTAL_SUB_STEPS) * 100);

  if (subStep === 12) {
    const mode: "date" | "bff" =
      datingMode || (status.relationshipIntent === "friendship" ? "bff" : "date");

    return (
      <PhotosStep
        token={token}
        status={status}
        mode={mode}
        onDone={() => {
          if (mode === "bff") {
            setSubStep(13);
          } else {
            // Date mode: photos done → complete onboarding
            finishOnboarding().catch((e) => setStepError((e as Error).message));
          }
        }}
      />
    );
  }

  const filteredInterests = interestSearch.trim()
    ? SUGGESTED_INTERESTS.filter((i) => i.toLowerCase().includes(interestSearch.toLowerCase()))
    : SUGGESTED_INTERESTS;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG, padding: "0 16px 32px" }}>
      {/* Global loading overlay */}
      {loading && <GlobalLoader />}

      {/* Progress bar — fixed at top */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: 4, backgroundColor: "#E8D5B0" }}
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: ACCENT,
            minWidth: progressPct > 0 ? 8 : 0,
          }}
        />
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col flex-1" style={{ paddingTop: 20 }}>
        {/* Back button — hidden on first step */}
        {subStep > 0 && (
          <div className="mb-4">
            <BackBtn onClick={handleBack} />
          </div>
        )}

        {/* ── STEP 0: Intro ───────────────────────────────────────────────── */}
        {subStep === 0 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <Heading>Oh hey! Let's start with an intro.</Heading>
            <p className="text-sm mb-8" style={{ color: "#9B8B78" }}>Tell us a little about yourself.</p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: FAB_BG }}>Your first name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^a-zA-Z]/g, "");
                  setFirstName(next);
                  if (firstNameError) setFirstNameError(validateFirstName(next));
                }}
                onBlur={() => setFirstNameError(validateFirstName(firstName))}
                className={`${inputCls} ${firstNameError ? "border-red-500" : ""}`}
                autoFocus
                autoComplete="given-name"
                maxLength={50}
              />
              {firstNameError && <InlineError message={firstNameError} />}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-3">Your birthday</label>
              <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-3 items-end">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Day</p>
                  <input
                    ref={dayInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={birthday.day}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setBirthday((b) => ({ ...b, day: v }));
                      setBirthdayError(null);
                      if (v.length === 2) monthButtonRef.current?.focus();
                    }}
                    placeholder="DD"
                    className={`${inputCls} text-center ${birthdayError ? "border-red-500" : ""}`}
                    aria-label="Day"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Month</p>
                  <input
                    ref={monthButtonRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={birthday.month}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (raw === "") {
                        setBirthday((b) => ({ ...b, month: "" }));
                        setBirthdayError(null);
                        return;
                      }
                      // Handle first digit only
                      if (raw.length === 1) {
                        const d = parseInt(raw, 10);
                        if (Number.isNaN(d)) return;
                        // Allow leading 0 so user can type 01–09 for Jan–Sep
                        if (raw === "0") {
                          setBirthday((b) => ({ ...b, month: "0" }));
                          setBirthdayError(null);
                          return;
                        }
                        // For 1, wait for second digit (10–12)
                        if (d === 1) {
                          setBirthday((b) => ({ ...b, month: "1" }));
                          setBirthdayError(null);
                          return;
                        }
                        // For 2–9, treat as full month and jump to year
                        if (d >= 2 && d <= 9) {
                          setBirthday((b) => ({ ...b, month: raw }));
                          setBirthdayError(null);
                          yearInputRef.current?.focus();
                        }
                        return;
                      }
                      // raw.length === 2 here
                      const num = parseInt(raw, 10);
                      if (Number.isNaN(num) || num < 1 || num > 12) return;
                      setBirthday((b) => ({ ...b, month: raw }));
                      setBirthdayError(null);
                      yearInputRef.current?.focus();
                    }}
                    placeholder="MM"
                    className={`${inputCls} text-center ${birthdayError ? "border-red-500" : ""}`}
                    aria-label="Month"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Year</p>
                  <input
                    ref={yearInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={birthday.year}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setBirthday((b) => ({ ...b, year: v }));
                      setBirthdayError(null);
                    }}
                    placeholder="YYYY"
                    className={`${inputCls} text-center ${birthdayError ? "border-red-500" : ""}`}
                    aria-label="Year"
                  />
                </div>
              </div>
              {birthdayError && <InlineError message={birthdayError} />}
              <p className="text-sm text-gray-400 mt-2">It's never too early to count down</p>
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-end">
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 1: Gender identity ─────────────────────────────────────── */}
        {subStep === 1 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" />
              </svg>
            </div>
            <Heading>
              {(status.fullName ?? (firstName || "Your name"))} is a great name
            </Heading>
            <p className="text-sm text-gray-500 mb-6">
              We love that you're here. Pick the gender that best describes you, then add more about it if you like.
            </p>

            <p className="text-base font-semibold text-gray-900 mb-3">
              Which gender best describes you?
            </p>

            <div>
              {["Woman", "Man", "Nonbinary"].map((g) => (
                <RadioRow
                  key={g} label={g}
                  selected={genderIdentity === g}
                  onClick={() => setGenderIdentity(g)}
                />
              ))}
            </div>

            <p className="text-sm text-gray-400 mt-4">You can always update this later.</p>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-end">
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 3: Dating mode ─────────────────────────────────────────── */}
        {subStep === 3 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <Heading>What brings you to bluedate?</Heading>
            <p className="text-sm text-gray-500 mb-8">
              Romance and butterflies or a beautiful friendship? Choose a mode to find your people.
            </p>

            <div>
              {[
                { id: "date" as const, label: "Date", sub: "Find a relationship, something casual, or anything in-between" },
                { id: "bff" as const, label: "BFF", sub: "Make new friends and find your community" },
              ].map(({ id, label, sub }) => (
                <RadioRow
                  key={id} label={label} sublabel={sub}
                  selected={datingMode === id}
                  onClick={() => setDatingMode(id)}
                />
              ))}
            </div>

            <InfoLine text="You'll only be shown to people in the same mode as you." />

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-end">
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 4: Who to meet ─────────────────────────────────────────── */}
        {subStep === 4 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z" />
              </svg>
            </div>
            <Heading>Who would you like to meet?</Heading>
            <p className="text-sm text-gray-500 mb-6">
              You can choose more than one answer and change it any time.
            </p>

            {/* Open-to-all toggle */}
            <div
              className="flex items-center gap-3 py-4 border-b border-gray-200 cursor-pointer select-none"
              onClick={() => { setOpenToAll((v) => !v); if (!openToAll) setGenderPreference([]); }}
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
              <span className="text-base text-gray-900 font-medium">I'm open to dating everyone</span>
            </div>

            <div className={`transition-opacity duration-200 ${openToAll ? "opacity-40 pointer-events-none" : ""}`}>
              {["Men", "Women", "Nonbinary people"].map((g) => {
                const selected = genderPreference.includes(g);
                return (
                  <CheckRow
                    key={g} label={g} selected={selected}
                    onClick={() => setGenderPreference((p) => selected ? p.filter((x) => x !== g) : [...p, g])}
                  />
                );
              })}
            </div>

            <InfoLine text="You'll only be shown to people looking to date your gender." />

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-end">
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 7: Height ───────────────────────────────────────────────── */}
        {subStep === 7 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <Heading>Now, let&apos;s talk about you</Heading>
            <p className="text-sm text-gray-500 mb-6">
              Let&apos;s get the small talk out of the way. We&apos;ll get into the deep and meaningful later.
            </p>

            <p className="text-base font-semibold text-gray-900 mb-3">Your height</p>
            <div
              className="w-full overflow-hidden rounded-xl py-2 mb-6"
              style={{ maxHeight: 360 }}
            >
              <div
                ref={heightListRef}
                className="overflow-y-auto overscroll-contain w-full flex flex-col py-2"
                style={{ height: 340 }}
              >
                {HEIGHT_OPTIONS.map((cm) => {
                  const selected = heightTouched && heightCm === cm;
                  return (
                    <button
                      id={`height-option-${cm}`}
                      key={cm}
                      type="button"
                      onClick={() => {
                        setHeightCm(cm);
                        setHeightTouched(true);
                      }}
                      className={`w-full py-2.5 text-center text-base font-medium transition-colors rounded-lg border-2 ${selected
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      {cm} cm
                    </button>
                  );
                })}
              </div>
            </div>

            {heightError && <InlineError message={heightError} />}

            <div className="mt-auto pt-8 flex items-end justify-between">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setStepError(null);
                  setHeightError(null);
                  try {
                    await apiPost("height", { heightCm });
                    setSubStep(8);
                  } catch (e) {
                    setStepError((e as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
                disabled={loading}
              >
                Skip
              </button>
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 8: Interests ───────────────────────────────────────────── */}
        {subStep === 8 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <Heading>Choose 5 things you're really into</Heading>
            <p className="text-sm text-gray-500 mb-6">
              Add interests to help you match with people who love them too.
            </p>

            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                placeholder="What are you into?"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
              />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">You might like...</p>

            <div className="flex flex-wrap gap-2">
              {filteredInterests.map((interest) => {
                const selected = interests.includes(interest);
                const symbol = INTEREST_SYMBOLS[interest] ?? "•";
                const displayLabel = `${symbol} ${interest}`;
                return (
                  <Pill
                    key={interest}
                    label={displayLabel}
                    selected={selected}
                    onClick={() => {
                      if (selected) setInterests((p) => p.filter((x) => x !== interest));
                      else if (interests.length < 5) setInterests((p) => [...p, interest]);
                    }}
                  />
                );
              })}
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-between">
              <button
                onClick={handleSkip} disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{interests.length}/5 selected</span>
                <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 9: Habits ──────────────────────────────────────────────── */}
        {subStep === 9 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8.25 7.5A4.5 4.5 0 0 1 12 3m0 0a4.5 4.5 0 0 1 3.75 4.5m-7.5 0h7.5M8.25 12A4.5 4.5 0 0 0 12 16.5m0 0A4.5 4.5 0 0 0 15.75 12m-7.5 0h7.5" />
              </svg>
            </div>
            <Heading>Let's talk about your lifestyle and habits</Heading>
            <p className="text-sm text-gray-500 mb-8">
              Share as much about your habits as you're comfortable with.
            </p>

            <p className="text-sm font-semibold text-gray-700 mb-3">Drinking</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {DRINKING_OPTIONS.map((opt) => (
                <Pill
                  key={opt} label={opt}
                  selected={drinkingHabit === opt}
                  onClick={() => setDrinkingHabit(drinkingHabit === opt ? "" : opt)}
                />
              ))}
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">Smoking</p>
            <div className="flex flex-wrap gap-2">
              {SMOKING_OPTIONS.map((opt) => (
                <Pill
                  key={opt} label={opt}
                  selected={smokingHabit === opt}
                  onClick={() => setSmokingHabit(smokingHabit === opt ? "" : opt)}
                />
              ))}
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-between">
              <button
                onClick={handleSkip} disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}

        {/* ── STEP 11: What's important in your life? (Date only) ─────────── */}
        {subStep === 11 && datingMode === "date" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-start mb-6">
              <svg
                className="w-12 h-12 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7.03 3 3 6.589 3 11c0 2.347 1.169 4.466 3.06 5.953L6 21l3.39-1.695A10.3 10.3 0 0 0 12 19c4.97 0 9-3.589 9-8s-4.03-8-9-8z"
                />
              </svg>
            </div>

            <Heading>What&apos;s important in your life?</Heading>
            <p className="text-sm text-gray-500 mb-4">
              This is sensitive information that will be on your profile. It helps you find people, and people find you.
              It&apos;s totally optional.
            </p>

            <button
              type="button"
              className="text-xs text-start font-medium underline mb-4 text-gray-500"
              onClick={(e) => e.preventDefault()}
            >
              Why we&apos;re asking
            </button>

            {/* Scrollable chip area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Religion</p>
                <div className="flex flex-wrap gap-2">
                  {RELIGION_OPTIONS.map((opt) => {
                    const selected = religion.includes(opt);
                    const label = `${RELIGION_SYMBOLS[opt] ?? "•"} ${opt}`;
                    return (
                      <Pill
                        key={opt}
                        label={label}
                        selected={selected}
                        onClick={() =>
                          setReligion((prev) =>
                            selected ? prev.filter((v) => v !== opt) : [...prev, opt],
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Politics</p>
                <div className="flex flex-wrap gap-2">
                  {POLITICS_OPTIONS.map((opt) => {
                    const selected = politics.includes(opt);
                    const label = `${POLITICS_SYMBOLS[opt] ?? "•"} ${opt}`;
                    return (
                      <Pill
                        key={opt}
                        label={label}
                        selected={selected}
                        onClick={() =>
                          setPolitics((prev) =>
                            selected ? prev.filter((v) => v !== opt) : [...prev, opt],
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {stepError && <InlineError message={stepError} />}

            {/* Fixed bottom actions within the step */}
            <div className="mt-4 pt-4 pb-2 flex items-end justify-between">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <Fab onClick={handleNext} disabled={!canProceed} loading={loading} />
            </div>
          </div>
        )}
        {/* ── STEP 13: Your life (BFF only) ───────────────────────────────── */}
        {subStep === 13 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-start mb-6">
              <svg
                className="w-12 h-12 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3C7.03 3 3 6.589 3 11c0 2.347 1.169 4.466 3.06 5.953L6 21l3.39-1.695A10.3 10.3 0 0 0 12 19c4.97 0 9-3.589 9-8s-4.03-8-9-8z"
                />
              </svg>
            </div>

            <Heading>Your life</Heading>
            <p className="text-sm text-gray-800 mb-2">
              Pick <b>up to 3</b> to find friends with <b>similar life experiences</b>.
            </p>
            <p className="text-xs text-gray-500 mb-4">Shown on my profile</p>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {LIFE_EXPERIENCE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {section.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {section.options.map((opt) => {
                      const selected = lifeExperiences.includes(opt);
                      const symbol = LIFE_EXPERIENCE_SYMBOLS[opt] ?? "•";
                      const label = `${symbol} ${opt}`;
                      return (
                        <Pill
                          key={opt}
                          label={label}
                          selected={selected}
                          onClick={() => {
                            setLifeExperiences((prev) => {
                              if (selected) return prev.filter((v) => v !== opt);
                              if (prev.length >= 3) return prev;
                              return [...prev, opt];
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-4 pt-4 pb-2 flex items-end justify-between">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setStepError(null);
                  try {
                    await apiPost("life-experiences", { experiences: [] });
                    setSubStep(14);
                  } catch (e) {
                    setStepError((e as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {lifeExperiences.length}/3 selected
                </span>
                <Fab
                  onClick={async () => {
                    if (!lifeExperiences.length) return;
                    setLoading(true);
                    setStepError(null);
                    try {
                      await apiPost("life-experiences", {
                        experiences: lifeExperiences,
                      });
                      setSubStep(14);
                    } catch (e) {
                      setStepError((e as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={lifeExperiences.length === 0 || loading}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
        {/* ── STEP 14: BFF interests (BFF only) ───────────────────────────── */}
        {subStep === 14 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg className="w-12 h-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <Heading>Choose 5 things you&apos;re really into</Heading>
            <p className="text-sm text-gray-500 mb-6">
              Proud foodie or big on bouldering? Add interests to your profile to help you match with people who love them too.
            </p>

            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                placeholder="What are you into?"
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
              />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">You might like...</p>

            <div className="flex flex-wrap gap-2">
              {filteredInterests.map((interest) => {
                const selected = bffInterests.includes(interest);
                const symbol = INTEREST_SYMBOLS[interest] ?? "•";
                const displayLabel = `${symbol} ${interest}`;
                return (
                  <Pill
                    key={interest}
                    label={displayLabel}
                    selected={selected}
                    onClick={() => {
                      if (selected) setBffInterests((p) => p.filter((x) => x !== interest));
                      else if (bffInterests.length < 5) setBffInterests((p) => [...p, interest]);
                    }}
                  />
                );
              })}
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-between">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setStepError(null);
                  try {
                    await apiPost("bff-interests", { interests: [] });
                    setSubStep(15);
                  } catch (e) {
                    setStepError((e as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {bffInterests.length}/5 selected
                </span>
                <Fab
                  onClick={async () => {
                    if (!bffInterests.length) return;
                    setLoading(true);
                    setStepError(null);
                    try {
                      await apiPost("bff-interests", { interests: bffInterests });
                      setSubStep(15);
                    } catch (e) {
                      setStepError((e as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={bffInterests.length === 0 || loading}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
        {/* ── STEP 15: Your relationship (BFF only) ───────────────────────────── */}
        {subStep === 15 && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-start mb-6">
              <svg
                className="w-12 h-12 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <Heading>Your relationship</Heading>
            <p className="text-sm text-gray-500 mb-2">
              You can change this later. It&apos;ll show on your profile.
            </p>

            <div className="mt-4">
              {[
                "Single",
                "In a relationship",
                "Engaged",
                "Married",
                "It's complicated",
                "Divorced",
                "Widowed",
              ].map((option) => (
                <RadioRow
                  key={option}
                  label={option}
                  selected={relationshipStatus === option}
                  onClick={() => setRelationshipStatus(option)}
                />
              ))}
            </div>

            {stepError && <InlineError message={stepError} />}

            <div className="mt-auto pt-8 flex items-end justify-between">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setStepError(null);
                  try {
                    await apiPost("relationship-status", {});
                    await finishOnboarding();
                  } catch (e) {
                    setStepError((e as Error).message);
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="text-sm font-medium hover:underline disabled:opacity-50"
                style={{ color: ACCENT }}
              >
                Skip
              </button>
              <Fab
                onClick={async () => {
                  if (!relationshipStatus) return;
                  setLoading(true);
                  setStepError(null);
                  try {
                    await apiPost("relationship-status", { relationshipStatus });
                    await finishOnboarding();
                  } catch (e) {
                    setStepError((e as Error).message);
                    setLoading(false);
                  }
                }}
                disabled={!canProceed || loading}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}