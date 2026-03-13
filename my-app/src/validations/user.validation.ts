import { z } from "zod";
import { AGE_MAX, AGE_MIN } from "@/constants";

const genderEnum = z.enum(["male", "female", "non_binary", "prefer_not_to_say"]);

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const age = Math.floor(
        (Date.now() - new Date(val).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      return age >= AGE_MIN && age <= AGE_MAX;
    }, `You must be between ${AGE_MIN} and ${AGE_MAX} years old`),
  gender: genderEnum.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  avatarUrl: z.string().url().optional(),
  gender: genderEnum.optional(),
  dateOfBirth: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
  preferences: z
    .object({
      minAge: z.number().min(AGE_MIN).max(AGE_MAX).optional(),
      maxAge: z.number().min(AGE_MIN).max(AGE_MAX).optional(),
      genderPreference: z.array(genderEnum).optional(),
      maxDistanceKm: z.number().min(1).max(20000).optional(),
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
