// ─── Cron reminder functions ──────────────────────────────────────────────────
//
// Monday  09:00 IST = 03:30 UTC  → remind all opted_out users (window just opened)
// Thursday 18:00 IST = 12:30 UTC → last-chance reminder before Friday cutoff

import { inngest } from "../client";
import { db } from "@/lib/db";
import { MatchEmailService } from "@/services/MatchEmailService";
import { logger } from "@/utils/logger";

const log = logger.child("ReminderEmails");
const emailSvc = new MatchEmailService();

// ─── Shared query ─────────────────────────────────────────────────────────────

async function getOptedOutUsers() {
  return db.user.findMany({
    where: {
      optInStatus: "opted_out",
      onboardingCompleted: true,
      email: { not: null },
    },
    select: { id: true, email: true, profile: { select: { fullName: true } } },
  });
}

// ─── Monday 09:00 IST (03:30 UTC) ────────────────────────────────────────────

export const mondayOptInReminder = inngest.createFunction(
  {
    id: "monday-opt-in-reminder",
    name: "Monday opt-in reminder",
    // Retry up to 2 times on transient failures
    retries: 2,
  },
  { cron: "30 3 * * 1" }, // Monday 03:30 UTC
  async () => {
    const users = await getOptedOutUsers();
    log.info(`Monday reminder: sending to ${users.length} users`);

    const results = await Promise.allSettled(
      users.map((u) =>
        emailSvc.sendMondayReminder({
          id: u.id,
          email: u.email!,
          name: u.profile?.fullName ?? "there",
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) log.warn(`Monday reminder: ${failed} email(s) failed`);

    return { sent: users.length - failed, failed };
  },
);

// ─── Thursday 18:00 IST (12:30 UTC) ──────────────────────────────────────────

export const thursdayOptInReminder = inngest.createFunction(
  {
    id: "thursday-opt-in-reminder",
    name: "Thursday opt-in reminder",
    retries: 2,
  },
  { cron: "30 12 * * 4" }, // Thursday 12:30 UTC
  async () => {
    const users = await getOptedOutUsers();
    log.info(`Thursday reminder: sending to ${users.length} users`);

    const results = await Promise.allSettled(
      users.map((u) =>
        emailSvc.sendThursdayReminder({
          id: u.id,
          email: u.email!,
          name: u.profile?.fullName ?? "there",
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) log.warn(`Thursday reminder: ${failed} email(s) failed`);

    return { sent: users.length - failed, failed };
  },
);
