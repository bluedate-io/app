/**
 * Seed North India locations — cities + student-dense sub-areas.
 * Run: npx tsx prisma/seed-locations.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

const LOCATIONS: { city: string; subAreas: string[] }[] = [
  {
    city: "Delhi",
    subAreas: [
      // North Campus belt
      "Kamla Nagar",
      "Vijay Nagar",
      "Hudson Lane",
      "GTB Nagar",
      "Mukherjee Nagar",
      // South Delhi
      "Hauz Khas",
      "Green Park",
      "Lajpat Nagar",
      "Saket",
      "Malviya Nagar",
      // West / Dwarka
      "Dwarka",
      "Janakpuri",
      "Rajouri Garden",
      // East / Central
      "Connaught Place",
      "Rohini",
      "Pitampura",
      "Preet Vihar",
    ],
  },
  {
    city: "Noida",
    subAreas: [
      "Sector 18",        // main commercial + hangout
      "Sector 44",
      "Sector 62",        // JIIT, HCL, student PGs
      "Sector 63",
      "Sector 125",       // Amity University
      "Sector 137",
      "Sector 150",
      "Sector 168",
      "Expressway",
    ],
  },
  {
    city: "Greater Noida",
    subAreas: [
      "Knowledge Park I",   // Galgotias, Bennett, Sharda corridor
      "Knowledge Park II",
      "Knowledge Park III",
      "Alpha I",
      "Alpha II",
      "Beta I",
      "Delta I",
      "Omicron I",
      "Pari Chowk",
    ],
  },
  {
    city: "Gurgaon",
    subAreas: [
      "Cyber City",
      "DLF Phase 1",
      "DLF Phase 2",
      "DLF Phase 3",
      "DLF Phase 4",
      "Sector 14",
      "Sector 29",
      "Sector 56",
      "Golf Course Road",
      "Sohna Road",
      "MG Road",
      "Palam Vihar",
      "Udyog Vihar",
    ],
  },
  {
    city: "Chandigarh",
    subAreas: [
      "Sector 14",        // Panjab University
      "Sector 15",
      "Sector 17",        // city centre
      "Sector 22",
      "Sector 35",
      "Sector 43",
      "Sector 44",
      "Manimajra",
      "Mohali Phase 3",
      "Mohali Phase 7",
      "Kharar",
    ],
  },
  {
    city: "Lucknow",
    subAreas: [
      "Hazratganj",
      "Gomti Nagar",
      "Aliganj",
      "Nirala Nagar",
      "Rajajipuram",
      "Vikas Nagar",
      "Indira Nagar",
      "Jankipuram",
      "Sahara Estate",
      "Mahanagar",
    ],
  },
  {
    city: "Jaipur",
    subAreas: [
      "Malviya Nagar",    // student-dense, Manipal/Jaipur Univ area
      "Vaishali Nagar",
      "C-Scheme",
      "Raja Park",
      "Mansarovar",
      "Jagatpura",        // JECRC, Poornima
      "Tonk Road",
      "Sanganer",
      "Sitapura",
      "Bani Park",
      "Nirman Nagar",
    ],
  },
  {
    city: "Dehradun",
    subAreas: [
      "Rajpur Road",       // Graphic Era, DIT, Doon
      "Clock Tower",
      "Premnagar",
      "Clement Town",
      "Vasant Vihar",
      "Sahastradhara Road",
      "Raipur",
      "Ballupur",
      "Rispana",
    ],
  },
  {
    city: "Kanpur",
    subAreas: [
      "Civil Lines",
      "Kidwai Nagar",
      "Kakadeo",
      "Swaroop Nagar",
      "Kalyanpur",         // HBTU, CSJM campus adjacent
      "Govind Nagar",
      "Armapur",
      "Naveen Nagar",
    ],
  },
  {
    city: "Varanasi",
    subAreas: [
      "Lanka",             // BHU main gate area
      "Assi",
      "Sunderpur",
      "Sigra",
      "Mahmoorganj",
      "Maldahiya",
      "Shivpur",
      "Bhelupur",
    ],
  },
  {
    city: "Prayagraj",
    subAreas: [
      "Civil Lines",
      "George Town",
      "Tagore Town",       // Allahabad University nearby
      "Kydganj",
      "Naini",
      "Jhunsi",
      "Alopi Bagh",
    ],
  },
  {
    city: "Agra",
    subAreas: [
      "Fatehabad Road",    // student PGs, tourism belt
      "Shahganj",
      "Sikandra",
      "Dayal Bagh",        // Dayalbagh Educational Institute
      "Kamla Nagar",
      "Rakabganj",
    ],
  },
];

async function main() {
  const rows = LOCATIONS.flatMap(({ city, subAreas }) =>
    subAreas.map((subArea) => ({ city, subArea }))
  );

  const result = await db.location.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`✓ Inserted ${result.count} locations across ${LOCATIONS.length} cities.`);

  // Print summary
  for (const { city, subAreas } of LOCATIONS) {
    console.log(`  ${city}: ${subAreas.length} sub-areas`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
