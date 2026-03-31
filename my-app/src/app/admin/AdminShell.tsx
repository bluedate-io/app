"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Heart,
  GitMerge,
  UserPlus,
  ShieldCheck,
  LogOut,
  Shuffle,
  MailWarning,
} from "lucide-react";
import { adminTheme } from "@/lib/adminTheme";

const NAV = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Onboarding reminders", href: "/admin/onboarding-incomplete", icon: MailWarning },
  { label: "Match", href: "/admin/match", icon: Shuffle },
  { label: "Match Users", href: "/admin/match-users", icon: GitMerge },
  { label: "View Matches", href: "/admin/view-matches", icon: Heart },
  { label: "Add Admin", href: "/admin/add-admin", icon: UserPlus },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-bd-main-canvas">
      <aside
        className="flex w-62 shrink-0 flex-col border-r-2 shadow-[6px_0_24px_-8px_rgba(45,26,14,0.18)]"
        style={{
          borderColor: adminTheme.inkDark,
          background: `linear-gradient(180deg, ${adminTheme.sidebarTop} 0%, ${adminTheme.sidebarBottom} 100%)`,
        }}
      >
        <div
          className="flex items-center gap-3 border-b-2 px-5 py-5"
          style={{ borderColor: adminTheme.borderSoft }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[2px_2px_0_0_var(--bd-shadow-ink)]"
            style={{
              background: `linear-gradient(145deg, ${adminTheme.orange}, ${adminTheme.orangeBright})`,
            }}
          >
            <ShieldCheck size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 leading-tight">
            <p
              className="truncate text-[15px] font-semibold tracking-tight text-bd-ink"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
            >
              Bluedate
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-bd-muted-label">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active ? "shadow-[inset_0_0_0_1.5px_rgba(239,104,32,0.45)]" : "hover:bg-black/4"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: adminTheme.accentMutedBg,
                        color: adminTheme.orange,
                        fontWeight: 600,
                      }
                    : { color: adminTheme.textSecondary }
                }
              >
                <Icon size={18} strokeWidth={active ? 2.25 : 1.85} className="shrink-0 opacity-95" />
                <span className="leading-snug">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="mt-auto border-t-2 px-3 pb-5 pt-3"
          style={{ borderColor: adminTheme.borderSoft, backgroundColor: "rgba(255,255,255,0.35)" }}
        >
          <a
            href="/admin/logout"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-red-50"
            style={{ color: "#B91C1C" }}
          >
            <LogOut size={18} strokeWidth={2} className="shrink-0 opacity-90" />
            Sign out
          </a>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto bg-bd-main-canvas">{children}</main>
    </div>
  );
}
