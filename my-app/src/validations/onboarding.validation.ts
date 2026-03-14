import { z } from "zod";

// ─── Step 1: Profile (Identity) ───────────────────────────────────────────────

export const profileSchema = z.object({
  fullName: z.string().min(1).max(80).trim(),
  nickname: z.string().max(40).trim().optional(),
  age: z.number().int().min(18).max(100),
  city: z.string().min(2).max(80).trim().optional(),
  bio: z.string().max(500).trim().optional(),
});

// ─── Step 2: Preferences (Basics) ────────────────────────────────────────────

export const preferencesSchema = z.object({
  genderIdentity: z.string().min(1).max(60).trim(),
  genderPreference: z.array(z.string().min(1).max(60)).min(1),
  ageRangeMin: z.number().int().min(18).max(99),
  ageRangeMax: z.number().int().min(18).max(100),
  relationshipIntent: z.string().min(1).max(100).trim(),
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
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type InterestsInput = z.infer<typeof interestsSchema>;
export type PersonalityInput = z.infer<typeof personalitySchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type AiSignalsInput = z.infer<typeof aiSignalsSchema>;
