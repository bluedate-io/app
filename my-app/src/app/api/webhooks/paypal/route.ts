import { type NextRequest } from "next/server";
import { container } from "@/lib/container";

// No withHandler wrapper — we need raw body via req.text() before any parsing
export async function POST(req: NextRequest) {
  return container.paymentController.paypalWebhook(req);
}
