import { type NextRequest } from "next/server";
import { withAuth } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const POST = withAuth((req: NextRequest, ctx) => container.userApiController.postPhone(req, ctx));
