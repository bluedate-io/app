import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { db } from "@/lib/db";
import { HomeView } from "./HomeView";

const IST_MS = 5.5 * 60 * 60 * 1000;

function getWeekStart(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_MS);
  const day = ist.getUTCDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const mondayIST = new Date(ist);
  mondayIST.setUTCDate(ist.getUTCDate() + daysToMonday);
  mondayIST.setUTCHours(0, 0, 0, 0);
  return new Date(mondayIST.getTime() - IST_MS);
}

function getFridayMidnight(now = new Date()): Date {
  return new Date(getWeekStart(now).getTime() + 4 * 24 * 60 * 60 * 1000);
}

export default async function HomePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    const secret = new TextEncoder().encode(config.auth.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.sub as string;
    if (!userId) throw new Error("No sub");
  } catch {
    redirect("/login");
  }

  const now = new Date();
  const weekStart = getWeekStart(now);
  const deadline = getFridayMidnight(now);

  const record = await db.weeklyOptIn.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
    select: { mode: true, description: true },
  });

  const initial = {
    optedIn: !!record,
    mode: (record?.mode ?? null) as "date" | "bff" | null,
    description: record?.description ?? null,
    weekStart: weekStart.toISOString(),
    deadline: deadline.toISOString(),
    windowOpen: now < deadline,
  };

  return <HomeView initial={initial} />;
}
