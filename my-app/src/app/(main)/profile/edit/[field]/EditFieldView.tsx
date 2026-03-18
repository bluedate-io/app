"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus } from "lucide-react";
import type { EditField } from "./page";
import type { ProfileData } from "../../page";

// ─── Config ───────────────────────────────────────────────────────────────────

const FIELD_TITLES: Record<EditField, string> = {
  photos: "My Photos",
  interests: "My Interests",
  "looking-for": "Looking For",
  height: "My Height",
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
];

const KIDS_STATUS_OPTIONS = [
  { value: "Don't have kids", label: "Don't have kids" },
  { value: "Have kids", label: "Have kids" },
];

const KIDS_PLAN_OPTIONS = [
  "Want kids",
  "Open to kids",
  "Don't want kids",
  "Not sure",
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
      className="flex items-center gap-3 px-4 pt-5 pb-4"
      style={{ background: "#F5F0FB" }}
    >
      <button
        onClick={onBack}
        className="flex items-center justify-center rounded-xl"
        style={{ width: 38, height: 38, background: "#fff", boxShadow: "0 1px 4px rgba(90,42,106,0.10)" }}
      >
        <ArrowLeft size={18} style={{ color: "#7A2D8E" }} />
      </button>
      <h1 className="text-lg font-bold flex-1" style={{ color: "#1A0A2E" }}>
        {title}
      </h1>
    </div>
  );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="px-4 pb-8 pt-4">
      <button
        onClick={onClick}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl text-white text-base font-bold"
        style={{
          background: loading ? "#C4B0D8" : "linear-gradient(135deg,#A33BB5,#6A2F8A)",
        }}
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function OptionCard({
  selected,
  onToggle,
  children,
  multi,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all"
      style={{
        background: selected ? "#F5EAFF" : "#fff",
        border: `2px solid ${selected ? "#A33BB5" : "#F3EFF8"}`,
        boxShadow: "0 1px 3px rgba(90,42,106,0.06)",
      }}
    >
      {children}
      <div
        className="flex items-center justify-center rounded-full shrink-0 ml-3"
        style={{
          width: 24,
          height: 24,
          background: selected ? "#A33BB5" : "#F3EFF8",
          border: `2px solid ${selected ? "#A33BB5" : "#C4B0D8"}`,
        }}
      >
        {selected && <Check size={13} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ─── Field editors ────────────────────────────────────────────────────────────

function InterestsEditor({
  initial,
  onSave,
  loading,
}: {
  initial: string[];
  onSave: (v: string[]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initial);

  function toggle(h: string) {
    setSelected(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : prev.length < 10 ? [...prev, h] : prev,
    );
  }

  return (
    <>
      <div className="px-4 pb-2">
        <p className="text-sm" style={{ color: "#9B87B0" }}>
          Pick up to 10 interests that describe you
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5 px-4 pb-4">
        {HOBBY_OPTIONS.map(h => {
          const sel = selected.includes(h);
          return (
            <button
              key={h}
              onClick={() => toggle(h)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: sel ? "#A33BB5" : "#fff",
                color: sel ? "#fff" : "#7A2D8E",
                border: `2px solid ${sel ? "#A33BB5" : "#E8DFF5"}`,
              }}
            >
              {h}
            </button>
          );
        })}
      </div>
      <SaveButton loading={loading} onClick={() => onSave(selected)} />
    </>
  );
}

function LookingForEditor({
  initial,
  onSave,
  loading,
}: {
  initial: string[];
  onSave: (v: string[]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initial);

  function toggle(v: string) {
    setSelected(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v],
    );
  }

  return (
    <>
      <div className="px-4 pb-3">
        <p className="text-sm" style={{ color: "#9B87B0" }}>
          Pick at least 2 that apply to you
        </p>
      </div>
      <div className="flex flex-col gap-3 px-4">
        {RELATIONSHIP_GOALS.map(g => (
          <OptionCard key={g} selected={selected.includes(g)} onToggle={() => toggle(g)} multi>
            <span className="text-sm font-semibold" style={{ color: "#1A0A2E" }}>{g}</span>
          </OptionCard>
        ))}
      </div>
      <SaveButton loading={loading} onClick={() => onSave(selected)} />
    </>
  );
}

function HeightEditor({
  initial,
  onSave,
  loading,
}: {
  initial?: number;
  onSave: (v: number) => void;
  loading: boolean;
}) {
  const [cm, setCm] = useState<string>(initial ? String(initial) : "");

  return (
    <>
      <div className="px-4 pb-4">
        <p className="text-sm mb-4" style={{ color: "#9B87B0" }}>
          Enter your height in centimetres
        </p>
        <div
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
          style={{ background: "#fff", border: "2px solid #E8DFF5" }}
        >
          <input
            type="number"
            min={91}
            max={220}
            value={cm}
            onChange={e => setCm(e.target.value)}
            placeholder="e.g. 170"
            className="flex-1 text-base font-semibold bg-transparent outline-none"
            style={{ color: "#1A0A2E" }}
          />
          <span className="text-sm font-medium" style={{ color: "#9B87B0" }}>cm</span>
        </div>
        {cm && (
          <p className="text-xs mt-2" style={{ color: "#9B87B0" }}>
            ≈ {Math.floor(Number(cm) / 30.48)}′{Math.round((Number(cm) % 30.48) / 2.54)}″
          </p>
        )}
      </div>
      <SaveButton
        loading={loading}
        onClick={() => onSave(Number(cm))}
      />
    </>
  );
}

function DrinkingEditor({
  initial,
  onSave,
  loading,
}: {
  initial?: string;
  onSave: (v: string) => void;
  loading: boolean;
}) {
  const [val, setVal] = useState(initial ?? "");

  return (
    <>
      <div className="flex flex-col gap-3 px-4">
        {DRINKING_OPTIONS.map(opt => (
          <OptionCard key={opt.value} selected={val === opt.value} onToggle={() => setVal(opt.value)}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1A0A2E" }}>{opt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>{opt.desc}</p>
            </div>
          </OptionCard>
        ))}
      </div>
      <SaveButton loading={loading} onClick={() => onSave(val)} />
    </>
  );
}

function ReligionEditor({
  initial,
  onSave,
  loading,
}: {
  initial?: string;
  onSave: (v: string) => void;
  loading: boolean;
}) {
  const [val, setVal] = useState(initial ?? "");

  return (
    <>
      <div className="flex flex-wrap gap-2.5 px-4 pb-4">
        {RELIGION_OPTIONS.map(r => {
          const sel = val === r;
          return (
            <button
              key={r}
              onClick={() => setVal(r)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: sel ? "#A33BB5" : "#fff",
                color: sel ? "#fff" : "#7A2D8E",
                border: `2px solid ${sel ? "#A33BB5" : "#E8DFF5"}`,
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
      <SaveButton loading={loading} onClick={() => onSave(val)} />
    </>
  );
}

function FamilyEditor({
  initialStatus,
  initialPref,
  onSave,
  loading,
}: {
  initialStatus?: string;
  initialPref?: string;
  onSave: (status: string, pref: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState(initialStatus ?? "");
  const [pref, setPref] = useState(initialPref ?? "");

  return (
    <>
      <div className="px-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B87B0" }}>
          Do you have kids?
        </p>
        <div className="flex gap-3">
          {KIDS_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: status === opt.value ? "#A33BB5" : "#fff",
                color: status === opt.value ? "#fff" : "#7A2D8E",
                border: `2px solid ${status === opt.value ? "#A33BB5" : "#E8DFF5"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B87B0" }}>
          Future plans
        </p>
        <div className="flex flex-col gap-3">
          {KIDS_PLAN_OPTIONS.map(p => (
            <OptionCard key={p} selected={pref === p} onToggle={() => setPref(p)}>
              <span className="text-sm font-semibold" style={{ color: "#1A0A2E" }}>{p}</span>
            </OptionCard>
          ))}
        </div>
      </div>

      <SaveButton loading={loading} onClick={() => onSave(status, pref)} />
    </>
  );
}

function PhotosEditor({
  initial,
}: {
  initial: { url: string; order: number }[];
}) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/onboarding/photos", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const json = await res.json();
        setPhotos(prev => [
          ...prev,
          { url: json.data?.url ?? json.url, order: prev.length },
        ]);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-4 pb-8">
      <p className="text-sm mb-4" style={{ color: "#9B87B0" }}>
        Add at least 2 photos. Tap + to upload.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative" style={{ aspectRatio: "3/4" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 16,
              }}
            />
          </div>
        ))}

        {/* Add slot */}
        {photos.length < 9 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center rounded-2xl"
            style={{
              aspectRatio: "3/4",
              background: "#fff",
              border: "2px dashed #C4B0D8",
            }}
          >
            {uploading ? (
              <div
                className="rounded-full"
                style={{ width: 24, height: 24, border: "3px solid #A33BB5", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <Plus size={28} style={{ color: "#C4B0D8" }} />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
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
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => router.push("/profile"), 600);
    } finally {
      setLoading(false);
    }
  }

  const { preferences, interests, personality, photos } = data;

  return (
    <div
      className="min-h-full pb-6"
      style={{ background: "#F5F0FB", fontFamily: "var(--font-geist-sans,sans-serif)" }}
    >
      <Header title={FIELD_TITLES[field]} onBack={() => router.push("/profile")} />

      {saved && (
        <div
          className="mx-4 mb-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{ background: "#E8F9F0", border: "1px solid #6FD8A0" }}
        >
          <Check size={16} style={{ color: "#22A06B" }} />
          <span className="text-sm font-semibold" style={{ color: "#22A06B" }}>Saved!</span>
        </div>
      )}

      {field === "interests" && (
        <InterestsEditor
          initial={interests?.hobbies?.filter(h => h && h !== "Not specified") ?? []}
          onSave={hobbies =>
            post("/api/onboarding/interests", {
              hobbies,
              favouriteActivities: interests?.favouriteActivities ?? [],
            })
          }
          loading={loading}
        />
      )}

      {field === "looking-for" && (
        <LookingForEditor
          initial={preferences?.relationshipGoals?.filter(Boolean) ?? []}
          onSave={goals =>
            post("/api/onboarding/relationship-goals", { relationshipGoals: goals })
          }
          loading={loading}
        />
      )}

      {field === "height" && (
        <HeightEditor
          initial={preferences?.heightCm}
          onSave={heightCm => post("/api/onboarding/height", { heightCm })}
          loading={loading}
        />
      )}

      {field === "drinking" && (
        <DrinkingEditor
          initial={personality?.socialLevel}
          onSave={socialLevel =>
            post("/api/onboarding/personality", {
              socialLevel,
              conversationStyle: personality?.conversationStyle ?? "Casual",
            })
          }
          loading={loading}
        />
      )}

      {field === "religion" && (
        <ReligionEditor
          initial={personality?.religion?.[0]}
          onSave={religion =>
            post("/api/onboarding/important-life", {
              religion: [religion],
              politics: [],
            })
          }
          loading={loading}
        />
      )}

      {field === "family" && (
        <FamilyEditor
          initialStatus={personality?.kidsStatus}
          initialPref={personality?.kidsPreference}
          onSave={(kidsStatus, kidsPreference) =>
            post("/api/onboarding/family-plans", { kidsStatus, kidsPreference })
          }
          loading={loading}
        />
      )}

      {field === "photos" && (
        <PhotosEditor initial={photos} />
      )}
    </div>
  );
}
