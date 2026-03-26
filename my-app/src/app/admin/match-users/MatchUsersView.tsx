"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart, ChevronLeft, ChevronRight, User, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OptedInUser = {
  userId: string;
  name: string;
  age: number | null;
  city: string | null;
  photoUrl: string | null;
  collegeName: string | null;
  genderIdentity: string | null;
  genderPreference: string[];
  mode: string;
  description: string | null;
};

type Candidate = OptedInUser & {
  bio: string | null;
  lookingFor: string | null;
  heightCm: number | null;
  ageRange: string | null;
  interestedIn: string[];
  religion: string[];
  kidsStatus: string | null;
  kidsPreference: string | null;
  smokingHabit: string | null;
  drinkingHabit: string | null;
  hobbies: string[];
  activities: string[];
  score: number;
  scoreBreakdown: { label: string; pts: number }[];
};

type SelectedUser = OptedInUser & {
  bio: string | null;
  lookingFor: string | null;
  heightCm: number | null;
  ageRange: string | null;
  interestedIn: string[];
  religion: string[];
  kidsStatus: string | null;
  kidsPreference: string | null;
  smokingHabit: string | null;
  drinkingHabit: string | null;
  hobbies: string[];
  activities: string[];
};

type ModalState =
  | { open: false }
  | { open: true; candidate: Candidate; blurb: string; saving: boolean };

// ─── Phase 1: Opted-in list ───────────────────────────────────────────────────

export default function MatchUsersView() {
  const [phase, setPhase] = useState<"list" | "match">("list");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  function handleSelect(user: SelectedUser) {
    setSelectedUser(user);
    setPhase("match");
  }

  if (phase === "list" || !selectedUser) {
    return <OptedInList onSelect={handleSelect} />;
  }

  return (
    <MatchPhase
      selectedUser={selectedUser}
      onBack={() => { setPhase("list"); setSelectedUser(null); }}
    />
  );
}

// ─── Opted-in list ────────────────────────────────────────────────────────────

