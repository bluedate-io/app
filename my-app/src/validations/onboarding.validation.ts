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

// ─── BFF-only: top 5 interests ────────────────────────────────────────────────

export const bffInterestsSchema = z.object({
  interests: z.array(z.string().min(1).max(60)).max(5),
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

const relationshipStatusValues = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "It's complicated",
  "Divorced",
  "Widowed",
] as const;

const lifeExperienceValues = [
  // Travel
  "New to town",
  "Living abroad",
  "Moved country",
  "Travelling",
  // Education
  "At uni",
  "University",
  "Just graduated",
  "Working and studying",
  "Postgrad degree",
  "Gap year",
  "Studying abroad",
  // Working it
  "Career focused",
  "New job",
  "First job",
  "In-between jobs",
  "Changing career",
  "Armed forces",
  "Stay at home parent",
  "Working parent",
  // House and home
  "Roommate life",
  "Putting down roots",
  "Buying a house",
  "First time home owner",
  "Living with family",
  "Living with partner",
  // LGBTQIA+
  "Exploring my identity",
  "Community leader",
  "Transitioning",
  "Out and proud",
  "Questioning",
  // Family life
  "Pregnant",
  "New parent",
  "Got toddlers",
  "Have teenagers",
  "Empty nester",
  "Planning for a family",
  "Fertility journey",
  "Adoption journey",
  // Self-love
  "Fresh start",
  "Exploring my culture",
  "Enjoying each day as it comes",
  "Sober life",
  "Working on myself",
  "Body positivity",
  "Going to therapy",
  "Exploring spirituality",
] as const;

export const importantLifeSchema = z.object({
  // Allow users to pick any number of items; the client can enforce soft limits.
  religion: z.array(z.enum(religionValues)).optional().default([]),
  politics: z.array(z.enum(politicsValues)).optional().default([]),
});

// ─── Step: Relationship status (BFF flow only, after BFF interests) ─────────────

export const relationshipStatusSchema = z.object({
  relationshipStatus: z.enum(relationshipStatusValues).optional(),
});

// ─── Step: Life experiences (BFF flow only) ─────────────────────────────────────

export const lifeExperiencesSchema = z.object({
  experiences: z.array(z.enum(lifeExperienceValues)).max(3),
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

// ─── Opening move (Date mode only) ──────────────────────────────────────────────
// Stores the final opening move question that will be used as the first message
// for new matches. The UI can offer presets or a custom question; the API only
// needs the resolved text and, optionally, a stable key for the preset.

export const openingMoveSchema = z.object({
  // Optional stable key for analytics / future changes (e.g. "houseplants").
  promptKey: z.string().min(1).max(100).trim().optional(),
  // The actual question shown to matches. Keep it short and friendly.
  promptText: z
    .string()
    .min(10, "Opening move must be at least 10 characters.")
    .max(160, "Opening move must be 160 characters or less.")
    .trim(),
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
export type LifeExperiencesInput = z.infer<typeof lifeExperiencesSchema>;
export type BffInterestsInput = z.infer<typeof bffInterestsSchema>;
export type RelationshipStatusInput = z.infer<typeof relationshipStatusSchema>;
export type OpeningMoveInput = z.infer<typeof openingMoveSchema>;
