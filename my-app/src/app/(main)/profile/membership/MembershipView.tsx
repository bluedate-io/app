"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Crown, User } from "lucide-react";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const CARD = "#fff";
const SERIF = "var(--font-playfair, Georgia, serif)";
const SANS = "var(--font-geist-sans, sans-serif)";

interface SubscriptionData {
  status: string;
  startedAt: Date | null;
  nextBillingAt: Date | null;
  createdAt: Date;
}

function fmt(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "13px 16px",
      borderBottom: last ? "none" : `1px solid ${DARK}12`,
      background: "transparent",
    }}>
      <span style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: DARK, fontFamily: SANS }}>{value}</span>
    </div>
  );
}

function PlanCard({
  title,
  price,
  features,
  accent,
  isCurrent,
}: {
  title: string;
  price: string;
  features: string[];
  accent: boolean;
  isCurrent: boolean;
}) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: 16,
      background: isCurrent ? (accent ? `${ACCENT}08` : `${DARK}06`) : "transparent",
      border: `1.5px solid ${isCurrent ? (accent ? `${ACCENT}35` : `${DARK}20`) : `${DARK}12`}`,
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {accent && <Crown size={13} color="#b45309" />}
          <span style={{ fontSize: 15, fontWeight: 700, color: DARK, fontFamily: SANS }}>{title}</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: DARK, fontFamily: SANS }}>{price}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={12} color={accent ? ACCENT : MUTED} strokeWidth={2.5} />
            <span style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MembershipView({
  planType,
  subscription,
}: {
  planType: "basic" | "vip";
  subscription: SubscriptionData | null;
}) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "20px 20px 16px",
          borderBottom: `2px solid ${DARK}`,
          background: BG,
        }}>
          <button
            onClick={() => router.push("/profile")}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: CARD, border: `2px solid ${DARK}`,
              boxShadow: `2px 2px 0 ${DARK}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} color={DARK} />
          </button>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: DARK, margin: 0 }}>
            Membership & Plans
          </h1>
        </div>

        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Current plan */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px 2px", fontFamily: SANS }}>
              Current Plan
            </p>
            <div style={{
              background: CARD, border: `2.5px solid ${DARK}`,
              boxShadow: `4px 4px 0 ${DARK}`, borderRadius: 18, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: planType === "vip" ? "#FFF8EE" : `${DARK}08`,
                  border: `1.5px solid ${DARK}15`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  color: planType === "vip" ? "#b45309" : MUTED,
                }}>
                  {planType === "vip" ? <Crown size={20} /> : <User size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: DARK, margin: 0, fontFamily: SANS }}>
                    {planType === "vip" ? "VIP" : "Basic"}
                  </p>
                  <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>
                    {planType === "vip" ? "Weekly matchmaking active" : "Free plan"}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: planType === "vip" ? "#166534" : MUTED,
                  background: planType === "vip" ? "#dcfce7" : `${DARK}08`,
                  border: `1.5px solid ${planType === "vip" ? "#86efac" : `${DARK}15`}`,
                  borderRadius: 999, padding: "4px 12px",
                }}>
                  {planType === "vip" ? "Active" : "Current"}
                </span>
              </div>
            </div>
          </section>

          {/* Payment details — VIP only */}
          {planType === "vip" && subscription?.startedAt && (
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px 2px", fontFamily: SANS }}>
                Payment Details
              </p>
              <div style={{
                background: CARD, border: `2.5px solid ${DARK}`,
                boxShadow: `4px 4px 0 ${DARK}`, borderRadius: 18, overflow: "hidden",
              }}>
                <DetailRow label="Plan" value="VIP · ₹99 / month" />
                <DetailRow label="Last payment" value={`₹99 · ${fmt(subscription.startedAt)}`} />
                <DetailRow
                  label="Next renewal"
                  value={subscription.nextBillingAt ? fmt(subscription.nextBillingAt) : "—"}
                  last
                />
              </div>
            </section>
          )}

          {/* All plans */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px 2px", fontFamily: SANS }}>
              All Plans
            </p>
            <div style={{
              background: CARD, border: `2.5px solid ${DARK}`,
              boxShadow: `4px 4px 0 ${DARK}`, borderRadius: 18, padding: "16px",
            }}>
              <PlanCard
                title="Basic"
                price="Free"
                features={["Full profile & onboarding", "Browse the app"]}
                accent={false}
                isCurrent={planType === "basic"}
              />
              <PlanCard
                title="VIP"
                price="₹99 / mo"
                features={["Everything in Basic", "Weekly matchmaking opt-in", "Priority matching"]}
                accent
                isCurrent={planType === "vip"}
              />

              {planType === "basic" && (
                <Link
                  href="/upgrade"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, marginTop: 6,
                    padding: "14px 0",
                    background: DARK, color: BG,
                    border: `2.5px solid ${DARK}`,
                    boxShadow: `4px 4px 0 ${ACCENT}`,
                    borderRadius: 14,
                    fontSize: 15, fontWeight: 700,
                    textDecoration: "none", fontFamily: SANS,
                  }}
                >
                  <Crown size={16} />
                  Upgrade to VIP
                </Link>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