function OptedInList({ onSelect }: { onSelect: (u: SelectedUser) => void }) {
  const [users, setUsers] = useState<OptedInUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/match-users/opted-in?page=${p}&limit=${LIMIT}`);
      const { data } = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold" style={{ color: "#1A0A2E" }}>Opted-in this week</h2>
          <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>{total} users — select one to find their best matches</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState message="No users opted in this week yet." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {users.map((u) => (
              <OptedInCard key={u.userId} user={u} onSelect={onSelect} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border disabled:opacity-30"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs" style={{ color: "#9B87B0" }}>Page {page} of {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border disabled:opacity-30"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OptedInCard({ user, onSelect }: { user: OptedInUser; onSelect: (u: SelectedUser) => void }) {
  async function handleClick() {
    // Fetch full profile for this user by calling suggestions (which returns selectedUser)
    const res = await fetch(`/api/admin/match-users/suggestions?userId=${user.userId}`);
    const { data } = await res.json();
    if (data?.selectedUser) onSelect(data.selectedUser);
  }

  return (
    <button
      onClick={handleClick}
      className="text-left rounded-2xl border overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: "#EDE8F7" }}
    >
      <div className="relative" style={{ height: 160 }}>
        {user.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0FB" }}>
            <User size={32} strokeWidth={1} style={{ color: "#C060C0" }} />
          </div>
        )}
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: user.mode === "bff" ? "#EDE8F7" : "linear-gradient(135deg,#8F3A8F,#C060C0)",
            color: user.mode === "bff" ? "#6B5E7A" : "white",
          }}
        >
          {user.mode === "bff" ? "BFF" : "Date"}
        </span>
      </div>
      <div className="px-3 py-3">
        <p className="text-sm font-semibold truncate" style={{ color: "#1A0A2E" }}>
          {user.name}{user.age ? `, ${user.age}` : ""}
        </p>
        {user.collegeName && (
          <p className="text-xs truncate mt-0.5" style={{ color: "#9B87B0" }}>{user.collegeName}</p>
        )}
        {user.genderIdentity && (
          <p className="text-xs mt-1" style={{ color: "#6B5E7A" }}>{user.genderIdentity}</p>
        )}
        {user.description && (
          <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "#9B87B0" }}>{user.description}</p>
        )}
      </div>
    </button>
  );
}

// ─── Match phase ──────────────────────────────────────────────────────────────

function MatchPhase({ selectedUser, onBack }: { selectedUser: SelectedUser; onBack: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [modal, setModal] = useState<ModalState>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/match-users/suggestions?userId=${selectedUser.userId}`);
      const { data } = await res.json();
      setCandidates(data.candidates ?? []);
    } finally {
      setLoading(false);
    }
  }, [selectedUser.userId]);

  useEffect(() => { load(); }, [load]);

  async function skipCandidate() {
    const candidate = candidates[idx];
    if (!candidate) return;
    await fetch("/api/admin/match-users/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1: selectedUser.userId, userId2: candidate.userId }),
    });
    setCandidates((prev) => prev.filter((_, i) => i !== idx));
    setIdx((i) => Math.min(i, candidates.length - 2));
  }

  async function saveMatch() {
    if (!modal.open) return;
    const { candidate, blurb } = modal;
    setModal((m) => m.open ? { ...m, saving: true } : m);
    await fetch("/api/admin/match-users/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1: selectedUser.userId, userId2: candidate.userId, blurb }),
    });
    setModal({ open: false });
    onBack();
  }

  const candidate = candidates[idx] ?? null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
          style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div>
          <h2 className="text-base font-bold" style={{ color: "#1A0A2E" }}>
            Finding matches for {selectedUser.name}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>
            {loading ? "Loading…" : `${candidates.length} candidates from ${selectedUser.collegeName ?? "their college"}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          <SkeletonCard tall />
          <SkeletonCard tall />
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState message={`No eligible candidates found for ${selectedUser.name} this week.`} />
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* Selected user (fixed) */}
          <div>
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: "#9B87B0" }}>SELECTED USER</p>
            <FullProfileCard user={selectedUser} />
          </div>

          {/* Candidate */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold" style={{ color: "#9B87B0" }}>
                CANDIDATE {idx + 1} / {candidates.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  className="p-1 rounded-lg border disabled:opacity-30"
                  style={{ borderColor: "#EDE8F7" }}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => setIdx((i) => Math.min(candidates.length - 1, i + 1))}
                  disabled={idx === candidates.length - 1}
                  className="p-1 rounded-lg border disabled:opacity-30"
                  style={{ borderColor: "#EDE8F7" }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {candidate && (
              <>
                <FullProfileCard user={candidate} score={candidate.score} breakdown={candidate.scoreBreakdown} />

                {/* Actions */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={skipCandidate}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition"
                    style={{ borderColor: "#EDE8F7", color: "#6B5E7A", backgroundColor: "#fff" }}
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setModal({ open: true, candidate, blurb: "", saving: false })}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
                  >
                    <Heart size={14} /> Match
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Blurb modal */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false }); }}
        >
          <div className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden bg-white">
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#F0EBFA" }}>
              <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>Why do they match?</p>
              <p className="text-xs mt-1" style={{ color: "#9B87B0" }}>
                {selectedUser.name} &amp; {modal.candidate.name} — write a short blurb.
              </p>
            </div>
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
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setModal({ open: false })}
                disabled={modal.saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: "#EDE8F7", color: "#6B5E7A" }}
              >
                Cancel
              </button>
              <button
                onClick={saveMatch}
                disabled={modal.saving || !modal.blurb.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
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

// ─── Profile cards ────────────────────────────────────────────────────────────

function FullProfileCard({
  user,
  score,
  breakdown,
}: {
  user: SelectedUser | Candidate;
  score?: number;
  breakdown?: { label: string; pts: number }[];
}) {
  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm bg-white" style={{ borderColor: "#EDE8F7" }}>
      {/* Photo */}
      <div className="relative w-full" style={{ height: 220 }}>
        {user.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0FB" }}>
            <User size={40} strokeWidth={1} style={{ color: "#C060C0" }} />
          </div>
        )}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: user.mode === "bff" ? "#EDE8F7" : "linear-gradient(135deg,#8F3A8F,#C060C0)",
            color: user.mode === "bff" ? "#6B5E7A" : "white",
          }}
        >
          {user.mode === "bff" ? "BFF" : "Date"}
        </span>
        {score !== undefined && (
          <span
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}
          >
            <Star size={10} fill="#C2410C" />
            {score}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        <p className="text-base font-bold" style={{ color: "#1A0A2E" }}>
          {user.name}
          {user.age && <span className="font-normal text-sm" style={{ color: "#6B5E7A" }}>, {user.age}</span>}
        </p>
        {user.city && <p className="text-xs mt-0.5" style={{ color: "#9B87B0" }}>{user.city}</p>}
        {user.collegeName && <p className="text-xs" style={{ color: "#9B87B0" }}>{user.collegeName}</p>}

        {/* Opt-in description */}
        {user.description && (
          <p className="text-xs mt-2 italic leading-relaxed px-3 py-2 rounded-lg" style={{ backgroundColor: "#FAF8FF", color: "#6B5E7A" }}>
            &ldquo;{user.description}&rdquo;
          </p>
        )}

        <div className="flex flex-col gap-1 mt-3 mb-3">
          <InfoRow label="Looking for"   value={"lookingFor" in user ? user.lookingFor : null} />
          <InfoRow label="Interested in" value={user.interestedIn.length ? user.interestedIn.join(", ") : null} />
          <InfoRow label="Age range"     value={"ageRange" in user ? user.ageRange : null} />
          <InfoRow label="Height"        value={"heightCm" in user && user.heightCm ? `${user.heightCm} cm` : null} />
          <InfoRow label="Religion"      value={user.religion.length ? user.religion.join(", ") : null} />
          <InfoRow label="Has kids"      value={user.kidsStatus} />
          <InfoRow label="Wants kids"    value={user.kidsPreference} />
          <InfoRow label="Smoking habit" value={user.smokingHabit} />
          <InfoRow label="Drinking habit" value={user.drinkingHabit} />
        </div>

        {user.hobbies.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium mb-1" style={{ color: "#9B87B0" }}>Hobbies</p>
            <div className="flex flex-wrap gap-1">
              {user.hobbies.map((h) => (
                <span key={h} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "#F0EBFA", color: "#6B5E7A" }}>{h}</span>
              ))}
            </div>
          </div>
        )}

        {"bio" in user && user.bio && (
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "#6B5E7A" }}>{user.bio}</p>
        )}

        {/* Score breakdown */}
        {breakdown && breakdown.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "#F0EBFA" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#9B87B0" }}>Match reasons</p>
            <div className="flex flex-col gap-1">
              {breakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: "#6B5E7A" }}>{b.label}</span>
                  <span className="font-semibold" style={{ color: "#8F3A8F" }}>+{b.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-1.5 text-xs">
      <span style={{ color: "#9B87B0", minWidth: 80 }}>{label}</span>
      <span style={{ color: "#1A0A2E", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border py-24" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
      <Heart size={32} strokeWidth={1.5} style={{ color: "#C060C0" }} />
      <p className="mt-3 text-sm font-semibold" style={{ color: "#1A0A2E" }}>{message}</p>
    </div>
  );
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#EDE8F7", backgroundColor: "#fff" }}>
      <div className="animate-pulse" style={{ height: tall ? 220 : 160, backgroundColor: "#F0EBFA" }} />
      <div className="px-4 py-4 space-y-2">
        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: "60%" }} />
        <div className="h-3 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: "40%" }} />
        {[80, 65, 75].map((w, i) => (
          <div key={i} className="h-3 rounded animate-pulse" style={{ backgroundColor: "#F0EBFA", width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
