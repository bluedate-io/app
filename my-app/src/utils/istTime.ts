// ─── IST-aware time utilities ─────────────────────────────────────────────────
// IST = UTC + 5:30 (no daylight saving)

const IST_MS = (5 * 60 + 30) * 60 * 1000; // 19 800 000 ms

/** Returns Monday 00:00:00.000 IST expressed as a UTC Date for the week
 *  containing `now` (defaults to current time). */
export function getWeekStartIST(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_MS);
  const day = ist.getUTCDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const mondayIST = new Date(ist);
  mondayIST.setUTCDate(ist.getUTCDate() + daysToMonday);
  mondayIST.setUTCHours(0, 0, 0, 0);
  return new Date(mondayIST.getTime() - IST_MS); // back to UTC
}

/** Returns Friday 00:00:00.000 IST expressed as a UTC Date — the weekly opt-in
 *  cutoff.  Opted-in before this instant → 'opted_in'; on/after → 'opted_in_late'. */
export function getFridayCutoffIST(now = new Date()): Date {
  const weekStart = getWeekStartIST(now); // Monday 00:00 IST as UTC
  return new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000); // + 4 days
}

/** True when the current instant is at or after Friday 00:00 IST. */
export function isAfterFridayCutoff(now = new Date()): boolean {
  return now.getTime() >= getFridayCutoffIST(now).getTime();
}
