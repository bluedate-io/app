"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User } from "lucide-react";

const ACCENT = "#8F3A8F";
const INACTIVE = "#9E9E9E";

const TABS = [
  { href: "/matches", label: "Matches", Icon: Heart },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    /* Outer wrapper: centres the pill on wide screens */
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        /* stay above the iPhone home indicator */
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingLeft: 16,
        paddingRight: 16,
        pointerEvents: "none", // let clicks through to page underneath
        zIndex: 100,
      }}
    >
      <nav
        style={{
          pointerEvents: "all",
          /* pill shape */
          borderRadius: 999,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)",
          display: "flex",
          alignItems: "stretch",
          height: 60,
          /* max width caps it on large screens so it stays compact */
          width: "100%",
          maxWidth: 360,
          overflow: "hidden",
        }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? ACCENT : INACTIVE,
                position: "relative",
                transition: "color 0.18s ease",
              }}
            >
              {/* active pill highlight behind icon */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    inset: "8px 6px",
                    borderRadius: 999,
                    background: "rgba(143,58,143,0.08)",
                  }}
                />
              )}

              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.7}
                fill={active && label === "Matches" ? ACCENT : "none"}
                style={{ position: "relative" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  lineHeight: 1,
                  letterSpacing: active ? 0.2 : 0,
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                  position: "relative",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
