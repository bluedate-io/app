import { z } from "zod";

export const phoneBodySchema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const dateToggleBodySchema = z.object({
  wantDate: z.boolean(),
});

export const homeOptInBodySchema = z.object({
  description: z.string().max(500).optional(),
});

export function parsePhoneBody(body: unknown) {
  return phoneBodySchema.parse(body);
}

export function parseDateToggleBody(body: unknown) {
  return dateToggleBodySchema.parse(body);
}

export function parseHomeOptInBody(body: unknown) {
  return homeOptInBodySchema.parse(body);
}

