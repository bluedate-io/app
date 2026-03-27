import { type NextRequest } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { successResponse } from "@/utils/response";
import type { RequestContext } from "@/types";
import { container } from "@/lib/container";
import { parsePhoneBody } from "@/validations/userApi.validation";

async function handler(req: NextRequest, ctx: RequestContext) {
  const { phone } = parsePhoneBody(await req.json());
  const data = await container.userSelfService.updatePhone(ctx.userId, phone);
  return successResponse(data);
}

export const POST = withAuth(handler);
