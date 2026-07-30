import { type NextRequest, NextResponse } from "next/server";
import { requireAdminId } from "@/middleware/adminAuth.middleware";
import db from "@/lib/db";
import { getWeekStartIST } from "@/utils/istTime";

export async function GET(req: NextRequest) {
  try {
    requireAdminId(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentWeekStart = getWeekStartIST();

  const [users, weeklyOptIns] = await Promise.all([
    db.user.findMany({
      where: { role: { not: "admin" } },
      select: {
        id: true,
        userType: true,
        onboardingCompleted: true,
        planType: true,
        preferences: { select: { genderIdentity: true } },
      },
    }),
    db.weeklyOptIn.findMany({
      where: { weekStart: currentWeekStart },
      select: { userId: true },
    }),
  ]);

  const total = users.length;
  const optedInIds = new Set(weeklyOptIns.map((o) => o.userId));

  // Weekly opt-in counters
  let weeklyOptInAll = 0;
  let weeklyOptInStudents = 0;
  let weeklyOptInNonStudents = 0;

  let students = 0;
  let nonStudents = 0;
  let onboardingDone = 0;
  let onboardingPending = 0;
  let studentBoardingDone = 0;
  let studentBoardingPending = 0;
  let nonStudentBoardingDone = 0;
  let nonStudentBoardingPending = 0;
  let planTook = 0;
  let planNotTook = 0;
  let studentPlanTook = 0;
  let studentPlanNotTook = 0;
  let nonStudentPlanTook = 0;
  let nonStudentPlanNotTook = 0;

  const genderAll: Record<string, number> = {};
  const genderStudents: Record<string, number> = {};
  const genderNonStudents: Record<string, number> = {};
  const genderBoardingDone: Record<string, number> = {};
  const genderBoardingPending: Record<string, number> = {};
  const genderVip: Record<string, number> = {};
  const genderBasic: Record<string, number> = {};

  for (const u of users) {
    const isStudent = u.userType === "student";
    const done = u.onboardingCompleted;
    const hasVip = u.planType === "vip";
    const gender = u.preferences?.genderIdentity?.trim() || "Unknown";

    if (isStudent) students++; else nonStudents++;
    if (done) onboardingDone++; else onboardingPending++;

    if (optedInIds.has(u.id)) {
      weeklyOptInAll++;
      if (isStudent) weeklyOptInStudents++; else weeklyOptInNonStudents++;
    }
    if (hasVip) planTook++; else planNotTook++;

    if (isStudent) {
      if (done) studentBoardingDone++; else studentBoardingPending++;
      if (hasVip) studentPlanTook++; else studentPlanNotTook++;
      genderStudents[gender] = (genderStudents[gender] ?? 0) + 1;
    } else {
      if (done) nonStudentBoardingDone++; else nonStudentBoardingPending++;
      if (hasVip) nonStudentPlanTook++; else nonStudentPlanNotTook++;
      genderNonStudents[gender] = (genderNonStudents[gender] ?? 0) + 1;
    }

    genderAll[gender] = (genderAll[gender] ?? 0) + 1;
    if (done) genderBoardingDone[gender] = (genderBoardingDone[gender] ?? 0) + 1;
    else genderBoardingPending[gender] = (genderBoardingPending[gender] ?? 0) + 1;
    if (hasVip) genderVip[gender] = (genderVip[gender] ?? 0) + 1;
    else genderBasic[gender] = (genderBasic[gender] ?? 0) + 1;
  }

  return NextResponse.json({
    total,
    weeklyOptIn: [
      { label: "Opted-in", value: weeklyOptInAll },
      { label: "Not opted-in", value: total - weeklyOptInAll },
    ],
    weeklyOptInStudents: [
      { label: "Opted-in", value: weeklyOptInStudents },
      { label: "Not opted-in", value: students - weeklyOptInStudents },
    ],
    weeklyOptInNonStudents: [
      { label: "Opted-in", value: weeklyOptInNonStudents },
      { label: "Not opted-in", value: nonStudents - weeklyOptInNonStudents },
    ],
    userType: [
      { label: "Students", value: students },
      { label: "Non-students", value: nonStudents },
    ],
    onboarding: [
      { label: "Completed", value: onboardingDone },
      { label: "Incomplete", value: onboardingPending },
    ],
    studentOnboarding: [
      { label: "Completed", value: studentBoardingDone },
      { label: "Incomplete", value: studentBoardingPending },
    ],
    nonStudentOnboarding: [
      { label: "Completed", value: nonStudentBoardingDone },
      { label: "Incomplete", value: nonStudentBoardingPending },
    ],
    plan: [
      { label: "VIP (took plan)", value: planTook },
      { label: "Basic (no plan)", value: planNotTook },
    ],
    studentPlan: [
      { label: "VIP (took plan)", value: studentPlanTook },
      { label: "Basic (no plan)", value: studentPlanNotTook },
    ],
    nonStudentPlan: [
      { label: "VIP (took plan)", value: nonStudentPlanTook },
      { label: "Basic (no plan)", value: nonStudentPlanNotTook },
    ],
    genderAll: toSlices(genderAll),
    genderStudents: toSlices(genderStudents),
    genderNonStudents: toSlices(genderNonStudents),
    genderBoardingDone: toSlices(genderBoardingDone),
    genderBoardingPending: toSlices(genderBoardingPending),
    genderVip: toSlices(genderVip),
    genderBasic: toSlices(genderBasic),
  });
}

function toSlices(map: Record<string, number>) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}
