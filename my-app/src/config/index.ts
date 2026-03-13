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

export const config = {
  env: optionalEnv("NODE_ENV", "development") as
    | "development"
    | "production"
    | "test",
  isDev: optionalEnv("NODE_ENV", "development") === "development",
  isProd: process.env.NODE_ENV === "production",

  app: {
    url: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    port: parseInt(optionalEnv("PORT", "3000"), 10),
  },

  auth: {
    jwtSecret: optionalEnv("JWT_SECRET", "dev-secret-change-in-production"),
    jwtRefreshSecret: optionalEnv(
      "JWT_REFRESH_SECRET",
      "dev-refresh-secret-change-in-production",
    ),
    jwtExpiry: optionalEnv("JWT_EXPIRY", "7d"),
    refreshExpiry: optionalEnv("JWT_REFRESH_EXPIRY", "30d"),
  },

  database: {
    url: optionalEnv("DATABASE_URL", ""),
  },

  redis: {
    url: optionalEnv("REDIS_URL", ""),
  },
} as const;

// Eagerly validate production secrets at startup
if (config.isProd) {
  requireEnv("JWT_SECRET");
  requireEnv("JWT_REFRESH_SECRET");
  requireEnv("DATABASE_URL");
}
