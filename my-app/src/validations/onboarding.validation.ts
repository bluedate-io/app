import { z } from "zod";

// ─── Step 1: Profile (Identity) ───────────────────────────────────────────────
// API receives fullName + dateOfBirth (ISO date string); age is computed server-side.

function parseAgeFromDateOfBirth(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00.000Z");
  const today = new Date();
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - d.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

export const profileSchema = z
  .object({
    fullName: z.string().min(1).max(80).trim(),
    nickname: z.string().max(40).trim().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
    city: z.string().min(2).max(80).trim().optional(),
    bio: z.string().max(500).trim().optional(),
  })
  .refine(
    (data) => {
      const d = new Date(data.dateOfBirth + "T00:00:00.000Z");
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const dStr = d.toISOString().slice(0, 10);
      return !Number.isNaN(d.getTime()) && dStr <= todayStr;
    },
    { message: "Date of birth must be in the past", path: ["dateOfBirth"] },
  )
  .refine(
    (data) => {
      const age = parseAgeFromDateOfBirth(data.dateOfBirth);
      return age >= 18 && age <= 100;
    },
    { message: "You must be at least 18 years old", path: ["dateOfBirth"] },
  );

// ─── Gender only (step: which gender describes you) ────────────────────────────

export const genderIdentitySchema = z.object({
  genderIdentity: z.string().min(1).max(60).trim(),
});

// ─── Invite code (step after gender) ──────────────────────────────────────────

export const inviteCodeSchema = z.object({
  code: z.string().min(1).max(20).trim(),
});

// ─── Dating mode only (step: Date vs BFF) — separate API ─────────────────────

export const datingModeSchema = z.object({
  mode: z.enum(["date", "bff"]),
});

// ─── Who to meet (step 4) — only gender preference, no genderIdentity required ─

export const genderPreferenceSchema = z.object({
  genderPreference: z.array(z.string().min(1).max(60)).min(1),
  ageRangeMin: z.number().int().min(18).max(99).optional(),
  ageRangeMax: z.number().int().min(18).max(100).optional(),
}).refine((d) => (d.ageRangeMin == null || d.ageRangeMax == null) || d.ageRangeMax >= d.ageRangeMin, {
  message: "ageRangeMax must be >= ageRangeMin",
  path: ["ageRangeMax"],
});

// ─── Relationship goals only (step 5) — no other preferences fields ─────

export const relationshipGoalsSchema = z.object({
  relationshipGoals: z.array(z.string().min(1).max(100).trim()).min(2).max(5),
});

// ─── Height (cm) — collected after relationship goals / BFF intent ─────────────
// Valid range: 91–220 cm (inclusive)
export const heightSchema = z.object({
  heightCm: z.number().int().min(91).max(220),
});

// ─── Age range only (step 5 — Date and BFF) ────────────────────────────────

export const ageRangeSchema = z
  .object({
    ageRangeMin: z.number().int().min(18).max(100),
    ageRangeMax: z.number().int().min(18).max(100),
  })
  .refine((d) => d.ageRangeMax >= d.ageRangeMin, {
    message: "ageRangeMax must be >= ageRangeMin",
    path: ["ageRangeMax"],
  });

// ─── Preferences (who to meet, age range; relationshipIntent optional) ─────
// When relationshipIntent is omitted, existing value is preserved (e.g. step 4 does not overwrite "date").

export const preferencesSchema = z.object({
  genderIdentity: z.string().min(1).max(60).trim(),
  genderPreference: z.array(z.string().min(1).max(60)).min(1),
  ageRangeMin: z.number().int().min(18).max(99),
  ageRangeMax: z.number().int().min(18).max(100),
  relationshipIntent: z.string().min(1).max(100).trim().optional(),
  relationshipGoals: z.array(z.string().min(1).max(100).trim()).min(0).max(5).optional(),
}).refine((d) => d.ageRangeMax >= d.ageRangeMin, {
  message: "ageRangeMax must be >= ageRangeMin",
  path: ["ageRangeMax"],
});

// ─── Step 3: Interests ────────────────────────────────────────────────────────

export const interestsSchema = z.object({
  hobbies: z.array(z.string().min(1).max(60)).min(1).max(20),
  favouriteActivities: z.array(z.string().min(1).max(60)).max(20).default([]),
  musicTaste: z.array(z.string().min(1).max(60)).max(20).default([]),
  foodTaste: z.array(z.string().min(1).max(60)).max(20).default([]),
});

// ─── Step 4: Personality ─────────────────────────────────────────────────────

export const personalitySchema = z.object({
  socialLevel: z.string().min(1).max(100).trim(),
  conversationStyle: z.string().min(1).max(100).trim(),
  funFact: z.string().max(200).trim().optional(),
});

// ─── Step: Family plans / kids ──────────────────────────────────────────────────
// Both fields optional; client enforces "at least one" for Next, but Skip is allowed.

export const familyPlansSchema = z.object({
  kidsStatus: z.enum(["Have kids", "Don't have kids"]).optional(),
  kidsPreference: z
    .enum(["Don't want kids", "Open to kids", "Want kids", "Not sure"])
    .optional(),
});

// ─── Step: What's important in your life? (religion & politics) ─────────────────

const religionValues = [
  "Agnostic",
  "Atheist",
  "Buddhist",
  "Catholic",
  "Christian",
  "Hindu",
  "Jain",
  "Jewish",
  "Mormon",
  "Latter-day Saint",
  "Muslim",
  "Zoroastrian",
  "Sikh",
  "Spiritual",
  "Other",
] as const;

const politicsValues = [
  "Apolitical",
  "Moderate",
  "Left",
  "Right",
  "Communist",
  "Socialist",
] as const;

export const importantLifeSchema = z.object({
  religion: z.array(z.enum(religionValues)).max(5).optional().default([]),
  politics: z.array(z.enum(politicsValues)).max(3).optional().default([]),
});

// ─── Step 5: Availability ─────────────────────────────────────────────────────

export const availabilitySchema = z.object({
  days: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(1),
  times: z.array(z.enum(["morning", "afternoon", "evening", "night"])).min(1),
});

// ─── Step 6: AI Signals (all optional) ───────────────────────────────────────

export const aiSignalsSchema = z.object({
  selfDescription: z.string().max(600).trim().optional(),
  idealPartner: z.string().max(600).trim().optional(),
  idealDate: z.string().max(600).trim().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ProfileInput = z.infer<typeof profileSchema>;
export type GenderIdentityInput = z.infer<typeof genderIdentitySchema>;
export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
export type DatingModeInput = z.infer<typeof datingModeSchema>;
export type GenderPreferenceInput = z.infer<typeof genderPreferenceSchema>;
export type RelationshipGoalsInput = z.infer<typeof relationshipGoalsSchema>;
export type HeightInput = z.infer<typeof heightSchema>;
export type AgeRangeInput = z.infer<typeof ageRangeSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type InterestsInput = z.infer<typeof interestsSchema>;
export type PersonalityInput = z.infer<typeof personalitySchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type AiSignalsInput = z.infer<typeof aiSignalsSchema>;
export type FamilyPlansInput = z.infer<typeof familyPlansSchema>;
export type ImportantLifeInput = z.infer<typeof importantLifeSchema>;
