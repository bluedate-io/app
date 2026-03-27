import { type NextRequest } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { successResponse, handleError } from "@/utils/response";
import { container } from "@/lib/container";
import type { RequestContext } from "@/types";
import { parseHomeOptInBody } from "@/validations/userApi.validation";

async function getOptIn(_req: NextRequest, ctx: RequestContext) {
  const data = await container.userSelfService.getHomeOptIn(ctx.userId);
  return successResponse(data);
}

async function postOptIn(req: NextRequest, ctx: RequestContext) {
  try {
    const body = await req.json().catch(() => ({}));
    const { description } = parseHomeOptInBody(body);
    const data = await container.userSelfService.postHomeOptIn(ctx.userId, description);
    return successResponse(data);
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withAuth(getOptIn);
export const POST = withAuth(postOptIn);
