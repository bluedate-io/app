"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { config } from "@/config";

function hasAdminToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("admin_token=");
}

type Step = "phone" | "otp";

const ADMIN_PHONE = config.admin.phone;

const FabIcon = ({ disabled }: { disabled?: boolean }) => (
  <span
    className={`flex items-center justify-center shrink-0 rounded-full transition ${disabled ? "opacity-50" : ""}`}
    style={{ width: 52, height: 52, backgroundColor: "#E0E0E0" }}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="#2d2d2d"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6l6 4-6 4" />
    </svg>
  </span>
);

export default function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (hasAdminToken()) router.replace("/admin/users");
  }, [router]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ADMIN_PHONE }),
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

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ADMIN_PHONE, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid OTP");

      const { token } = json.data as { token: string };
      document.cookie = `admin_token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
      router.push("/admin/users");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.split("");
    next[i] = digit;
    const joined = next.join("").slice(0, 6);
    setOtp(joined);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full">
      <div className="flex justify-start mb-6">
        <div className="w-14 h-14 rounded-full border-2 border-gray-900 flex items-center justify-center shrink-0">
          <ShieldCheck size={28} strokeWidth={1.5} className="text-gray-900" />
        </div>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendOtp} className="flex flex-col flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Admin access
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Restricted to authorised numbers only.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-800 mb-8">
            <span className="text-gray-500 text-base">+91</span>
            <span className="text-gray-900 text-base tracking-widest">{ADMIN_PHONE}</span>
          </div>

          <div className="mt-auto pt-8 flex items-end justify-end">
            <button
              type="submit"
              disabled={loading}
              className="focus:outline-none rounded-full p-0 border-0 cursor-pointer"
            >
              <FabIcon disabled={loading} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="flex flex-col flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Enter verification code
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Sent to +91 {ADMIN_PHONE}.{" "}
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
              className="font-medium hover:underline"
              style={{ color: "#8F3A8F" }}
            >
              Edit
            </button>
          </p>

          <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ""}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-10 h-12 text-center text-xl font-medium bg-transparent border-b-2 border-gray-800 text-gray-900 focus:outline-none focus:border-gray-900"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 mb-6 text-red-600 text-sm">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-auto pt-8 flex items-end justify-between">
            <button
              type="button"
              onClick={() => { setError(null); sendOtp({ preventDefault: () => {} } as React.FormEvent); }}
              disabled={loading}
              className="text-sm hover:underline disabled:opacity-50"
              style={{ color: "#8F3A8F" }}
            >
              Didn&apos;t get a code?
            </button>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="focus:outline-none rounded-full p-0 border-0 cursor-pointer disabled:opacity-50"
            >
              <FabIcon disabled={loading || otp.length !== 6} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
