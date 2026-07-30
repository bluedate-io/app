"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminTheme } from "@/lib/adminTheme";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Slice { label: string; value: number }

interface AnalyticsData {
  total: number;
  userType: Slice[];
  onboarding: Slice[];
  studentOnboarding: Slice[];
  nonStudentOnboarding: Slice[];
  plan: Slice[];
  studentPlan: Slice[];
  nonStudentPlan: Slice[];
  genderAll: Slice[];
  genderStudents: Slice[];
  genderNonStudents: Slice[];
  genderBoardingDone: Slice[];
  genderBoardingPending: Slice[];
  genderVip: Slice[];
  genderBasic: Slice[];
}

// ─── Colour palettes ──────────────────────────────────────────────────────────
const ORANGE = adminTheme.orange ?? "#EF6820";
const ORANGE_BRIGHT = adminTheme.orangeBright ?? "#F97316";

const PALETTES: Record<string, string[]> = {
  userType:  ["#EF6820", "#6366F1"],
  onboarding: ["#22C55E", "#F43F5E"],
  plan: ["#F59E0B", "#94A3B8"],
  gender: ["#EC4899", "#3B82F6", "#A78BFA", "#94A3B8"],
};

function palette(name: string, idx: number): string {
  const list = PALETTES[name] ?? PALETTES.gender;
  return list[idx % list.length];
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-lg"
      style={{
        background: "#fff",
        borderColor: adminTheme.borderSoft,
        color: adminTheme.ink,
      }}
    >
      <p className="font-semibold">{name}</p>
      <p>
        {value} <span className="text-bd-muted-label">({pct}%)</span>
      </p>
    </div>
  );
}

