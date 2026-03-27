import { z } from "zod";

const emailSchema = z.string().trim().email();

export function extractEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return null;
  const at = parsed.data.lastIndexOf("@");
  if (at < 0) return null;
  return parsed.data.slice(at + 1).toLowerCase();
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
