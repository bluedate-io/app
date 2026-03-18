"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, ChevronRight, User, Copy, Check } from "lucide-react";

type ProfileCard = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  photoUrl: string | null;
  lookingFor: string | null;
  heightCm: number | null;
  ageRange: string | null;
  interestedIn: string[];
  religion: string[];
  kidsStatus: string | null;
  kidsPreference: string | null;
  socialLevel: string | null;
  conversationStyle: string | null;
  hobbies: string[];
  activities: string[];
  bio: string | null;
};

type ModalState =
  | { open: false }
  | { open: true; woman: ProfileCard; man: ProfileCard; blurb: string; saving: boolean };

type LoadState =
  | { status: "loading" }
  | { status: "ready"; women: ProfileCard[]; men: ProfileCard[]; wi: number; mi: number }
  | { status: "error" };

function buildPrompt(a: ProfileCard, b: ProfileCard): string {
  const v = (x: string | number | null | undefined) => x ?? "—";
  return `Here are the two users you're introducing:

User A:
- Name: ${v(a.name)}
- Age: ${v(a.age)}
- City: ${v(a.city)}
- About them: ${v(a.bio)}
- What they're looking for: ${v(a.lookingFor)}
- Hobbies: ${a.hobbies.length ? a.hobbies.join(", ") : "—"}
- Religion: ${a.religion.length ? a.religion.join(", ") : "—"}

User B:
- Name: ${v(b.name)}
- Age: ${v(b.age)}
- City: ${v(b.city)}
- About them: ${v(b.bio)}
- What they're looking for: ${v(b.lookingFor)}
- Hobbies: ${b.hobbies.length ? b.hobbies.join(", ") : "—"}
- Religion: ${b.religion.length ? b.religion.join(", ") : "—"}

Write the match blurb. Address it to both of them (e.g. "Hey ${a.name} and ${b.name}...").`;
}

