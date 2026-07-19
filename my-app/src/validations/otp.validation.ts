import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().trim().email("Must be a valid email address"),
  collegeName: z.string().trim().optional(),
  userType: z.enum(["student", "non_student"]).default("student"),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email("Must be a valid email address"),
  code: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  userType: z.enum(["student", "non_student"]).optional().default("student"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
