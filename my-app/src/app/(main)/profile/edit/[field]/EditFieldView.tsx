"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
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
  photos: "My Photos",
  interests: "Interests",
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

const HOBBY_OPTIONS = [
  "Travel", "Music", "Cooking", "Fitness", "Reading",
  "Movies", "Hiking", "Gaming", "Art", "Photography",
  "Dancing", "Yoga", "Sports", "Foodie", "Pets",
  "Fashion", "Tech", "Nature", "Meditation", "DIY",
];

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

function SaveBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          width: "100%", padding: "16px",
          background: loading ? `${DARK}80` : DARK,
          color: BG, fontFamily: SANS, fontSize: 15, fontWeight: 700,
          border: `2.5px solid ${DARK}`, borderRadius: 14,
          boxShadow: loading ? "none" : `4px 4px 0 ${ACCENT}`,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          letterSpacing: 0.2,
        }}
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </div>
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
        background: selected ? `${DARK}08` : CARD,
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

function InterestsEditor({ initial, onSave, loading }: { initial: string[]; onSave: (v: string[]) => void; loading: boolean }) {
  const [selected, setSelected] = useState<string[]>(initial);
  function toggle(h: string) {
    setSelected(p => p.includes(h) ? p.filter(x => x !== h) : p.length < 10 ? [...p, h] : p);
  }
  return (
    <>
      <div style={{ padding: "16px 20px 8px" }}>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Select up to 10 interests</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "0 20px 8px" }}>
        {HOBBY_OPTIONS.map(h => (
          <Chip key={h} label={h} selected={selected.includes(h)} onToggle={() => toggle(h)} />
        ))}
      </div>
      <SaveBtn loading={loading} onClick={() => onSave(selected)} />
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

function PhotosEditor({ initial }: { initial: { url: string; order: number }[] }) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/onboarding/photos", { method: "POST", body: fd });
      if (res.ok) {
        const json = await res.json();
        setPhotos(p => [...p, { url: json.data?.url ?? json.url, order: p.length }]);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: "16px 20px 32px" }}>
      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px", fontFamily: SANS }}>
        Add at least 2 photos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {photos.map((p, i) => (
          <div key={i} style={{ aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", border: `2px solid ${DARK}`, boxShadow: `2px 2px 0 ${DARK}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

  async function post(url: string, body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push("/profile"), 700);
      }
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

        {field === "interests" && (
          <InterestsEditor
            initial={interests?.hobbies?.filter(h => h && h !== "Not specified") ?? []}
            onSave={hobbies => post("/api/onboarding/interests", { hobbies, favouriteActivities: interests?.favouriteActivities ?? [] })}
            loading={loading}
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
            initial={personality?.socialLevel ?? undefined}
            onSave={socialLevel => post("/api/onboarding/personality", { socialLevel, conversationStyle: personality?.conversationStyle ?? "Casual" })}
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
