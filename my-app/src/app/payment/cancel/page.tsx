"use client";

import { useRouter } from "next/navigation";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const MUTED = "#7A6A54";
const SERIF = "'Playfair Display', Georgia, serif";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 28,
          fontWeight: 800,
          color: DARK,
          margin: "0 0 12px",
        }}
      >
        No worries
      </h1>
      <p style={{ color: MUTED, fontSize: 15, margin: "0 0 28px", maxWidth: 320 }}>
        You haven&apos;t been charged. You can upgrade to VIP whenever you&apos;re ready.
      </p>
      <button
        onClick={() => router.push("/profile/membership")}
        style={{
          padding: "13px 28px",
          background: DARK,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        View plans
      </button>
      <button
        onClick={() => router.push("/home")}
        style={{
          marginTop: 12,
          padding: "12px 28px",
          background: "transparent",
          color: MUTED,
          border: "none",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Go to home
      </button>
    </div>
  );
}