// ─── Single chart card ─────────────────────────────────────────────────────────
function ChartCard({
  title,
  subtitle,
  data,
  paletteName,
}: {
  title: string;
  subtitle?: string;
  data: Slice[];
  paletteName: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const isEmpty = total === 0;

  return (
    <div
      className="flex flex-col rounded-2xl border p-5"
      style={{
        background: "#fff",
        borderColor: adminTheme.borderSoft,
        boxShadow: "0 2px 12px -4px rgba(45,26,14,0.10)",
      }}
    >
      <p
        className="text-[13px] font-semibold leading-tight"
        style={{ color: adminTheme.ink }}
      >
        {title}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[11px]" style={{ color: adminTheme.textSecondary }}>
          {subtitle}
        </p>
      )}

      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <p className="text-xs" style={{ color: adminTheme.textSecondary }}>
            No data
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.map((d) => ({ name: d.label, value: d.value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={palette(paletteName, i)} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend rows */}
          <div className="mt-3 flex flex-col gap-1.5">
            {data.map((d, i) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              return (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: palette(paletteName, i) }}
                  />
                  <span className="text-[12px]" style={{ color: adminTheme.textSecondary }}>
                    {d.label}
                  </span>
                  <span className="ml-auto text-[12px] font-semibold tabular-nums" style={{ color: adminTheme.ink }}>
                    {d.value}
                    <span className="ml-1 font-normal" style={{ color: adminTheme.textSecondary }}>
                      ({pct}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <p
            className="mt-3 border-t pt-2 text-right text-[11px] font-semibold"
            style={{ borderColor: adminTheme.borderSoft, color: adminTheme.textSecondary }}
          >
            Total: {total}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border px-6 py-4"
      style={{
        background: adminTheme.accentMutedBg,
        borderColor: adminTheme.borderSoft,
      }}
    >
      <span
        className="text-3xl font-bold tabular-nums"
        style={{ color: ORANGE }}
      >
        {value}
      </span>
      <span className="mt-0.5 text-[12px] font-medium" style={{ color: adminTheme.textSecondary }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${ORANGE} transparent ${ORANGE} ${ORANGE}` }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-500">{error ?? "No data"}</p>
      </div>
    );
  }

  type ChartDef = { title: string; subtitle: string; data: Slice[]; paletteName: string };
  type Group = { heading: string; charts: ChartDef[] };

  const GROUPS: Group[] = [
    {
      heading: "Gender by Segment",
      charts: [
        {
          title: "All Users",
          subtitle: "Gender identity breakdown — all users",
          data: data.genderAll,
          paletteName: "gender",
        },
        {
          title: "Students",
          subtitle: "Gender identity · student users only",
          data: data.genderStudents,
          paletteName: "gender",
        },
        {
          title: "Non-students",
          subtitle: "Gender identity · non-student users only",
          data: data.genderNonStudents,
          paletteName: "gender",
        },
      ],
    },
    {
      heading: "Onboarding",
      charts: [
        {
          title: "All Users",
          subtitle: "Completed vs Incomplete — all users",
          data: data.onboarding,
          paletteName: "onboarding",
        },
      ],
    },
    {
      heading: "Onboarding — Students",
      charts: [
        {
          title: "Students",
          subtitle: "Completed vs Incomplete · student users only",
          data: data.studentOnboarding,
          paletteName: "onboarding",
        },
      ],
    },
    {
      heading: "Onboarding — Non-students",
      charts: [
        {
          title: "Non-students",
          subtitle: "Completed vs Incomplete · non-student users only",
          data: data.nonStudentOnboarding,
          paletteName: "onboarding",
        },
      ],
    },
    {
      heading: "Onboarding — Gender",
      charts: [
        {
          title: "Completed",
          subtitle: "Gender of users who finished onboarding",
          data: data.genderBoardingDone,
          paletteName: "gender",
        },
        {
          title: "Incomplete",
          subtitle: "Gender of users who haven't finished onboarding",
          data: data.genderBoardingPending,
          paletteName: "gender",
        },
      ],
    },
    {
      heading: "Plan",
      charts: [
        {
          title: "All Users",
          subtitle: "VIP (took plan) vs Basic (no plan)",
          data: data.plan,
          paletteName: "plan",
        },
      ],
    },
    {
      heading: "Plan — Students",
      charts: [
        {
          title: "Students",
          subtitle: "VIP vs Basic · student users only",
          data: data.studentPlan,
          paletteName: "plan",
        },
      ],
    },
    {
      heading: "Plan — Non-students",
      charts: [
        {
          title: "Non-students",
          subtitle: "VIP vs Basic · non-student users only",
          data: data.nonStudentPlan,
          paletteName: "plan",
        },
      ],
    },
    {
      heading: "Plan — Gender",
      charts: [
        {
          title: "VIP Users",
          subtitle: "Gender breakdown of users on VIP plan",
          data: data.genderVip,
          paletteName: "gender",
        },
        {
          title: "Basic Users",
          subtitle: "Gender breakdown of users on Basic plan",
          data: data.genderBasic,
          paletteName: "gender",
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: adminTheme.ink, fontFamily: "var(--font-bd-display), Georgia, serif" }}
        >
          Analytics
        </h1>
        <p className="mt-1 text-sm" style={{ color: adminTheme.textSecondary }}>
          User breakdown across all dimensions
        </p>
      </div>

      {/* Summary pills */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Total Users" value={data.total} />
        <StatPill label="Students" value={data.userType.find((d) => d.label === "Students")?.value ?? 0} />
        <StatPill label="Non-students" value={data.userType.find((d) => d.label === "Non-students")?.value ?? 0} />
        <StatPill label="Onboarding Done" value={data.onboarding.find((d) => d.label === "Completed")?.value ?? 0} />
      </div>

      {/* Grouped charts */}
      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => (
          <section key={group.heading}>
            {/* Group heading */}
            <div className="mb-4 flex items-center gap-3">
              <h2
                className="text-[13px] font-bold uppercase tracking-widest"
                style={{ color: adminTheme.orange }}
              >
                {group.heading}
              </h2>
              <div className="h-px flex-1" style={{ background: adminTheme.borderSoft }} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.charts.map((c) => (
                <ChartCard key={`${group.heading}-${c.title}`} {...c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
