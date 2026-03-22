"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, User } from "lucide-react";

const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const INACTIVE = "#7A6A54";

const TABS = [
  { href: "/matches", label: "Matches", Icon: Heart },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingLeft: 20,
        paddingRight: 20,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <nav
        style={{
          pointerEvents: "all",
          borderRadius: 999,
          background: "#EDE8D5",
          border: `2.5px solid ${DARK}`,
          boxShadow: `4px 4px 0 ${DARK}`,
          display: "flex",
          alignItems: "stretch",
          height: 60,
          width: "100%",
          maxWidth: 280,
          overflow: "hidden",
        }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
                transition: "color 0.15s ease",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    inset: "8px 10px",
                    borderRadius: 999,
                    background: `${ACCENT}18`,
                    border: `1.5px solid ${ACCENT}40`,
                  }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.7}
                fill={active && label === "Matches" ? `${ACCENT}30` : "none"}
                style={{ position: "relative" }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  lineHeight: 1,
                  letterSpacing: active ? 0.3 : 0,
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
