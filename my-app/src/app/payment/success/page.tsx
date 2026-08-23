"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BG = "#EDE8D5";
const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const SERIF = "'Playfair Display', Georgia, serif";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/home"), 3000);
    return () => clearTimeout(t);
  }, [router]);

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
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: ACCENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          color: "#fff",
          marginBottom: 24,
        }}
      >
        ✓
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 28,
          fontWeight: 800,
          color: DARK,
          margin: "0 0 12px",
        }}
      >
        You&apos;re now VIP!
      </h1>
      <p style={{ color: DARK, fontSize: 15, margin: "0 0 8px" }}>
        Your VIP access is active. Welcome to weekly matchmaking.
      </p>
      <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
        Redirecting you home in a moment…
      </p>
    </div>
  );
}
