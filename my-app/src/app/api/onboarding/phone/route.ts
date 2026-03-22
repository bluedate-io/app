// POST /api/onboarding/phone — save user's phone number
import { type NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/middleware/withMiddleware";
import { db } from "@/lib/db";
import { successResponse } from "@/utils/response";
import type { RequestContext } from "@/types";

const schema = z.object({
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

async function handler(req: NextRequest, ctx: RequestContext) {
  const body = await req.json();
  const { phone } = schema.parse(body);

  await db.user.update({
    where: { id: ctx.userId },
    data: { phone },
  });

  return successResponse({ phone });
}

export const POST = withAuth(handler);
