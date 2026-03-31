"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import BdButton from "@/components/admin-bd/BdButton";
import BdCard from "@/components/admin-bd/BdCard";
import BdInput from "@/components/admin-bd/BdInput";
import { adminTheme } from "@/lib/adminTheme";

function hasAdminToken(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("admin_token=");
}

type Step = "email" | "otp";

function InlineWarning({ message }: { message: string }) {
  return (
    <div
      className="mb-4 flex items-start gap-2 text-sm"
      style={{ color: adminTheme.error }}
      role="alert"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (hasAdminToken()) router.replace("/admin/users");
  }, [router]);

  const requestOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        body: JSON.stringify({ email, code: otp }),
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
    <BdCard className="mx-auto w-full max-w-md text-left shadow-[8px_8px_0px_0px_var(--bd-shadow-ink)]">
      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            requestOtp();
          }}
          className="flex flex-col gap-6"
        >
          <div>
            <h2
              className="text-2xl font-black leading-tight text-bd-ink md:text-3xl"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
            >
              Sign in to admin
            </h2>
            <p className="mt-2 text-sm text-bd-text-secondary">Restricted to authorised email only.</p>
          </div>

          {error && <InlineWarning message={error} />}

          <div>
            <label htmlFor="admin-email" className="sr-only">
              Admin email
            </label>
            <BdInput
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="Enter admin email"
            />
          </div>

          <BdButton type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Sending…" : "Continue"}
          </BdButton>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="flex flex-col gap-6">
          <div>
            <h2
              className="text-2xl font-black leading-tight text-bd-ink md:text-3xl"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif" }}
            >
              Enter verification code
            </h2>
            <p className="mt-2 text-sm text-bd-text-secondary">
              OTP sent to {email}.{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError(null);
                }}
                className="font-semibold text-bd-orange hover:underline"
              >
                Edit
              </button>
            </p>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ""}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-12 w-9 rounded-xl border-2 border-bd-ink bg-bd-card text-center text-xl font-semibold text-bd-ink focus:outline-none focus:ring-2 focus:ring-bd-orange focus:ring-offset-2 focus:ring-offset-bd-card sm:w-10"
              />
            ))}
          </div>

          {error && <InlineWarning message={error} />}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                requestOtp();
              }}
              disabled={loading}
              className="text-sm font-medium text-bd-orange hover:underline disabled:opacity-50"
            >
              Didn&apos;t get a code?
            </button>
            <BdButton type="submit" disabled={loading || otp.length !== 6}>
              {loading ? "Checking…" : "Sign in"}
            </BdButton>
          </div>
        </form>
      )}
    </BdCard>
  );
}
