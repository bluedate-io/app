"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Heart, GitMerge, UserPlus, ShieldCheck, LogOut, Shuffle } from "lucide-react";

const NAV = [
  { label: "Users",        href: "/admin/users",        icon: Users },
  { label: "Match",        href: "/admin/match",        icon: Shuffle },
  { label: "Match Users",  href: "/admin/match-users",  icon: GitMerge },
  { label: "View Matches", href: "/admin/view-matches",  icon: Heart },
  { label: "Add Admin",    href: "/admin/add-admin",    icon: UserPlus },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F5F0FB" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col w-60 shrink-0 border-r"
        style={{ backgroundColor: "#fff", borderColor: "#EDE8F7" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "#EDE8F7" }}>
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 34, height: 34, background: "linear-gradient(135deg,#8F3A8F,#C060C0)" }}
          >
            <ShieldCheck size={18} color="#fff" strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm" style={{ color: "#1A0A2E" }}>
            Bluedate Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                style={
                  active
                    ? { background: "linear-gradient(135deg,#8F3A8F18,#C060C018)", color: "#8F3A8F" }
                    : { color: "#6B5E7A" }
                }
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <a
            href="/admin/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
            style={{ color: "#DC2626" }}
          >
            <LogOut size={17} strokeWidth={1.8} />
            Logout
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