export default function MatchUsersView() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/match-users/candidates");
      const { data } = await res.json();
      setState({ status: "ready", women: data.women, men: data.men, wi: 0, mi: 0, matching: false });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openMatchModal() {
    if (state.status !== "ready") return;
    const woman = state.women[state.wi];
    const man = state.men[state.mi];
    if (!woman || !man) return;
    setModal({ open: true, woman, man, blurb: "", saving: false });
  }

  async function saveMatch() {
    if (!modal.open) return;
    const { woman, man, blurb } = modal;
    setModal((m) => m.open ? { ...m, saving: true } : m);
    await fetch("/api/admin/match-users/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1: woman.userId, userId2: man.userId, blurb }),
    });
    setModal({ open: false });
    setState((s) => {
      if (s.status !== "ready") return s;
      const newWomen = s.women.filter((w) => w.userId !== woman.userId);
      const newMen = s.men.filter((m) => m.userId !== man.userId);
      return {
        ...s,
        women: newWomen,
        men: newMen,
        wi: Math.min(s.wi, Math.max(0, newWomen.length - 1)),
        mi: Math.min(s.mi, Math.max(0, newMen.length - 1)),
      };
    });
    setCopied(false);
  }

  function skipWoman() {
    setState((s) => {
      if (s.status !== "ready" || s.women.length === 0) return s;
      return { ...s, wi: (s.wi + 1) % s.women.length };
    });
    setCopied(false);
  }

  function skipMan() {
    setState((s) => {
      if (s.status !== "ready" || s.men.length === 0) return s;
      return { ...s, mi: (s.mi + 1) % s.men.length };
    });
    setCopied(false);
  }

  if (state.status === "loading") return <SkeletonPair />;

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center py-32">
        <p className="text-sm mb-4" style={{ color: "#DC2626" }}>Failed to load candidates.</p>
        <button onClick={load} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}>
          Retry
        </button>
      </div>
    );
  }

  const { women, men, wi, mi } = state;
  const woman = women[wi] ?? null;
  const man = men[mi] ?? null;
  const canMatch = !!woman && !!man;
  const prompt = woman && man ? buildPrompt(woman, man) : "";

  if (!woman && !man) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border py-32" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
        <Heart size={36} strokeWidth={1.5} style={{ color: "#C060C0" }} />
        <p className="mt-4 text-base font-semibold" style={{ color: "#1A0A2E" }}>No more users to match</p>
        <p className="mt-1 text-sm" style={{ color: "#9B87B0" }}>All eligible users have been matched.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex justify-between text-xs mb-4 px-1" style={{ color: "#9B87B0" }}>
        <span>{women.length} women · viewing {wi + 1}</span>
        <span>{men.length} men · viewing {mi + 1}</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div>
          {woman ? <ProfileCardView card={woman} label="She" /> : <EmptySlot label="No more women" />}
          <button
            onClick={skipWoman}
            disabled={!woman}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
          >
            Skip <ChevronRight size={14} />
          </button>
        </div>
        <div>
          {man ? <ProfileCardView card={man} label="He" /> : <EmptySlot label="No more men" />}
          <button
            onClick={skipMan}
            disabled={!man}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
          >
            Skip <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Prompt textarea */}
      {prompt && (
        <div className="mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#F0EBFA" }}>
            <p className="text-xs font-semibold" style={{ color: "#9B87B0" }}>Blurb prompt — paste into Claude</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={copied
                ? { borderColor: "#6B5E7A", color: "#166534", backgroundColor: "#F0FDF4" }
                : { borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#FAF8FF" }
              }
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            rows={18}
            className="w-full px-4 py-3 text-xs font-mono resize-none focus:outline-none"
            style={{ color: "#1A0A2E", backgroundColor: "#fff", lineHeight: 1.7 }}
          />
        </div>
      )}

      {/* Match button */}
      <div className="flex justify-center">
        <button
          onClick={openMatchModal}
          disabled={!canMatch}
          className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
        >
          <Heart size={16} />
          Match
        </button>
      </div>

      {/* Blurb modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}
        >
          <div className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: "#fff" }}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F0EBFA" }}>
              <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>
                Why do they match?
              </p>
              <p className="text-xs mt-1" style={{ color: "#9B87B0" }}>
                {modal.woman.name} &amp; {modal.man.name} — write a short blurb explaining why.
              </p>
            </div>

            {/* Textarea */}
            <div className="px-6 py-4">
              <textarea
                autoFocus
                placeholder="They both love hiking and have a dry sense of humour..."
                value={modal.blurb}
                onChange={(e) => setModal((m) => m.open ? { ...m, blurb: e.target.value } : m)}
                rows={6}
                className="w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none"
                style={{ borderColor: "#EDE8F7", color: "#1A0A2E", lineHeight: 1.7 }}
              />
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setModal({ open: false })}
                disabled={modal.saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-50"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                Cancel
              </button>
              <button
                onClick={saveMatch}
                disabled={modal.saving || !modal.blurb.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
              >
                <Heart size={14} />
                {modal.saving ? "Saving…" : "Save Match"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCardView({ card, label }: { card: ProfileCard; label: string }) {
  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm bg-white" style={{ borderColor: "#EDE8F7" }}>
      <div className="relative w-full" style={{ height: 240 }}>
        {card.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={card.photoUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0FB" }}>
            <User size={40} strokeWidth={1} style={{ color: "#C060C0" }} />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}>
          {label}
        </span>
      </div>
      <div className="px-4 py-4">
        <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>
          {card.name}
          {card.age && <span className="font-normal text-sm" style={{ color: "#6B5E7A" }}>, {card.age}</span>}
        </p>
        {card.city && <p className="text-xs mt-0.5 mb-3" style={{ color: "#9B87B0" }}>{card.city}</p>}
        <div className="flex flex-col gap-1.5 mb-3">
          <InfoRow label="Looking for"   value={card.lookingFor} />
          <InfoRow label="Interested in" value={card.interestedIn.length ? card.interestedIn.join(", ") : null} />
          <InfoRow label="Age range"     value={card.ageRange} />
          <InfoRow label="Height"        value={card.heightCm ? `${card.heightCm} cm` : null} />
          <InfoRow label="Religion"      value={card.religion.length ? card.religion.join(", ") : null} />
          <InfoRow label="Has kids"      value={card.kidsStatus} />
          <InfoRow label="Wants kids"    value={card.kidsPreference} />
          <InfoRow label="Social"        value={card.socialLevel} />
          <InfoRow label="Conversation"  value={card.conversationStyle} />
        </div>
        {card.hobbies.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium mb-1.5" style={{ color: "#9B87B0" }}>Hobbies</p>
            <div className="flex flex-wrap gap-1">
              {card.hobbies.map((h) => (
                <span key={h} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#F0EBFA", color: "#6B5E7A" }}>{h}</span>
              ))}
            </div>
          </div>
        )}
        {card.activities.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium mb-1.5" style={{ color: "#9B87B0" }}>Activities</p>
            <div className="flex flex-wrap gap-1">
              {card.activities.map((a) => (
                <span key={a} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#F0EBFA", color: "#6B5E7A" }}>{a}</span>
              ))}
            </div>
          </div>
        )}
        {card.bio && <p className="mt-2 text-xs leading-relaxed" style={{ color: "#6B5E7A" }}>{card.bio}</p>}
      </div>
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border flex items-center justify-center" style={{ height: 320, borderColor: "#EDE8F7", backgroundColor: "#FAF8FF" }}>
      <p className="text-sm" style={{ color: "#9B87B0" }}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-1.5 text-xs">
      <span style={{ color: "#9B87B0", minWidth: 80 }}>{label}</span>
      <span style={{ color: "#1A0A2E", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SkeletonPair() {
  return (
    <div className="grid grid-cols-2 gap-5">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
          <div className="animate-pulse" style={{ height: 240, backgroundColor: "#F0EBFA" }} />
          <div className="px-4 py-4 space-y-2">
            <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: "60%" }} />
            <div className="h-3 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: "40%" }} />
            {[80, 70, 90, 65, 75].map((w, j) => (
              <div key={j} className="h-3 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
