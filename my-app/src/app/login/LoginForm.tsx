"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, AlertTriangle } from "lucide-react";

type Step = "phone" | "otp";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", country: "India" },
  { code: "+1", flag: "🇺🇸", country: "US" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+61", flag: "🇦🇺", country: "Australia" },
  { code: "+81", flag: "🇯🇵", country: "Japan" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+55", flag: "🇧🇷", country: "Brazil" },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState<(typeof COUNTRY_CODES)[number]>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerStyle, setPickerStyle] = useState<{ top: number; left: number } | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhone = `${countryCode.code}${phoneNumber.replace(/\D/g, "")}`;
  const formattedPhone = `${countryCode.code} ${phoneNumber.replace(/\D/g, "")}`;

  useEffect(() => {
    if (showCountryPicker && countryButtonRef.current) {
      const rect = countryButtonRef.current.getBoundingClientRect();
      setPickerStyle({ top: rect.bottom + 4, left: rect.left });
    } else {
      setPickerStyle(null);
    }
  }, [showCountryPicker]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
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
        body: JSON.stringify({ phone: fullPhone, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Invalid OTP");

      const { token, redirectTo } = json.data as {
        token: { accessToken: string };
        redirectTo: string;
      };

      document.cookie = `access_token=${token.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push(redirectTo);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };


  // Circular FAB — light grey bg, dark right-pointing chevron ">" (matches reference)
  const FabIcon = ({ disabled }: { disabled?: boolean }) => (
    <span
      className={`flex items-center justify-center shrink-0 rounded-full transition ${
        disabled ? "opacity-50" : ""
      }`}
      style={{
        width: 52,
        height: 52,
        backgroundColor: "#E0E0E0",
      }}
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
        {/* Right-pointing chevron ">" */}
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

  const resendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to send OTP");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full">
      <div className="flex justify-start mb-6">
        {step === "phone" ? (
          <Phone size={48} strokeWidth={1.5} className="text-gray-900 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-gray-900 flex items-center justify-center shrink-0">
            <ShieldCheck size={28} strokeWidth={1.5} className="text-gray-900" />
          </div>
        )}
      </div>
      {step === "phone" ? (
        <form onSubmit={sendOtp} className="flex flex-col flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            What&apos;s your phone number?
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-2">
            {/* Country code selector */}
            <div className="relative">
              <button
                ref={countryButtonRef}
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="flex items-center gap-1 pb-2 border-b-2 border-gray-800 min-w-[72px]"
              >
                <span className="text-lg">{countryCode.flag}</span>
                <span className="text-gray-900 font-medium">{countryCode.code}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-600 transition ${showCountryPicker ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showCountryPicker && pickerStyle && (
                <div
                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60] max-h-48 overflow-y-auto"
                  style={{
                    minWidth: "140px",
                    top: pickerStyle.top,
                    left: pickerStyle.left,
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCountryCode(c);
                        setShowCountryPicker(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <span>{c.flag}</span>
                      <span className="text-gray-900">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone number input */}
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder=""
              className="flex-1 pb-2 border-b-2 border-gray-800 bg-transparent text-gray-900 text-base focus:outline-none focus:border-gray-900 placeholder:text-gray-400"
            />
          </div>

          <p className="text-sm text-gray-500 mb-8 mt-1">
            bluedate will send you a text with a verification code.
            <br />
            Message and data rates may apply.
          </p>

          <div className="mt-auto pt-8 flex items-end justify-between">
            <a
              href="#"
              className="text-sm hover:underline"
              style={{ color: "#8F3A8F" }}
              onClick={(e) => e.preventDefault()}
            >
              What if my number changes?
            </a>
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
            Enter your verification code
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Sent to {formattedPhone}.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="font-medium hover:underline"
              style={{ color: "#8F3A8F" }}
            >
              Edit
            </button>
          </p>

          <div
            className="flex gap-3 justify-center mb-6"
            onPaste={handleOtpPaste}
          >
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
              onClick={resendOtp}
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

      {/* Overlay to close country picker when clicking outside */}
      {showCountryPicker && (
        <div
          className="fixed inset-0 z-50"
          aria-hidden
          onClick={() => setShowCountryPicker(false)}
        />
      )}
    </div>
  );
}
