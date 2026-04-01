"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";

type DetailPayload = {
  id: string;
  email: string | null;
  phone: string | null;
  collegeName: string | null;
  photoUrl: string | null;
  name: string | null;
  nickname: string | null;
  city: string | null;
  age: number | null;
  gender: string | null;
  interests: string[];
  lookingFor: string | null;
  heightCm: number | null;
  smokingHabit: string | null;
  drinkingHabit: string | null;
  religion: string | null;
  familyPlans: string | null;
  kidsPreference: string | null;
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div
      className="flex flex-col gap-0.5 border-b py-2 last:border-b-0"
      style={{ borderColor: adminTheme.borderSoft }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: adminTheme.mutedLabel }}
      >
        {label}
      </span>
      <span className="text-sm" style={{ color: adminTheme.ink }}>
        {value}
      </span>
    </div>
  );
}

export default function UserDetailSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to load");
        setData(null);
        return;
      }
      setData(json.data as DetailPayload);
    } catch {
      setError("Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#fff", borderLeft: `1px solid ${adminTheme.accentMutedBg}` }}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-4 py-3"
          style={{ borderColor: adminTheme.borderSoft }}
        >
          <span className="text-sm font-semibold" style={{ color: adminTheme.ink }}>
            User details
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-bd-table-hover"
            aria-label="Close"
          >
            <X size={18} style={{ color: adminTheme.textSecondary }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <p className="text-sm" style={{ color: adminTheme.mutedLabel }}>
              Loading…
            </p>
          )}
          {error && !loading && <p className="text-sm text-red-600">{error}</p>}
          {data && !loading && (
            <>
              <div
                className="relative mb-4 w-full overflow-hidden rounded-xl"
                style={{ aspectRatio: "4/3", backgroundColor: adminTheme.pageBg }}
              >
                {data.photoUrl ? (
                  <Image
                    src={data.photoUrl}
                    alt={data.name ?? "User"}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User size={48} strokeWidth={1} style={{ color: adminTheme.orange }} />
                  </div>
                )}
              </div>

              <p className="text-lg font-bold" style={{ color: adminTheme.ink }}>
                {data.name ?? "—"}
                {data.age != null && (
                  <span className="text-sm font-normal" style={{ color: adminTheme.textSecondary }}>
                    , {data.age} yrs
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: adminTheme.mutedLabel }}>
                {[data.gender, data.city].filter(Boolean).join(" · ") || "—"}
              </p>
              {data.email && (
                <p className="mt-1 break-all font-mono text-xs" style={{ color: adminTheme.textSecondary }}>
                  {data.email}
                </p>
              )}

              <p
                className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: adminTheme.mutedLabel }}
              >
                Profile
              </p>
              {data.interests.length > 0 && (
                <div className="border-b py-2 last:border-b-0" style={{ borderColor: adminTheme.borderSoft }}>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: adminTheme.mutedLabel }}
                  >
                    Interests
                  </span>
                  <p className="mt-1 text-sm" style={{ color: adminTheme.ink }}>
                    {data.interests.join(", ")}
                  </p>
                </div>
              )}
              <DetailRow label="Looking for" value={data.lookingFor ?? null} />
              <DetailRow label="Height" value={data.heightCm != null ? `${data.heightCm} cm` : null} />

              <p
                className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: adminTheme.mutedLabel }}
              >
                Lifestyle
              </p>
              <DetailRow label="Smoking habit" value={data.smokingHabit ?? null} />
              <DetailRow label="Drinking habit" value={data.drinkingHabit ?? null} />
              <DetailRow label="Religion" value={data.religion ?? null} />
              <DetailRow label="Family plans" value={data.familyPlans ?? null} />
              <DetailRow label="Kids preference" value={data.kidsPreference ?? null} />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
