"use client";

import Link from "next/link";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

// ─── Menu row ─────────────────────────────────────────────────────────────────

function MenuRow({
  icon,
  iconBg,
  label,
  hint,
  href,
  danger,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  hint?: string;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <div
      className="flex items-center gap-3.5 px-4 py-3.5"
      style={{ color: danger ? "#E53E3E" : "#1A0A2E" }}
    >
      {/* Icon bubble */}
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: 40,
          height: 40,
          background: danger ? "#FFF0F0" : iconBg,
        }}
      >
        <span style={{ color: danger ? "#E53E3E" : "#7A2D8E" }}>{icon}</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {hint && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#9B87B0" }}>
            {hint}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={16} style={{ color: "#C4B0D8", flexShrink: 0 }} />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block active:opacity-70 transition-opacity">
        {inner}
      </Link>
    );
  }
  return <button className="w-full text-left active:opacity-70 transition-opacity">{inner}</button>;
}

function MenuDivider() {
  return <div style={{ height: 1, background: "#F3EFF8", marginLeft: 68 }} />;
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", boxShadow: "0 1px 3px rgba(90,42,106,0.06)" }}
    >
      {children}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, name }: { url?: string; name: string }) {
  const initials = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" style={{ width: 96, height: 96 }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #fff",
            boxShadow: "0 2px 16px rgba(143,58,143,0.18)",
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full text-white text-2xl font-bold"
          style={{
            width: 96,
            height: 96,
            background: "linear-gradient(135deg,#A33BB5,#6A2F8A)",
            border: "3px solid #fff",
            boxShadow: "0 2px 16px rgba(143,58,143,0.18)",
          }}
        >
          {initials || "😊"}
        </div>
      )}

      {/* Camera badge */}
      <Link
        href="/onboarding"
        className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
        style={{
          width: 28,
          height: 28,
          background: "linear-gradient(135deg,#A33BB5,#6A2F8A)",
          border: "2px solid #fff",
        }}
      >
        <Camera size={13} color="#fff" />
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProfileView({ data }: { data: ProfileData }) {
  const { profile, preferences, interests, personality, photos } = data;

  const name = profile?.fullName ?? "";
  const age = calcAge(profile?.dateOfBirth);
  const height = preferences?.heightCm;
  const goals = preferences?.relationshipGoals?.filter(Boolean) ?? [];
  const hobbies = interests?.hobbies?.filter(h => h && h !== "Not specified") ?? [];
  const drinking = personality?.socialLevel;
  const religion = personality?.religion?.[0];
  const kidsHave = personality?.kidsStatus;
  const firstPhoto = photos[0]?.url;
  const photoCount = photos.length;

  const displayName = name || "Your name";
  const subtitle = [
    age ? `${age} years` : null,
    preferences?.genderIdentity,
    profile?.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="min-h-full pb-8"
      style={{ background: "#F5F0FB", fontFamily: "var(--font-geist-sans,sans-serif)" }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-2"
        style={{ background: "#F5F0FB" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "#1A0A2E" }}>
          My Profile
        </h1>
        <Link
          href="/onboarding"
          className="flex items-center justify-center rounded-xl"
          style={{ width: 38, height: 38, background: "#fff", boxShadow: "0 1px 4px rgba(90,42,106,0.1)" }}
        >
          <Settings size={18} style={{ color: "#7A2D8E" }} />
        </Link>
      </div>

      {/* ── Profile hero ── */}
      <div
        className="mx-4 rounded-3xl flex flex-col items-center py-8 px-4 gap-4 mb-5"
        style={{ background: "#fff", boxShadow: "0 1px 3px rgba(90,42,106,0.06)" }}
      >
        <Avatar url={firstPhoto} name={displayName} />

        <div className="text-center">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-playfair,Georgia,serif)", color: "#1A0A2E" }}
          >
            {displayName}
          </h2>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "#9B87B0" }}>
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href="/onboarding"
          className="px-8 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#A33BB5,#6A2F8A)" }}
        >
          Edit Profile
        </Link>
      </div>

      {/* ── Menu groups ── */}
      <div className="flex flex-col gap-4 px-4">

        {/* Profile details */}
        <MenuCard>
          <MenuRow
            href="/profile/edit/photos"
            icon={<Camera size={18} />}
            iconBg="#F5EAFF"
            label="My Photos"
            hint={photoCount > 0 ? `${photoCount} photo${photoCount !== 1 ? "s" : ""}` : "No photos yet"}
          />
          <MenuDivider />
          <MenuRow
            href="/profile/edit/interests"
            icon={<Sparkles size={18} />}
            iconBg="#F0F4FF"
            label="Interests"
            hint={hobbies.length > 0 ? hobbies.slice(0, 2).join(", ") : "Not set"}
          />
          <MenuDivider />
          <MenuRow
            href="/profile/edit/looking-for"
            icon={<Heart size={18} />}
            iconBg="#FFF0F8"
            label="Looking for"
            hint={goals[0] ?? "Not set"}
          />
          <MenuDivider />
          <MenuRow
            href="/profile/edit/height"
            icon={<Ruler size={18} />}
            iconBg="#F0FFF5"
            label="Height"
            hint={height ? `${height} cm` : "Not set"}
          />
        </MenuCard>

        {/* Lifestyle */}
        <MenuCard>
          <MenuRow
            href="/profile/edit/drinking"
            icon={<Wine size={18} />}
            iconBg="#FFF8EC"
            label="Drinking"
            hint={drinking ?? "Not set"}
          />
          <MenuDivider />
          <MenuRow
            href="/profile/edit/religion"
            icon={<BookOpen size={18} />}
            iconBg="#F5EAFF"
            label="Religion"
            hint={religion ?? "Not set"}
          />
          <MenuDivider />
          <MenuRow
            href="/profile/edit/family"
            icon={<Baby size={18} />}
            iconBg="#FFF0F8"
            label="Family plans"
            hint={kidsHave ?? "Not set"}
          />
        </MenuCard>

        {/* App settings */}
        <MenuCard>
          <MenuRow
            href="/"
            icon={<Bell size={18} />}
            iconBg="#F0F4FF"
            label="Notifications"
          />
        </MenuCard>

        {/* Support + logout */}
        <MenuCard>
          <MenuRow
            href="/"
            icon={<HelpCircle size={18} />}
            iconBg="#F5EAFF"
            label="Help & Support"
          />
          <MenuDivider />
          <MenuRow
            icon={<LogOut size={18} />}
            iconBg="#FFF0F0"
            label="Log out"
            danger
          />
        </MenuCard>

      </div>
    </div>
  );
}
