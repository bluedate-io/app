// ─── Centralised, validated configuration ─────────────────────────────────────
// All env vars are accessed exclusively through this module — never process.env directly.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

/** Try multiple env var names in order, return first truthy value or fallback */
function firstEnv(keys: string[], fallback: string): string {
  for (const key of keys) {
    const v = process.env[key];
    if (v) return v;
  }
  return fallback;
}

export const config = {
  env: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  isDev: optionalEnv("NODE_ENV", "development") === "development",
  isProd: process.env.NODE_ENV === "production",

  app: {
    url: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    port: parseInt(optionalEnv("PORT", "3000"), 10),
  },

  auth: {
    jwtSecret: optionalEnv("JWT_SECRET", "dev-secret-change-in-production"),
    jwtExpiry: optionalEnv("JWT_EXPIRY", "7d"),
    otpTtlMinutes: parseInt(optionalEnv("OTP_TTL_MINUTES", "10"), 10),
  },

  database: {
    url: optionalEnv("DATABASE_URL", ""),
  },

  twilio: {
    accountSid: optionalEnv("TWILIO_ACCOUNT_SID", ""),
    authToken: optionalEnv("TWILIO_AUTH_TOKEN", ""),
    verifyServiceSid: optionalEnv("TWILIO_VERIFY_SERVICE_SID", ""),
    whatsappNumber: optionalEnv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886"),
  },

  admin: {
    phone: optionalEnv("ADMIN_PHONE", "8309671828"),
  },

  supabase: {
    url: firstEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"], ""),
    anonKey: firstEnv(
      ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
      "",
    ),
    photoBucket: optionalEnv("SUPABASE_PHOTO_BUCKET", "photos"),
  },
} as const;

// Eagerly validate critical secrets at startup in production
if (config.isProd) {
  requireEnv("JWT_SECRET");
  requireEnv("DATABASE_URL");
  requireEnv("TWILIO_ACCOUNT_SID");
  requireEnv("TWILIO_AUTH_TOKEN");
  requireEnv("TWILIO_VERIFY_SERVICE_SID");
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_ANON_KEY");
}
