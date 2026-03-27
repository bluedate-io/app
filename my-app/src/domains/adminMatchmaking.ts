// ─── Admin matchmaking — pure domain helpers (no I/O) ─────────────────────────

/** Normalize CSV query param into trimmed non-empty strings. */
export function parseCsvParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function normalizeGenderLabel(v: string): "Woman" | "Man" | "Nonbinary" | null {
  const s = v.trim().toLowerCase();
  if (s === "woman" || s === "women") return "Woman";
  if (s === "man" || s === "men") return "Man";
  if (s === "nonbinary" || s === "non-binary" || s === "nb") return "Nonbinary";
  return null;
}

/** Expand admin gender filter tokens to DB value variants (legacy casing). */
export function expandGenderFilterValues(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const g = normalizeGenderLabel(raw);
    if (!g) continue;
    if (g === "Woman") out.push("Woman", "woman", "Women", "women");
    if (g === "Man") out.push("Man", "man", "Men", "men");
    if (g === "Nonbinary") out.push("Nonbinary", "nonbinary", "Non-binary", "non-binary");
  }
  return Array.from(new Set(out));
}

/** Opposite-gender Prisma `in` list for User A when no explicit gender filter. */
export function oppositeGenderIdentityValues(userAGender: string): string[] | null {
  const aGenderNorm = String(userAGender).trim().toLowerCase();
  if (aGenderNorm === "man") return ["Woman", "woman", "Women", "women"];
  if (aGenderNorm === "woman") return ["Man", "man", "Men", "men"];
  return null;
}

export function normLower(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}
