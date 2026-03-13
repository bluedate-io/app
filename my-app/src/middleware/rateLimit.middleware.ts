// ─── Rate limiting middleware (token-bucket, in-memory) ───────────────────────
// For production use Redis + a sliding-window algorithm instead.

import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/utils/response";
import { ErrorCode } from "@/constants/errors";

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, BucketEntry>();

function getClientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimit(options: {
  maxTokens: number;   // max requests per window
  windowMs: number;    // window size in ms
}) {
  const { maxTokens, windowMs } = options;

  return (req: NextRequest): NextResponse | null => {
    const key = getClientKey(req);
    const now = Date.now();
    const entry = buckets.get(key) ?? { tokens: maxTokens, lastRefill: now };

    // Refill tokens proportionally to elapsed time
    const elapsed = now - entry.lastRefill;
    const refill = Math.floor((elapsed / windowMs) * maxTokens);
    entry.tokens = Math.min(maxTokens, entry.tokens + refill);
    entry.lastRefill = now;

    if (entry.tokens <= 0) {
      buckets.set(key, entry);
      return errorResponse(
        "Too many requests — please slow down",
        ErrorCode.SERVICE_UNAVAILABLE,
        429,
      );
    }

    entry.tokens -= 1;
    buckets.set(key, entry);
    return null; // proceed
  };
}
