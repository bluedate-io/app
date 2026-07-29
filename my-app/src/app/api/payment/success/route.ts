import { type NextRequest } from "next/server";
import { withHandler } from "@/middleware/withMiddleware";
import { container } from "@/lib/container";

export const GET = withHandler((req: NextRequest) =>
  container.paymentController.successRedirect(req)
);
