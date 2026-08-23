// ─── Inngest serve route ──────────────────────────────────────────────────────
// Inngest calls this endpoint to register functions and deliver events.
// In production set INNGEST_SIGNING_KEY in your environment.
// In local dev run: npx inngest-cli@latest dev

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  mondayOptInReminder,
  thursdayOptInReminder,
} from "@/inngest/functions/reminderEmails";
import { expireVipAccess } from "@/inngest/functions/vipExpiry";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [mondayOptInReminder, thursdayOptInReminder, expireVipAccess],
});
