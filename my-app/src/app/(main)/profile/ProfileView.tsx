"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Camera,
  Heart,
  Sparkles,
  Wine,
  BookOpen,
  Baby,
  Bell,
  HelpCircle,
  LogOut,
  Settings,
  Ruler,
} from "lucide-react";
import type { ProfileData } from "./page";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const CARD_BG = "#fff";
const SERIF = "var(--font-playfair, Georgia, serif)";
const SANS = "var(--font-geist-sans, sans-serif)";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// ─── Card container ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: `2.5px solid ${DARK}`,
        borderRadius: 18,
        boxShadow: `4px 4px 0 ${DARK}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: MUTED,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontFamily: SANS,
        margin: "0 0 8px 2px",
      }}
    >
      {text}
    </p>
  );
}

// ─── Menu row ──────────────────────────────────────────────────────────────────
function MenuRow({
  icon,
  iconBg,
  label,
  hint,
  href,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  hint?: string;
  href?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const textColor = danger ? "#C0392B" : DARK;

  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        color: textColor,
      }}
    >
      {/* Icon bubble */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: danger ? "#FFF0EE" : iconBg,
          border: `1.5px solid ${danger ? "#F5C6C2" : `${DARK}20`}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: danger ? "#C0392B" : ACCENT,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: textColor,
            margin: 0,
            lineHeight: 1.3,
            fontFamily: SANS,
          }}
        >
          {label}
        </p>
        {hint && (
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hint}
          </p>
        )}
      </div>

      <ChevronRight size={16} color={`${DARK}50`} style={{ flexShrink: 0 }} />
    </div>
  );

  const sharedStyle: React.CSSProperties = {
    display: "block",
    textDecoration: "none",
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "opacity 0.15s",
  };

  if (href) {
    return (
      <Link href={href} style={sharedStyle} className="active:opacity-70">
        {inner}
      </Link>
    );
  }
  return (
    <button style={sharedStyle} onClick={onClick} className="active:opacity-70">
      {inner}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: `${DARK}12`,
        marginLeft: 70,
      }}
    />
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ url, name }: { url?: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            border: `3px solid ${DARK}`,
            boxShadow: `4px 4px 0 ${DARK}`,
          }}
        />
      ) : (
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACCENT}, #C0392B)`,
            border: `3px solid ${DARK}`,
            boxShadow: `4px 4px 0 ${DARK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            fontFamily: SERIF,
          }}
        >
          {initials || "?"}
        </div>
      )}

      {/* Camera badge */}
      <Link
        href="/onboarding"
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: ACCENT,
          border: `2.5px solid ${DARK}`,
          boxShadow: `2px 2px 0 ${DARK}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Camera size={13} color="#fff" />
      </Link>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function ProfileView({ data }: { data: ProfileData }) {
  const router = useRouter();
  const { profile, preferences, interests, personality, photos } = data;

  function handleLogout() {
    document.cookie = "access_token=; max-age=0; path=/";
    router.push("/login");
  }

  const name = profile?.fullName ?? "";
  const age = calcAge(profile?.dateOfBirth);
  const height = preferences?.heightCm;
  const goals = preferences?.relationshipGoals?.filter(Boolean) ?? [];
  const hobbies = interests?.hobbies?.filter((h) => h && h !== "Not specified") ?? [];
  const drinking = personality?.socialLevel;
  const religion = personality?.religion?.[0];
  const kidsHave = personality?.kidsStatus;
  const firstPhoto = photos[0]?.url;
  const photoCount = photos.length;

  const displayName = name || "Your name";
  const subtitle = [age ? `${age} yrs` : null, preferences?.genderIdentity, profile?.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ minHeight: "100%", background: BG, fontFamily: SANS }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 14px",
          borderBottom: `2px solid ${DARK}`,
          background: BG,
        }}
      >
        <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 800, color: DARK, margin: 0, letterSpacing: -0.5 }}>
          My Profile
        </h1>
        <Link
          href="/onboarding"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: CARD_BG,
            border: `2px solid ${DARK}`,
            boxShadow: `2px 2px 0 ${DARK}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: ACCENT,
          }}
        >
          <Settings size={18} />
        </Link>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Hero card */}
        <Card>
          <div
            style={{
              padding: "28px 20px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              borderBottom: `1.5px solid ${DARK}20`,
            }}
          >
            <Avatar url={firstPhoto} name={displayName} />
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontSize: 22,
                  fontWeight: 800,
                  color: DARK,
                  margin: "0 0 4px",
                }}
              >
                {displayName}
              </h2>
              {subtitle && (
                <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{subtitle}</p>
              )}
            </div>
          </div>

          {/* Edit profile button row */}
          <Link
            href="/onboarding"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 20px",
              textDecoration: "none",
              color: ACCENT,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: SANS,
            }}
            className="active:opacity-70"
          >
            Edit Profile
            <ChevronRight size={16} />
          </Link>
        </Card>

        {/* Profile details */}
        <div>
          <SectionLabel text="Profile" />
          <Card>
            <MenuRow
              href="/onboarding"
              icon={<Camera size={18} />}
              iconBg="#FFF3EE"
              label="My Photos"
              hint={photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "No photos yet"}
            />
            <Divider />
            <MenuRow
              href="/onboarding"
              icon={<Sparkles size={18} />}
              iconBg="#FFF8EE"
              label="Interests"
              hint={hobbies.length > 0 ? hobbies.slice(0, 2).join(", ") : "Not set"}
            />
            <Divider />
            <MenuRow
              href="/onboarding"
              icon={<Heart size={18} />}
              iconBg="#FFF0EE"
              label="Looking for"
              hint={goals[0] ?? "Not set"}
            />
            <Divider />
            <MenuRow
              href="/onboarding"
              icon={<Ruler size={18} />}
              iconBg="#F5F8EE"
              label="Height"
              hint={height ? `${height} cm` : "Not set"}
            />
          </Card>
        </div>

        {/* Lifestyle */}
        <div>
          <SectionLabel text="Lifestyle" />
          <Card>
            <MenuRow
              href="/onboarding"
              icon={<Wine size={18} />}
              iconBg="#FFF8EE"
              label="Drinking"
              hint={drinking ?? "Not set"}
            />
            <Divider />
            <MenuRow
              href="/onboarding"
              icon={<BookOpen size={18} />}
              iconBg="#FFF3EE"
              label="Religion"
              hint={religion ?? "Not set"}
            />
            <Divider />
            <MenuRow
              href="/onboarding"
              icon={<Baby size={18} />}
              iconBg="#FFF0EE"
              label="Family plans"
              hint={kidsHave ?? "Not set"}
            />
          </Card>
        </div>

        {/* Settings */}
        <div>
          <SectionLabel text="App" />
          <Card>
            <MenuRow
              icon={<Bell size={18} />}
              iconBg="#F5F8EE"
              label="Notifications"
            />
          </Card>
        </div>

        {/* Support + logout */}
        <div>
          <SectionLabel text="Support" />
          <Card>
            <MenuRow
              icon={<HelpCircle size={18} />}
              iconBg="#FFF3EE"
              label="Help &amp; Support"
            />
            <Divider />
            <MenuRow
              icon={<LogOut size={18} />}
              iconBg="#FFF0EE"
              label="Log out"
              danger
              onClick={handleLogout}
            />
          </Card>
        </div>

      </div>
    </div>
  );
}
