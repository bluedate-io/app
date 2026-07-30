"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

export function WelcomeView({ name }: { name?: string }) {
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
            setError("Network error during verification.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const displayName = name ? name.split(" ")[0] : null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 20px" }}>

          {/* Hero */}
          <div style={{ paddingTop: 56, paddingBottom: 32, textAlign: "center" }}>
            {/* Confetti-style icon cluster */}
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 20 }}>🎉</div>

            <h1 style={{
              fontFamily: SERIF,
              fontSize: 30,
              fontWeight: 800,
              color: DARK,
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}>
              {displayName ? `You're all set, ${displayName}!` : "You're all set!"}
            </h1>
            <p style={{ color: MUTED, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
              Your profile is ready. Choose a plan to get started with Tryren.
            </p>
          </div>

          {/* Plan cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

            {/* VIP card — shown first, most prominent */}
            <div style={{
              background: DARK,
              border: `2.5px solid ${DARK}`,
              boxShadow: `6px 6px 0 ${ACCENT}`,
              borderRadius: 20,
              padding: "22px 20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: "#fff" }}>VIP</span>
                  <span style={{
                    marginLeft: 8,
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
                    color: ACCENT, background: `${ACCENT}25`, borderRadius: 999, padding: "2px 8px",
                  }}>Recommended</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>₹99</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>/mo</span>
                </div>
              </div>
              <ul style={{ margin: "12px 0 0", padding: "0 0 0 18px", color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.85 }}>
                <li>Everything in Basic</li>
                <li style={{ color: "#fff", fontWeight: 600 }}>Weekly matchmaking opt-in</li>
                <li style={{ color: "#fff", fontWeight: 600 }}>Priority matching</li>
              </ul>

              {error && <p style={{ color: "#FCA5A5", fontSize: 13, marginTop: 12 }}>{error}</p>}

              <button
                onClick={handleSubscribe}
                disabled={!scriptLoaded || loading}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "14px 0",
                  border: `2.5px solid ${(!scriptLoaded || loading) ? MUTED : ACCENT}`,
                  boxShadow: (!scriptLoaded || loading) ? "none" : `4px 4px 0 rgba(255,255,255,0.2)`,
                  borderRadius: 999,
                  background: (!scriptLoaded || loading) ? MUTED : ACCENT,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: (!scriptLoaded || loading) ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {!scriptLoaded ? "Loading…" : loading ? "Opening payment…" : "Get VIP — ₹99/month"}
              </button>
            </div>

            {/* Basic card */}
            <div style={{
              background: "#fff",
              border: `2.5px solid ${DARK}`,
              boxShadow: `4px 4px 0 ${DARK}`,
              borderRadius: 20,
              padding: "22px 20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: DARK }}>Basic</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: DARK }}>Free</span>
              </div>
              <ul style={{ margin: "12px 0 0", padding: "0 0 0 18px", color: MUTED, fontSize: 13, lineHeight: 1.85 }}>
                <li>Full profile &amp; onboarding</li>
                <li>Browse the app</li>
                <li style={{ color: "#C0B0A0", textDecoration: "line-through" }}>Weekly matchmaking opt-in</li>
                <li style={{ color: "#C0B0A0", textDecoration: "line-through" }}>Priority matching</li>
              </ul>
              <button
                onClick={() => router.replace("/home")}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "12px 0",
                  border: `2.5px solid ${DARK}`,
                  boxShadow: `3px 3px 0 ${DARK}`,
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

          </div>

          {/* Footer note */}
          <p style={{ fontSize: 11, color: MUTED, textAlign: "center", padding: "20px 0 32px" }}>
            Cancel anytime · Powered by Razorpay · UPI, cards &amp; netbanking accepted
          </p>
        </div>
      </div>
    </>
  );
}
