import { NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function POST(req: NextRequest) {
  return container.adminAuthController.verifyOtp(req);
}
