"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";
const CARD = "#fff";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

export function UpgradeView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  async function handleSubscribe() {
    if (!scriptLoaded) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/subscribe", { method: "POST" });
      const data = await res.json() as {
        success: boolean;
        data?: { orderId: string; keyId: string };
        error?: { message: string };
      };

      if (!data.success || !data.data) {
        setError(data.error?.message ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const { orderId, keyId } = data.data;

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount: 9900,
        currency: "INR",
        name: "Ren",
        description: "VIP — ₹99",
        theme: { color: ACCENT },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json() as { success: boolean };
            if (verifyData.success) {
              router.push("/payment/success");
            } else {
              setError("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          } catch {
            setError("Network error during verification. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />
      <div style={{ minHeight: "100dvh", background: BG }}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header with back button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "20px 20px 16px",
              borderBottom: `2px solid ${DARK}`,
              background: BG,
            }}
          >
            <button
              onClick={() => router.back()}
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
              Choose your plan
            </h1>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 20px 32px", display: "flex", flexDirection: "column", flex: 1 }}>
            <p style={{ color: MUTED, fontSize: 14, margin: "0 0 24px" }}>
              Unlock weekly matchmaking with a VIP membership.
            </p>

            {/* Basic card */}
            <div
              style={{
                background: "#fff",
                border: `2.5px solid ${DARK}`,
                boxShadow: `4px 4px 0 ${DARK}`,
                borderRadius: 18,
                padding: "20px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: DARK }}>Basic</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: DARK }}>Free</span>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
                <li>Full profile &amp; onboarding</li>
                <li>Browse the app</li>
                <li style={{ color: "#9ca3af", textDecoration: "line-through" }}>Weekly matchmaking opt-in</li>
                <li style={{ color: "#9ca3af", textDecoration: "line-through" }}>Priority matching</li>
              </ul>
              <button
                onClick={() => router.push("/home")}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px 0",
                  border: `2.5px solid ${DARK}`,
                  boxShadow: `4px 4px 0 ${DARK}`,
                  borderRadius: 999,
                  background: "transparent",
                  color: DARK,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue with Basic
              </button>
            </div>

            {/* VIP card */}
            <div
              style={{
                background: DARK,
                border: `2.5px solid ${DARK}`,
                boxShadow: `6px 6px 0 ${ACCENT}`,
                borderRadius: 18,
                padding: "20px",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: "#fff" }}>VIP</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>₹99</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginLeft: 4 }}>/month</span>
                </div>
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px", color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7 }}>
                <li>Everything in Basic</li>
                <li style={{ color: "#fff", fontWeight: 600 }}>Weekly matchmaking opt-in</li>
                <li style={{ color: "#fff", fontWeight: 600 }}>Priority matching</li>
              </ul>

              {error && (
                <p style={{ color: ACCENT, fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>
              )}

              <button
                onClick={handleSubscribe}
                disabled={!scriptLoaded || loading}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "14px 0",
                  border: `2.5px solid ${(!scriptLoaded || loading) ? MUTED : ACCENT}`,
                  boxShadow: (!scriptLoaded || loading) ? "none" : `4px 4px 0 rgba(255,255,255,0.25)`,
                  borderRadius: 999,
                  background: (!scriptLoaded || loading) ? MUTED : ACCENT,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: (!scriptLoaded || loading) ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {!scriptLoaded ? "Loading…" : loading ? "Opening payment…" : "Subscribe — ₹99/month"}
              </button>
            </div>

            <p style={{ fontSize: 11, color: MUTED, textAlign: "center", margin: 0 }}>
              Cancel anytime. Powered by Razorpay. UPI, cards &amp; netbanking accepted.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
