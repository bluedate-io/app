"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, ChevronRight, User } from "lucide-react";

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

type LoadState =
  | { status: "loading" }
  | { status: "ready"; women: ProfileCard[]; men: ProfileCard[]; wi: number; mi: number; matching: boolean }
  | { status: "error" };

export default function MatchUsersView() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

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

  async function handleMatch() {
    if (state.status !== "ready") return;
    const { women, men, wi, mi } = state;
    const woman = women[wi];
    const man = men[mi];
    if (!woman || !man) return;

    setState((s) => s.status === "ready" ? { ...s, matching: true } : s);
    await fetch("/api/admin/match-users/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1: woman.userId, userId2: man.userId }),
    });
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
        matching: false,
      };
    });
  }

  function skipWoman() {
    setState((s) => {
      if (s.status !== "ready" || s.women.length === 0) return s;
      return { ...s, wi: (s.wi + 1) % s.women.length };
    });
  }

  function skipMan() {
    setState((s) => {
      if (s.status !== "ready" || s.men.length === 0) return s;
      return { ...s, mi: (s.mi + 1) % s.men.length };
    });
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

  const { women, men, wi, mi, matching } = state;
  const woman = women[wi] ?? null;
  const man = men[mi] ?? null;
  const canMatch = !!woman && !!man && !matching;

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
            disabled={!woman || women.length <= 1}
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
            disabled={!man || men.length <= 1}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
          >
            Skip <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Match button */}
      <div className="flex justify-center">
        <button
          onClick={handleMatch}
          disabled={!canMatch}
          className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
        >
          <Heart size={16} />
          {matching ? "Matching…" : "Match"}
        </button>
      </div>
    </div>
  );
}

function ProfileCardView({ card, label }: { card: ProfileCard; label: string }) {
  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm bg-white" style={{ borderColor: "#EDE8F7" }}>
      {/* Photo */}
      <div className="relative w-full" style={{ height: 240 }}>
        {card.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={card.photoUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0FB" }}>
            <User size={40} strokeWidth={1} style={{ color: "#C060C0" }} />
          </div>
        )}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
        >
          {label}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-4">
        {/* Name + age + city */}
        <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>
          {card.name}
          {card.age && <span className="font-normal text-sm" style={{ color: "#6B5E7A" }}>, {card.age}</span>}
        </p>
        {card.city && <p className="text-xs mt-0.5 mb-3" style={{ color: "#9B87B0" }}>{card.city}</p>}

        {/* Core details */}
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

        {/* Interests */}
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

        {/* Bio */}
        {card.bio && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "#6B5E7A" }}>{card.bio}</p>
        )}
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
            {[80, 70, 90, 65, 75].map((w, i) => (
              <div key={i} className="h-3 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
