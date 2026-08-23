import { type NextRequest } from "next/server";
import { container } from "@/lib/container";

export async function POST(req: NextRequest) {
  return container.paymentController.razorpayOrderWebhook(req);
}
