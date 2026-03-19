import * as dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

// ─── Seed data ────────────────────────────────────────────────────────────────

const women = [
  {
    phone: "+919900000001",
    name: "Ananya Sharma",
    age: 21,
    city: "Bangalore",
    bio: "Bookworm who runs on filter coffee and late-night podcasts.",
    hobbies: ["Reading", "Journaling", "Photography"],
    activities: ["Cycling", "Trekking"],
    music: ["Indie", "Classical"],
    food: ["South Indian", "Italian"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I'm the person who reads the menu three times and still orders the same thing.",
    idealPartner: "Someone curious, kind, and can handle my book recommendations.",
  },
  {
    phone: "+919900000002",
    name: "Priya Nair",
    age: 22,
    city: "Kochi",
    bio: "Art student who talks too much about films nobody has heard of.",
    hobbies: ["Painting", "Film photography", "Cooking"],
    activities: ["Swimming", "Yoga"],
    music: ["Jazz", "Lo-fi"],
    food: ["Kerala cuisine", "Japanese"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "Chronic overthinker with a great playlist for every mood.",
    idealPartner: "Someone who appreciates slow mornings and honest conversations.",
  },
  {
    phone: "+919900000003",
    name: "Zara Khan",
    age: 23,
    city: "Mumbai",
    bio: "Fashion design student, part-time meme archivist.",
    hobbies: ["Sketching", "Thrifting", "Dancing"],
    activities: ["Gym", "Salsa classes"],
    music: ["Pop", "R&B"],
    food: ["Street food", "Lebanese"],
    socialLevel: "Extrovert",
    religion: ["Muslim"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Definitely want kids",
    selfDescription: "I can find a vintage piece in any flea market within 10 minutes.",
    idealPartner: "Someone confident, funny, and doesn't take themselves too seriously.",
  },
  {
    phone: "+919900000004",
    name: "Meera Iyer",
    age: 20,
    city: "Chennai",
    bio: "CS student who builds things by day and stargazes by night.",
    hobbies: ["Coding side projects", "Astronomy", "Board games"],
    activities: ["Running", "Badminton"],
    music: ["Electronic", "Carnatic"],
    food: ["Tamil Brahmin food", "Korean"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Not sure yet",
    selfDescription: "I have a spreadsheet for my to-read list. Yes, really.",
    idealPartner: "A fellow nerd who laughs at my nerdy jokes.",
  },
  {
    phone: "+919900000005",
    name: "Riya Bose",
    age: 22,
    city: "Kolkata",
    bio: "Literature student and amateur poet who believes rainy days are romantic.",
    hobbies: ["Writing poetry", "Visiting museums", "Baking"],
    activities: ["Morning walks", "Theatre"],
    music: ["Bengali folk", "Indie pop"],
    food: ["Bengali food", "French"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "I write better than I speak. Send me a voice note and I'll reply with a paragraph.",
    idealPartner: "Someone who leaves notes and remembers small things.",
  },
  {
    phone: "+919900000006",
    name: "Simran Kaur",
    age: 24,
    city: "Chandigarh",
    bio: "MBA student who negotiates everything including restaurant bills.",
    hobbies: ["Investing", "Travelling", "Cooking"],
    activities: ["Gym", "Cricket watching"],
    music: ["Punjabi pop", "Hip-hop"],
    food: ["Punjabi", "Mexican"],
    socialLevel: "Extrovert",
    religion: ["Sikh"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I have a 5-year plan and a vibe board for it.",
    idealPartner: "Ambitious, grounded, and knows how to have fun outside of Excel sheets.",
  },
  {
    phone: "+919900000007",
    name: "Aisha Malik",
    age: 21,
    city: "Hyderabad",
    bio: "Psychology student who psychoanalyses every Netflix character.",
    hobbies: ["Reading psychology books", "Journaling", "Pottery"],
    activities: ["Yoga", "Swimming"],
    music: ["Sufi", "Acoustic"],
    food: ["Hyderabadi biryani", "Mediterranean"],
    socialLevel: "Ambivert",
    religion: ["Muslim"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "I'll help you understand yourself better whether you like it or not.",
    idealPartner: "Emotionally aware, patient, and genuinely curious about people.",
  },
  {
    phone: "+919900000008",
    name: "Kavya Reddy",
    age: 23,
    city: "Hyderabad",
    bio: "Architecture student who daydreams about redesigning Indian cities.",
    hobbies: ["Sketching buildings", "Urban photography", "Reading"],
    activities: ["Cycling", "Hiking"],
    music: ["Alternative", "Ghazals"],
    food: ["Andhra food", "Italian"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Not sure yet",
    selfDescription: "I see geometry in everything. Buildings, people, conversations.",
    idealPartner: "Someone who can look at a city and see its story, not just its skyline.",
  },
  {
    phone: "+919900000009",
    name: "Tanvi Joshi",
    age: 20,
    city: "Pune",
    bio: "Biology student and plant parent of 23 (and counting).",
    hobbies: ["Gardening", "Birdwatching", "Watercolour painting"],
    activities: ["Nature hikes", "Cycling"],
    music: ["Folk", "Lo-fi"],
    food: ["Maharashtrian", "Thai"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I name all my plants. They have distinct personalities.",
    idealPartner: "Patient, gentle, and ideally not allergic to plants.",
  },
  {
    phone: "+919900000010",
    name: "Divya Menon",
    age: 22,
    city: "Trivandrum",
    bio: "Economics student who makes surprisingly good playlists.",
    hobbies: ["Music production", "Debating", "Cooking"],
    activities: ["Badminton", "Swimming"],
    music: ["Indie", "Carnatic fusion"],
    food: ["Kerala food", "Japanese"],
    socialLevel: "Extrovert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Definitely want kids",
    selfDescription: "I can talk about supply chains and Spotify algorithms in the same breath.",
    idealPartner: "Witty, intellectually curious, and doesn't skip the intro songs.",
  },
];

const men = [
  {
    phone: "+919900001001",
    name: "Arjun Mehta",
    age: 23,
    city: "Bangalore",
    bio: "Software engineer by day, amateur chef experimenting with disaster recipes by night.",
    hobbies: ["Cooking", "Gaming", "Reading"],
    activities: ["Cycling", "Gym"],
    music: ["Indie rock", "Electronic"],
    food: ["North Indian", "Japanese"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I make very good pasta and very bad puns.",
    idealPartner: "Someone who laughs at my puns and gives honest feedback on my cooking.",
  },
  {
    phone: "+919900001002",
    name: "Rohan Verma",
    age: 22,
    city: "Delhi",
    bio: "Journalism student who turns every conversation into a deep dive.",
    hobbies: ["Writing", "Street photography", "Debating"],
    activities: ["Running", "Basketball"],
    music: ["Hip-hop", "Jazz"],
    food: ["Delhi street food", "Mexican"],
    socialLevel: "Extrovert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "I have too many opinions and not enough word limits.",
    idealPartner: "Someone who can challenge my views and still order chai with me after.",
  },
  {
    phone: "+919900001003",
    name: "Kabir Ansari",
    age: 24,
    city: "Mumbai",
    bio: "Film student who watches three movies a day and calls it research.",
    hobbies: ["Filmmaking", "Writing scripts", "Music production"],
    activities: ["Swimming", "Yoga"],
    music: ["World music", "Sufi"],
    food: ["Bohri cuisine", "Italian"],
    socialLevel: "Introvert",
    religion: ["Muslim"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Not sure yet",
    selfDescription: "I'll convince you that a three-hour film is actually short.",
    idealPartner: "Someone who appreciates silences as much as conversations.",
  },
  {
    phone: "+919900001004",
    name: "Dev Pillai",
    age: 21,
    city: "Kochi",
    bio: "Marine biology student and amateur diver who speaks fluent fish.",
    hobbies: ["Diving", "Photography", "Cooking seafood"],
    activities: ["Swimming", "Kayaking"],
    music: ["Reggae", "Acoustic"],
    food: ["Kerala seafood", "Thai"],
    socialLevel: "Extrovert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I've seen more coral reefs than cities and I'm okay with that.",
    idealPartner: "Adventure-ready, curious, and at least okay with the smell of the sea.",
  },
  {
    phone: "+919900001005",
    name: "Aditya Singh",
    age: 22,
    city: "Lucknow",
    bio: "History enthusiast who can trace every Mughal emperor without Googling.",
    hobbies: ["Reading history", "Chess", "Poetry"],
    activities: ["Cricket", "Morning walks"],
    music: ["Classical Hindustani", "Ghazals"],
    food: ["Awadhi cuisine", "Lebanese"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "I think Akbar was underrated and I will die on this hill.",
    idealPartner: "Patient, a good listener, and vaguely interested in dead empires.",
  },
  {
    phone: "+919900001006",
    name: "Karthik Rajan",
    age: 23,
    city: "Chennai",
    bio: "Robotics student who has named all his lab prototypes after Tamil film characters.",
    hobbies: ["Building robots", "Board games", "Cooking"],
    activities: ["Badminton", "Cycling"],
    music: ["Carnatic", "EDM"],
    food: ["Tamil food", "Korean"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Not sure yet",
    selfDescription: "Currently teaching a robot to play jallikattu. Don't ask.",
    idealPartner: "Someone who finds engineering problems interesting at 2am.",
  },
  {
    phone: "+919900001007",
    name: "Mihir Desai",
    age: 24,
    city: "Ahmedabad",
    bio: "Architect student who collects vintage maps and strong opinions.",
    hobbies: ["Urban sketching", "Map collecting", "Travelling"],
    activities: ["Trekking", "Yoga"],
    music: ["Folk", "Alternative"],
    food: ["Gujarati", "Italian"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Open to it",
    selfDescription: "I've been to 12 Indian states for architecture alone. 17 more to go.",
    idealPartner: "Loves exploring, has strong opinions on good design, hates nothing.",
  },
  {
    phone: "+919900001008",
    name: "Samarth Kulkarni",
    age: 21,
    city: "Pune",
    bio: "Music student who composes soundtracks for films that don't exist yet.",
    hobbies: ["Composing music", "Watching anime", "Cooking"],
    activities: ["Running", "Swimming"],
    music: ["Classical", "Anime OSTs", "Indie"],
    food: ["Maharashtrian", "French"],
    socialLevel: "Introvert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Want kids someday",
    selfDescription: "I hear background scores in everyday situations. It's a gift and a curse.",
    idealPartner: "Gentle, creative, and willing to listen to my newest track at any time.",
  },
  {
    phone: "+919900001009",
    name: "Faizan Sheikh",
    age: 22,
    city: "Hyderabad",
    bio: "Law student who argues for fun and apologises professionally.",
    hobbies: ["Reading", "Debating", "Travelling"],
    activities: ["Football", "Gym"],
    music: ["Sufi", "R&B"],
    food: ["Hyderabadi food", "Mediterranean"],
    socialLevel: "Extrovert",
    religion: ["Muslim"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Definitely want kids",
    selfDescription: "I've never lost an argument but I've definitely lost some friends that way.",
    idealPartner: "Confident, sharp, and doesn't mind a good debate over dinner.",
  },
  {
    phone: "+919900001010",
    name: "Neel Chatterjee",
    age: 20,
    city: "Kolkata",
    bio: "Physics student and terrible cricket commentator who does it anyway.",
    hobbies: ["Stargazing", "Cricket", "Reading sci-fi"],
    activities: ["Cycling", "Swimming"],
    music: ["Rabindra Sangeet", "Indie"],
    food: ["Bengali food", "Japanese"],
    socialLevel: "Ambivert",
    religion: ["Hindu"],
    kidsStatus: "Don't have kids",
    kidsPreference: "Not sure yet",
    selfDescription: "I've read every Feynman book. I still can't explain quantum physics at a party.",
    idealPartner: "Curious, warm, and finds my bad cricket commentary endearing.",
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding 10 women and 10 men...");

  for (const w of women) {
    const dob = new Date(2025 - w.age, 5, 15);
    const user = await db.user.upsert({
      where: { phone: w.phone },
      update: {},
      create: {
        phone: w.phone,
        role: "user",
        onboardingCompleted: true,
      },
    });

    await db.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: w.name,
        dateOfBirth: dob,
        age: w.age,
        city: w.city,
        bio: w.bio,
      },
    });

    await db.preferences.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        genderIdentity: "Woman",
        genderPreference: ["Man"],
        ageRangeMin: 20,
        ageRangeMax: 27,
        relationshipIntent: "date",
        wantDate: true,
        datingModeCompleted: true,
        photosStepCompleted: true,
        promptsCompleted: true,
      },
    });

    await db.interests.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        hobbies: w.hobbies,
        favouriteActivities: w.activities,
        musicTaste: w.music,
        foodTaste: w.food,
      },
    });

    await db.personality.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        socialLevel: w.socialLevel,
        kidsStatus: w.kidsStatus,
        kidsPreference: w.kidsPreference,
        religion: w.religion,
      },
    });

    await db.aiSignals.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        selfDescription: w.selfDescription,
        idealPartner: w.idealPartner,
      },
    });

    console.log(`  ✓ ${w.name}`);
  }

  for (const m of men) {
    const dob = new Date(2025 - m.age, 3, 10);
    const user = await db.user.upsert({
      where: { phone: m.phone },
      update: {},
      create: {
        phone: m.phone,
        role: "user",
        onboardingCompleted: true,
      },
    });

    await db.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: m.name,
        dateOfBirth: dob,
        age: m.age,
        city: m.city,
        bio: m.bio,
      },
    });

    await db.preferences.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        genderIdentity: "Man",
        genderPreference: ["Woman"],
        ageRangeMin: 19,
        ageRangeMax: 26,
        relationshipIntent: "date",
        wantDate: true,
        datingModeCompleted: true,
        photosStepCompleted: true,
        promptsCompleted: true,
      },
    });

    await db.interests.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        hobbies: m.hobbies,
        favouriteActivities: m.activities,
        musicTaste: m.music,
        foodTaste: m.food,
      },
    });

    await db.personality.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        socialLevel: m.socialLevel,
        kidsStatus: m.kidsStatus,
        kidsPreference: m.kidsPreference,
        religion: m.religion,
      },
    });

    await db.aiSignals.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        selfDescription: m.selfDescription,
        idealPartner: m.idealPartner,
      },
    });

    console.log(`  ✓ ${m.name}`);
  }

  console.log("\nDone. 20 users seeded.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
