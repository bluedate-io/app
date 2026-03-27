import { NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  return container.userSelfService.confirmOptInFromToken(token, req.url);
}
