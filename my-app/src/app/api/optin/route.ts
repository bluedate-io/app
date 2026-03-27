import { NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  return container.userApiController.getOptInFromToken(req);
}
