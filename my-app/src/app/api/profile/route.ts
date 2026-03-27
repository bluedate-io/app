import { type NextRequest } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const GET = withAuth((req: NextRequest, ctx) => container.userApiController.getProfile(req, ctx));
