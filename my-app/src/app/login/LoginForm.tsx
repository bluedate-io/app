"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, ShieldCheck, AlertTriangle, ChevronDown } from "lucide-react";

type Step = "email" | "otp";

interface College {
  id: string;
  collegeName: string;
  domain: string;
}

export default function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [showCollegePicker, setShowCollegePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const collegeButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerStyle, setPickerStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load colleges on mount
  useEffect(() => {
    fetch("/api/auth/colleges")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setColleges(json.data);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  useEffect(() => {
    if (showCollegePicker && collegeButtonRef.current) {
      const rect = collegeButtonRef.current.getBoundingClientRect();
      setPickerStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setPickerStyle(null);
    }
  }, [showCollegePicker]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) {
      setError("Please select your college first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, collegeName: selectedCollege.collegeName }),
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          token?: { accessToken?: string } | string;
          redirectTo?: string;
        };
        error?: { message?: string };
      };

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Invalid OTP");
      }

      const data = json.data;
      const tokenVal = data?.token;
      const accessToken =
        typeof tokenVal === "string" ? tokenVal : tokenVal?.accessToken;
      const redirectTo =
        typeof data?.redirectTo === "string" && data.redirectTo
          ? data.redirectTo
          : "/onboarding";

      if (!accessToken || typeof accessToken !== "string") {
        throw new Error("No access token in response. Please try again.");
      }

      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `access_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
      window.location.assign(redirectTo.startsWith("/") ? redirectTo : `/onboarding`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!selectedCollege) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, collegeName: selectedCollege.collegeName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const FabIcon = ({ disabled }: { disabled?: boolean }) => (
    <span
      className={`flex items-center justify-center shrink-0 rounded-full transition ${
        disabled ? "opacity-50" : ""
      }`}
      style={{ width: 52, height: 52, backgroundColor: "#1A0A00" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6l6 4-6 4" />
      </svg>
    </span>
  );

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, 6);
    setOtp(joined);
    if (digit && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full">
      <div className="flex justify-start mb-6">
        {step === "email" ? (
          <Mail size={48} strokeWidth={1.5} style={{ color: "#1A0A00" }} className="shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: "#1A0A00" }}>
            <ShieldCheck size={28} strokeWidth={1.5} style={{ color: "#1A0A00" }} />
          </div>
        )}
      </div>

      {step === "email" ? (
        <form onSubmit={sendOtp} className="flex flex-col flex-1">
          <h1
            className="text-3xl md:text-4xl font-black mb-8 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#1A0A00" }}
          >
            What&apos;s your college email?
          </h1>

          {/* College selector */}
          <div className="mb-5">
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
              Your college
            </label>
            <div className="relative">
              <button
                ref={collegeButtonRef}
                type="button"
                onClick={() => setShowCollegePicker(!showCollegePicker)}
                className="w-full flex items-center justify-between pb-2 border-b-2 bg-transparent text-left" style={{ borderColor: "#1A0A00" }}
              >
                <span className={selectedCollege ? "text-gray-900" : "text-gray-400"}>
                  {selectedCollege ? selectedCollege.collegeName : "Select your college"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-600 transition-transform ${showCollegePicker ? "rotate-180" : ""}`}
                />
              </button>

              {showCollegePicker && pickerStyle && (
                <div
                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-60 max-h-56 overflow-y-auto"
                  style={{
                    top: pickerStyle.top,
                    left: pickerStyle.left,
                    width: pickerStyle.width,
                    minWidth: 260,
                  }}
                >
                  {colleges.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No colleges found</p>
                  ) : (
                    colleges.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCollege(c);
                          setShowCollegePicker(false);
                          setEmail("");
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm"
                      >
                        <span className="text-gray-900 font-medium">{c.collegeName}</span>
                        <span className="text-gray-400 text-xs ml-2">@{c.domain}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email input */}
          <div className="mb-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
              College email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                selectedCollege ? `you@${selectedCollege.domain}` : "Select college first"
              }
              disabled={!selectedCollege}
              className="w-full pb-2 border-b-2 bg-transparent text-base focus:outline-none placeholder:text-gray-400 disabled:opacity-50" style={{ borderColor: "#1A0A00", color: "#1A0A00" }}
            />
          </div>

          {selectedCollege && (
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Must end in <span className="font-medium text-gray-600">@{selectedCollege.domain}</span>
            </p>
          )}

          {!selectedCollege && <div className="mb-6" />}

          <p className="text-sm text-gray-500 mb-4">
            We&apos;ll send a verification code to your college email.
          </p>

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-600 mb-2" role="alert">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
              {error}
            </p>
          )}

          <div className="mt-auto pt-8 flex items-end justify-between">
            <span className="text-sm text-gray-400">
              Use your college-issued email
            </span>
            <button
              type="submit"
              disabled={loading || !selectedCollege || !email}
              className="focus:outline-none rounded-full p-0 border-0 cursor-pointer disabled:opacity-50"
            >
              <FabIcon disabled={loading || !selectedCollege || !email} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="flex flex-col flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Enter your verification code
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Sent to {email}.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
              className="font-medium hover:underline"
              style={{ color: "#E8622A" }}
            >
              Edit
            </button>
          </p>

          <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { otpInputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ""}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-10 h-12 text-center text-xl font-medium bg-transparent border-b-2 focus:outline-none" style={{ borderColor: "#1A0A00", color: "#1A0A00" }}
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
              onClick={resendOtp}
              disabled={loading}
              className="text-sm hover:underline disabled:opacity-50"
              style={{ color: "#E8622A" }}
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

      {/* Overlay to close college picker when clicking outside */}
      {showCollegePicker && (
        <div
          className="fixed inset-0 z-50"
          aria-hidden
          onClick={() => setShowCollegePicker(false)}
        />
      )}
    </div>
  );
}
