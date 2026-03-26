// ─── Opt-in tokenisation ──────────────────────────────────────────────────────
// Generates and verifies HMAC-signed, per-user tokens that are embedded in
// opt-in emails.  No expiry — a user who still has an old email can always
// re-opt-in; the server just overwrites the status.
//
// Token format:  base64url(userId) . HMAC-SHA256(base64url(userId))

import crypto from "crypto";
import { config } from "@/config";

export function generateOptInToken(userId: string): string {
  const payload = Buffer.from(userId).toString("base64url");
  const sig = crypto
    .createHmac("sha256", config.auth.jwtSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Returns the userId if the token is valid, or null otherwise. */
export function verifyOptInToken(token: string): string | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto
      .createHmac("sha256", config.auth.jwtSecret)
      .update(payload)
      .digest("base64url");
    if (sig !== expected) return null;
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}
