"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, ShieldCheck, ChevronDown } from "lucide-react";

const DARK = "#2B1A07";
const ACCENT = "#E8622A";
const MUTED = "#7A6A54";
const BG = "#EDE8D5";

type Step = "email" | "otp" | "phone";

interface College {
  id: string;
  collegeName: string;
  domain: string;
}

// Decode JWT payload without verifying signature (client-side only)
function jwtPhone(token: string): string | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64)) as { phone?: string };
    return payload.phone ?? null;
  } catch {
    return null;
  }
}

const inputCls =
  "w-full px-4 py-3 bg-white text-base focus:outline-none placeholder:text-[#9B8B78]" +
  " text-[#1A0A00] rounded-xl border-[2px] border-[#2B1A07] shadow-[2px_2px_0_#2B1A07] transition-shadow";

function InlineError({ message }: { message: string }) {
  return (
    <p
      className="mt-3 flex items-start gap-2 text-sm rounded-xl px-3 py-2"
      style={{ background: "#FFF0EE", border: "1.5px solid #E8622A30", color: "#C0392B" }}
      role="alert"
    >
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
      {message}
    </p>
  );
}

function Fab({ disabled, loading }: { disabled?: boolean; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="focus:outline-none cursor-pointer disabled:opacity-40 shrink-0 transition-all active:translate-y-[1px] active:shadow-none"
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `2.5px solid ${DARK}`,
        boxShadow: `3px 3px 0 ${DARK}`,
        backgroundColor: DARK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {loading ? (
        <span
          style={{
            display: "block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
          stroke="#ffffff" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6l6 4-6 4" />
        </svg>
      )}
    </button>
  );
}

export default function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [showCollegePicker, setShowCollegePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [redirectTo, setRedirectTo] = useState("/onboarding");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const collegeButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/auth/colleges")
      .then((r) => r.json())
      .then((json) => { if (json?.data) setColleges(json.data); })
      .catch(() => {});
  }, []);

  // Close college picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        !collegeButtonRef.current?.contains(e.target as Node) &&
        !pickerRef.current?.contains(e.target as Node)
      ) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Countdown ticker for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) { setError("Please select your college first."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, collegeName: selectedCollege.collegeName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const json = await res.json() as {
        success?: boolean;
        data?: { token?: { accessToken?: string } | string; redirectTo?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid OTP");

      const tokenVal = json.data?.token;
      const token = typeof tokenVal === "string" ? tokenVal : tokenVal?.accessToken;
      const dest = typeof json.data?.redirectTo === "string" && json.data.redirectTo
        ? json.data.redirectTo : "/onboarding";

      if (!token) throw new Error("No access token in response. Please try again.");

      // Store cookie immediately
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Check if user already has a phone number in their JWT
      const existingPhone = jwtPhone(token);
      if (existingPhone) {
        // Returning user with phone → go straight to app
        window.location.assign(dest.startsWith("/") ? dest : "/onboarding");
        return;
      }

      // New user — collect phone before redirecting
      setAccessToken(token);
      setRedirectTo(dest.startsWith("/") ? dest : "/onboarding");
      setStep("phone");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true); setPhoneError(null);
    try {
      const res = await fetch("/api/onboarding/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ phone: `+91${digits}` }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to save phone");
      }
      window.location.assign(redirectTo);
    } catch (err) {
      setPhoneError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!selectedCollege || resendCooldown > 0) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, collegeName: selectedCollege.collegeName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
      setResendCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.split("");
    next[index] = digit;
    const joined = next.join("").slice(0, 6);
    setOtp(joined);
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (digit && index === 5 && joined.length === 6) {
      // Auto-submit when last digit is entered
      setTimeout(() => otpFormRef.current?.requestSubmit(), 80);
    }
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
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full">
      {/* ── Email step ── */}
      {step === "email" && (
        <form onSubmit={sendOtp} className="flex flex-col flex-1">
          <div className="flex justify-start mb-6">
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                border: `2.5px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}`,
                backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Mail size={26} strokeWidth={1.8} style={{ color: DARK }} />
            </div>
          </div>

          <h1
            className="text-3xl font-black mb-8 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            What&apos;s your college email?
          </h1>

          {/* College selector */}
          <div className="mb-5 relative">
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
              Your college
            </label>
            <button
              ref={collegeButtonRef}
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
              style={{
                padding: "12px 16px",
                background: "white",
                border: `2px solid ${DARK}`,
                borderRadius: 12,
                boxShadow: `2px 2px 0 ${DARK}`,
                color: selectedCollege ? DARK : "#9B8B78",
                fontSize: 15,
              }}
            >
              <span>{selectedCollege ? selectedCollege.collegeName : "Select your college"}</span>
              <ChevronDown
                size={16}
                style={{ color: MUTED, transform: pickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
              />
            </button>

            {pickerOpen && (
              <div
                ref={pickerRef}
                className="absolute top-full left-0 right-0 mt-1 z-50 overflow-y-auto rounded-xl"
                style={{
                  maxHeight: 220,
                  background: BG,
                  border: `2px solid ${DARK}`,
                  boxShadow: `4px 4px 0 ${DARK}`,
                }}
              >
                {colleges.length === 0 ? (
                  <p className="px-4 py-3 text-sm" style={{ color: MUTED }}>No colleges found</p>
                ) : (
                  colleges.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCollege(c); setPickerOpen(false); setEmail(""); }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5"
                    >
                      <span className="font-semibold" style={{ color: DARK }}>{c.collegeName}</span>
                      <span className="text-xs ml-2" style={{ color: MUTED }}>@{c.domain}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Email input */}
          <div className="mb-2">
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
              College email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedCollege ? `you@${selectedCollege.domain}` : "Select college first"}
              disabled={!selectedCollege}
              className={`${inputCls} disabled:opacity-50`}
            />
            {selectedCollege && (
              <p className="text-xs mt-2" style={{ color: MUTED }}>
                Must end in <span className="font-semibold" style={{ color: DARK }}>@{selectedCollege.domain}</span>
              </p>
            )}
          </div>

          <p className="text-sm mt-4 mb-2" style={{ color: MUTED }}>
            We&apos;ll send a 6-digit verification code to your college email.
          </p>

          {error && <InlineError message={error} />}

          <div className="mt-auto pt-8 flex items-end justify-between">
            <span className="text-sm" style={{ color: MUTED }}>Use your college-issued email</span>
            <Fab disabled={!selectedCollege || !email || loading} loading={loading} />
          </div>
        </form>
      )}

      {/* ── OTP step ── */}
      {step === "otp" && (
        <form ref={otpFormRef} onSubmit={verifyOtp} className="flex flex-col flex-1">
          <div className="flex justify-start mb-6">
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                border: `2.5px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}`,
                backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ShieldCheck size={26} strokeWidth={1.8} style={{ color: DARK }} />
            </div>
          </div>

          <h1
            className="text-3xl font-black mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            Check your inbox
          </h1>
          <p className="text-sm mb-8" style={{ color: MUTED }}>
            Sent to <span className="font-semibold" style={{ color: DARK }}>{email}</span>.{" "}
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(null); }}
              className="font-semibold hover:underline"
              style={{ color: ACCENT }}
            >
              Edit
            </button>
          </p>

          {/* OTP boxes */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { otpInputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ""}
                autoFocus={i === 0}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="text-center text-xl font-bold focus:outline-none"
                style={{
                  width: 48, height: 56,
                  background: otp[i] ? "white" : BG,
                  border: `2px solid ${otp[i] ? DARK : "#C0B0A0"}`,
                  borderRadius: 12,
                  boxShadow: otp[i] ? `2px 2px 0 ${DARK}` : "none",
                  color: DARK,
                  transition: "all 0.1s",
                }}
              />
            ))}
          </div>

          {error && <InlineError message={error} />}

          <div className="mt-auto pt-8 flex items-end justify-between">
            <button
              type="button"
              onClick={resendOtp}
              disabled={loading || resendCooldown > 0}
              className="text-sm font-semibold hover:underline disabled:opacity-50"
              style={{ color: resendCooldown > 0 ? MUTED : ACCENT }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn\u2019t get a code?"}
            </button>
            <Fab disabled={otp.length !== 6 || loading} loading={loading} />
          </div>
        </form>
      )}

      {/* ── Phone step ── */}
      {step === "phone" && (
        <form onSubmit={savePhone} className="flex flex-col flex-1">
          <div className="flex justify-start mb-6">
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                border: `2.5px solid ${DARK}`, boxShadow: `3px 3px 0 ${DARK}`,
                backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
              </svg>
            </div>
          </div>

          <h1
            className="text-3xl font-black mb-2 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: DARK }}
          >
            One last thing
          </h1>
          <p className="text-sm mb-8" style={{ color: MUTED }}>
            We&apos;ll send your weekly match and updates over WhatsApp. No spam, ever.
          </p>

          <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
            Mobile number
          </label>

          {/* Phone input with +91 prefix */}
          <div
            className="flex items-center overflow-hidden"
            style={{
              background: "white",
              border: `2px solid ${phoneError ? ACCENT : DARK}`,
              borderRadius: 12,
              boxShadow: `2px 2px 0 ${DARK}`,
            }}
          >
            <span
              className="flex items-center px-3 text-base font-semibold shrink-0 select-none"
              style={{ color: DARK, borderRight: `1.5px solid ${DARK}30`, height: 52 }}
            >
              🇮🇳 +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              autoFocus
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(v);
                if (phoneError) setPhoneError(null);
              }}
              placeholder="9876543210"
              className="flex-1 px-3 py-3 text-base focus:outline-none bg-white placeholder:text-[#9B8B78] text-[#1A0A00]"
              style={{ minWidth: 0 }}
            />
          </div>

          {phoneError && <InlineError message={phoneError} />}

          <p className="text-xs mt-3" style={{ color: MUTED }}>
            Only used for match updates — never shared or sold.
          </p>

          <div className="mt-auto pt-8 flex items-end justify-between">
            <button
              type="button"
              onClick={() => window.location.assign(redirectTo)}
              className="text-sm font-semibold hover:underline"
              style={{ color: MUTED }}
            >
              Skip for now
            </button>
            <Fab disabled={phone.replace(/\D/g, "").length !== 10 || loading} loading={loading} />
          </div>
        </form>
      )}
    </div>
  );
}
