import * as dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

// ─── College domain seed data ─────────────────────────────────────────────────

const collegeDomains = [
  { collegeName: "VIT AP", domain: "vitap.ac.in" },
  { collegeName: "SRM AP", domain: "srmap.edu.in" },
  { collegeName: "KL University", domain: "kluniversity.in" },
];

const seedPhotoUrls = [
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn6wl5es0001dt31j9kih4zc/1774495679832.jpeg",
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn6wl5es0001dt31j9kih4zc/1774495679832.jpg",
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn7axsl60002n2m0wu50nzvb/1774519318730.webp",
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn7axsl60002n2m0wu50nzvb/1774519325896.webp",
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn7dttok000212m03xygiz8m/1774524276838.jpg",
  "https://yzxohkgucjiurlkzbofd.supabase.co/storage/v1/object/public/photos/cmn7dttok000212m03xygiz8m/1774524284389.jpg",
];

function pickRandomPhotoSet(count: number) {
  const shuffled = [...seedPhotoUrls].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

function startOfWeekUtcMonday(d: Date) {
  // Monday 00:00 UTC for the week containing `d`
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const day = utc.getUTCDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day + 6) % 7; // Mon -> 0, Sun -> 6
  utc.setUTCDate(utc.getUTCDate() - diffToMonday);
  return utc;
}

type SeedGender = "man" | "woman";

function seedUserData(args: { idx: number; gender: SeedGender }) {
  const { idx, gender } = args;
  const n = String(idx).padStart(2, "0");
  const email = `${gender}${n}@seed.bluedate.local`;
  const fullName = gender === "man" ? `Seed Man ${n}` : `Seed Woman ${n}`;

  const city = idx % 2 === 0 ? "Hyderabad" : "Vijayawada";
  const collegeName = idx % 3 === 0 ? "VIT AP" : idx % 3 === 1 ? "SRM AP" : "KL University";

  const age = 20 + (idx % 4); // 20..23
  const now = new Date();
  const dob = new Date(Date.UTC(now.getUTCFullYear() - age, (idx % 12), 1 + (idx % 20), 0, 0, 0, 0));

  const heightCm = gender === "man" ? 170 + (idx % 12) : 155 + (idx % 12);

  const genderPreference = gender === "man" ? ["woman"] : ["man"];

  const hobbiesPool = ["Gym", "Books", "Movies", "Travel", "Cricket", "Badminton", "Photography", "Cooking"];
  const pick2 = <T,>(arr: T[]) => [arr[idx % arr.length], arr[(idx + 3) % arr.length]];

  const weekStart = startOfWeekUtcMonday(now);
  const randomPhotos = pickRandomPhotoSet(3);

  return {
    email,
    collegeName,
    user: {
      onboardingCompleted: true,
      optInStatus: "opted_in" as const,
      optedInAt: now,
    },
    profile: {
      fullName,
      nickname: gender === "man" ? `man${n}` : `woman${n}`,
      dateOfBirth: dob,
      age,
      city,
      bio: `Seeded user (${gender}) who completed onboarding.`,
    },
    preferences: {
      genderIdentity: gender === "man" ? "Man" : "Woman",
      genderPreference,
      ageRangeMin: 18,
      ageRangeMax: 28,
      relationshipIntent: "date",
      relationshipGoals: ["long_term", "serious"],
      heightCm,
      heightCompleted: true,
      wantDate: true,
      datingModeCompleted: true,
      photosStepCompleted: true,
    },
    interests: {
      hobbies: pick2(hobbiesPool),
      favouriteActivities: pick2(["Cafe hopping", "Hikes", "Beach walks", "Game nights", "Concerts", "Movies"]),
      musicTaste: pick2(["Pop", "Hip hop", "Indie", "Classical", "EDM", "Bollywood"]),
      foodTaste: pick2(["Italian", "Indian", "Chinese", "Mexican", "Thai", "Mediterranean"]),
      bffInterests: pick2(["Board games", "Coding", "Gym buddy", "Study partner", "Coffee runs", "Football"]),
      bffInterestsCompleted: true,
    },
    personality: {
      socialLevel: idx % 2 === 0 ? "extrovert" : "introvert",
      conversationStyle: idx % 2 === 0 ? "playful" : "thoughtful",
      funFact: idx % 2 === 0 ? "I can solve a Rubik’s cube." : "I make great chai.",
      kidsStatus: "no_kids",
      kidsPreference: "someday",
      religion: ["spiritual"],
      politics: ["moderate"],
      importantLifeCompleted: true,
      familyPlansCompleted: true,
      lifeExperiences: ["moved_cities", "learned_skill"],
      lifeExperiencesCompleted: true,
      relationshipStatus: "single",
      relationshipStatusCompleted: true,
    },
    availability: {
      days: ["monday", "wednesday", "friday", "saturday"],
      times: ["evening", "night"],
    },
    aiSignals: {
      selfDescription: "Friendly, ambitious, and curious.",
      idealPartner: "Kind, communicative, and fun to be around.",
      idealDate: "A cozy cafe followed by a walk.",
    },
    photos: [
      { url: randomPhotos[0], order: 0 },
      { url: randomPhotos[1], order: 1 },
      { url: randomPhotos[2], order: 2 },
    ],
    weeklyOptIn: {
      weekStart,
      mode: "date",
      description: "Looking to meet someone genuine this week.",
    },
  };
}

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding college domains...");
  for (const c of collegeDomains) {
    await db.collegeDomain.upsert({
      where: { collegeName: c.collegeName },
      update: { domain: c.domain },
      create: c,
    });
    console.log(`  ✓ ${c.collegeName} (@${c.domain})`);
  }

  console.log("\nSeeding onboarding-complete users (10 men, 10 women)...");
  const men = Array.from({ length: 10 }, (_, i) => seedUserData({ idx: i + 1, gender: "man" }));
  const women = Array.from({ length: 10 }, (_, i) => seedUserData({ idx: i + 1, gender: "woman" }));
  const users = [...men, ...women];

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        collegeName: u.collegeName,
        onboardingCompleted: u.user.onboardingCompleted,
        optInStatus: u.user.optInStatus,
        optedInAt: u.user.optedInAt,
        profile: { create: u.profile },
        preferences: { create: u.preferences },
        interests: { create: u.interests },
        personality: { create: u.personality },
        availability: { create: u.availability },
        aiSignals: { create: u.aiSignals },
        photos: { create: u.photos },
        weeklyOptIns: { create: u.weeklyOptIn },
      },
      update: {
        collegeName: u.collegeName,
        onboardingCompleted: u.user.onboardingCompleted,
        optInStatus: u.user.optInStatus,
        optedInAt: u.user.optedInAt,
        profile: { upsert: { create: u.profile, update: u.profile } },
        preferences: { upsert: { create: u.preferences, update: u.preferences } },
        interests: { upsert: { create: u.interests, update: u.interests } },
        personality: { upsert: { create: u.personality, update: u.personality } },
        availability: { upsert: { create: u.availability, update: u.availability } },
        aiSignals: { upsert: { create: u.aiSignals, update: u.aiSignals } },
        photos: {
          deleteMany: {},
          create: u.photos,
        },
        weeklyOptIns: {
          deleteMany: {},
          create: u.weeklyOptIn,
        },
      },
    });
  }

  console.log(`  ✓ Upserted ${users.length} users`);
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
