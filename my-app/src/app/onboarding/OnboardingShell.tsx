"use client";
// ─── OnboardingShell — Client Component ──────────────────────────────────────
// Renders the correct step form and handles POST → API submission.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingStatus } from "./page";

interface Props {
  step: string;
  token: string;
  status: OnboardingStatus;
}

const STEP_TITLES: Record<string, string> = {
  profile:      "Tell us about yourself",
  preferences:  "Your dating preferences",
  interests:    "What do you love?",
  personality:  "Your personality",
  availability: "When are you free?",
  photos:       "Add your photos",
};

export default function OnboardingShell({ step, token, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (path: string, body: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Something went wrong");
      router.refresh(); // let the RSC re-evaluate the current step
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{STEP_TITLES[step]}</h1>
      <p className="text-sm text-gray-400 mb-6 capitalize">{step} · bluedate</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {step === "profile"      && <ProfileForm      onSubmit={(d) => post("profile", d)}      loading={loading} />}
      {step === "preferences"  && <PreferencesForm  onSubmit={(d) => post("preferences", d)}  loading={loading} />}
      {step === "interests"    && <InterestsForm    onSubmit={(d) => post("interests", d)}    loading={loading} />}
      {step === "personality"  && <PersonalityForm  onSubmit={(d) => post("personality", d)}  loading={loading} />}
      {step === "availability" && <AvailabilityForm onSubmit={(d) => post("availability", d)} loading={loading} />}
      {step === "photos"       && <PhotosStep       token={token} status={status} onDone={() => router.refresh()} />}
    </div>
  );
}

// ─── Step forms ───────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

function SubmitButton({ loading, label = "Continue →" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                 hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────
function ProfileForm({ onSubmit, loading }: { onSubmit: (d: unknown) => void; loading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      fullName: fd.get("fullName"),
      nickname: fd.get("nickname") || undefined,
      age: Number(fd.get("age")),
      city: fd.get("city"),
      bio: fd.get("bio") || undefined,
    });
  };
  return (
    <form onSubmit={handleSubmit}>
      <Field label="Full name *"><input name="fullName" required className={inputCls} placeholder="Jane Doe" /></Field>
      <Field label="Nickname"><input name="nickname" className={inputCls} placeholder="Jay (optional)" /></Field>
      <Field label="Age *"><input name="age" type="number" min={18} max={100} required className={inputCls} /></Field>
      <Field label="City *"><input name="city" required className={inputCls} placeholder="New York" /></Field>
      <Field label="Bio">
        <textarea name="bio" rows={3} className={inputCls} placeholder="Tell people a bit about yourself…" />
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
}

// ── Preferences ───────────────────────────────────────────────────────────────
const GENDERS = ["man", "woman", "non-binary", "other"];
const INTENTS = ["casual", "serious", "friendship", "open", "undecided"];

function PreferencesForm({ onSubmit, loading }: { onSubmit: (d: unknown) => void; loading: boolean }) {
  const [genderPref, setGenderPref] = useState<string[]>([]);
  const toggle = (g: string) =>
    setGenderPref((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      genderIdentity: fd.get("genderIdentity"),
      genderPreference: genderPref,
      ageRangeMin: Number(fd.get("ageRangeMin")),
      ageRangeMax: Number(fd.get("ageRangeMax")),
      relationshipIntent: fd.get("relationshipIntent"),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="I identify as *">
        <select name="genderIdentity" required className={inputCls}>
          <option value="">Select…</option>
          {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="I'm interested in * (select all that apply)">
        <div className="flex flex-wrap gap-2 mt-1">
          {GENDERS.map((g) => (
            <button key={g} type="button" onClick={() => toggle(g)}
              className={`px-3 py-1 rounded-full text-sm border transition ${genderPref.includes(g) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>
              {g}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-3">
        <Field label="Min age *"><input name="ageRangeMin" type="number" min={18} max={99} required className={inputCls} defaultValue={21} /></Field>
        <Field label="Max age *"><input name="ageRangeMax" type="number" min={18} max={100} required className={inputCls} defaultValue={35} /></Field>
      </div>
      <Field label="Looking for *">
        <select name="relationshipIntent" required className={inputCls}>
          <option value="">Select…</option>
          {INTENTS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
}

// ── Interests ─────────────────────────────────────────────────────────────────
function TagInput({ label, name }: { label: string; name: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setInput("");
  };
  return (
    <Field label={label}>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          className={inputCls} placeholder="Type and press Enter" />
        <button type="button" onClick={add} className="px-3 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-medium">Add</button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">
            {t}
            <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="hover:text-red-500">×</button>
          </span>
        ))}
      </div>
    </Field>
  );
}

function InterestsForm({ onSubmit, loading }: { onSubmit: (d: unknown) => void; loading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      hobbies: JSON.parse(fd.get("hobbies") as string || "[]"),
      favouriteActivities: JSON.parse(fd.get("favouriteActivities") as string || "[]"),
      musicTaste: JSON.parse(fd.get("musicTaste") as string || "[]"),
      foodTaste: JSON.parse(fd.get("foodTaste") as string || "[]"),
    });
  };
  return (
    <form onSubmit={handleSubmit}>
      <TagInput label="Hobbies *" name="hobbies" />
      <TagInput label="Favourite activities" name="favouriteActivities" />
      <TagInput label="Music taste" name="musicTaste" />
      <TagInput label="Food taste" name="foodTaste" />
      <SubmitButton loading={loading} />
    </form>
  );
}

// ── Personality ───────────────────────────────────────────────────────────────
function PersonalityForm({ onSubmit, loading }: { onSubmit: (d: unknown) => void; loading: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      socialLevel: fd.get("socialLevel"),
      conversationStyle: fd.get("conversationStyle"),
      funFact: fd.get("funFact") || undefined,
    });
  };
  return (
    <form onSubmit={handleSubmit}>
      <Field label="Social level *">
        <select name="socialLevel" required className={inputCls}>
          <option value="">Select…</option>
          {["introvert", "ambivert", "extrovert"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Conversation style *">
        <select name="conversationStyle" required className={inputCls}>
          <option value="">Select…</option>
          {["texter", "caller", "voice_notes", "mixed"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Fun fact about you">
        <textarea name="funFact" rows={2} className={inputCls} placeholder="I once hiked 30km in the rain…" />
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
}

// ── Availability ──────────────────────────────────────────────────────────────
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TIMES = ["morning", "afternoon", "evening", "night"];

function AvailabilityForm({ onSubmit, loading }: { onSubmit: (d: unknown) => void; loading: boolean }) {
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const toggleDay = (d: string) => setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  const toggleTime = (t: string) => setTimes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ days, times });
  };

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border capitalize transition ${active ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Days I'm usually free *">
        <div className="flex flex-wrap gap-2 mt-1">{DAYS.map((d) => chip(d, days.includes(d), () => toggleDay(d)))}</div>
      </Field>
      <Field label="Times I prefer *">
        <div className="flex flex-wrap gap-2 mt-1">{TIMES.map((t) => chip(t, times.includes(t), () => toggleTime(t)))}</div>
      </Field>
      <SubmitButton loading={loading} />
    </form>
  );
}

// ── Photos ────────────────────────────────────────────────────────────────────
function PhotosStep({
  token,
  status,
  onDone,
}: {
  token: string;
  status: OnboardingStatus;
  onDone: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(status.photoCount);
  const [error, setError] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    for (const file of files.slice(0, 4 - count)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("order", String(count));
      const res = await fetch("/api/onboarding/photos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) setCount((c) => c + 1);
      else {
        const j = await res.json();
        setError(j.error?.message ?? "Upload failed");
      }
    }
    setUploading(false);
  };

  const canFinish = count >= 2;

  const complete = async () => {
    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) onDone();
    else {
      const j = await res.json();
      setError(j.error?.message ?? "Could not complete onboarding");
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Upload 2–4 photos. {count}/4 uploaded.
      </p>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <label className="block w-full border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center cursor-pointer hover:bg-indigo-50 transition">
        <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading || count >= 4} />
        <span className="text-indigo-500 font-medium text-sm">
          {uploading ? "Uploading…" : count >= 4 ? "Maximum photos reached" : "Click to upload photos"}
        </span>
      </label>
      {canFinish && (
        <button onClick={complete}
          className="w-full mt-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition">
          Finish setup →
        </button>
      )}
    </div>
  );
}
