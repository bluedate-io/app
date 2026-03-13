"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp";

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: request OTP ────────────────────────────────────────────────────
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP + store token + redirect ────────────────────────────
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid OTP");

      const { token, redirectTo } = json.data as {
        token: { accessToken: string };
        redirectTo: string;
      };

      // Store token in a cookie so the RSC onboarding page can read it
      document.cookie = `access_token=${token.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      router.push(redirectTo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  const btnCls =
    "w-full mt-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50";

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={sendOtp}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+14155552671"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-400">E.164 format — include country code</p>
          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? "Sending…" : "Send OTP →"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <p className="text-sm text-gray-500 mb-4">
            Enter the 6-digit code sent to <span className="font-medium text-gray-800">{phone}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`${inputCls} tracking-[0.5em] text-center text-lg font-bold`}
          />
          <button type="submit" disabled={loading} className={btnCls}>
            {loading ? "Verifying…" : "Verify & Continue →"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
            className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            ← Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
