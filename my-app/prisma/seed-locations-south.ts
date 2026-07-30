/**
 * Seed South India locations — cities + student-dense sub-areas.
 * Run: npx tsx prisma/seed-locations-south.ts
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
    city: "Hyderabad",
    subAreas: [
      "Gachibowli",        // IIIT-H, BITS Hyd, UoH
      "Madhapur",
      "Kondapur",
      "Hitech City",
      "Kukatpally",        // JNTU corridor
      "Miyapur",
      "Kompally",
      "Bachupally",
      "Jubilee Hills",
      "Banjara Hills",
      "Secunderabad",
      "Begumpet",
      "Dilsukhnagar",
      "LB Nagar",
      "Uppal",
      "Ameerpet",
    ],
  },
  {
    city: "Bengaluru",
    subAreas: [
      "Koramangala",       // Christ, student-dense
      "Indiranagar",
      "HSR Layout",
      "BTM Layout",
      "Jayanagar",
      "JP Nagar",
      "Banashankari",
      "Rajajinagar",
      "Malleswaram",
      "Hebbal",
      "Yelahanka",         // REVA, Jain University
      "Whitefield",
      "Marathahalli",
      "Electronic City",
      "Sarjapur Road",
      "Basavanagudi",
    ],
  },
  {
    city: "Chennai",
    subAreas: [
      "Adyar",             // IIT Madras adjacent
      "Guindy",            // Anna University
      "Velachery",
      "Tambaram",          // engineering college belt
      "Chromepet",
      "Porur",
      "Ambattur",
      "Anna Nagar",
      "T Nagar",
      "Sholinganallur",    // OMR tech corridor
      "Perungudi",
      "Thoraipakkam",
      "Vadapalani",
      "Nungambakkam",
      "Pallavaram",
    ],
  },
  {
    city: "Visakhapatnam",
    subAreas: [
      "MVP Colony",        // GITAM, Andhra University
      "Dwaraka Nagar",
      "Seethammadhara",
      "Madhurawada",       // colleges + IT belt
      "Rushikonda",
      "Kommadi",
      "Gajuwaka",
      "Ukkunagaram",
      "Tatichetlapalem",
      "Bheemunipatnam",
    ],
  },
  {
    city: "Vijayawada",
    subAreas: [
      "Benz Circle",       // KL University city hub
      "MG Road",
      "Governorpet",
      "Labbipet",
      "Patamata",
      "Suryaraopet",
      "Auto Nagar",
      "Kanuru",
    ],
  },
  {
    city: "Amaravati",
    subAreas: [
      "Amaravati Capital",  // VIT-AP, SRM-AP zone
      "Mangalagiri",
      "Tadepalli",
      "Undavalli",
      "Thullur",
      "Guntur City",
    ],
  },
  {
    city: "Coimbatore",
    subAreas: [
      "Peelamedu",          // PSG, Amrita, CIT
      "Saibaba Colony",
      "RS Puram",
      "Gandhipuram",
      "Singanallur",
      "Avinashi Road",
      "Ramanathapuram",
      "Hopes College",
      "Ondipudur",
    ],
  },
  {
    city: "Kochi",
    subAreas: [
      "Kakkanad",           // CUSAT, Infopark
      "Ernakulam",
      "Edappally",
      "Kaloor",
      "Aluva",
      "Vyttila",
      "Thrippunithura",
      "Kalamassery",
      "Tripunithura",
    ],
  },
  {
    city: "Thiruvananthapuram",
    subAreas: [
      "Kazhakuttam",        // Technopark, TKM, College of Engg
      "Pattom",
      "Kowdiar",
      "Vellayambalam",
      "Kesavadasapuram",
      "Sasthamangalam",
      "Nalanchira",
      "Attingal",
    ],
  },
  {
    city: "Mysuru",
    subAreas: [
      "Kuvempunagar",       // University of Mysore
      "Vijayanagar",
      "Saraswathipuram",
      "Gokulam",
      "Hebbal",
      "Jayalakshmipuram",
      "Ramakrishnanagar",
    ],
  },
  {
    city: "Manipal",
    subAreas: [
      "Manipal Township",   // Manipal University — entire town is student
      "Udupi",
      "Kunjibettu",
      "Shivalli",
      "Madhav Nagar",
      "Bejai",
      "Kadri",              // Mangalore students spill here
    ],
  },
  {
    city: "Tiruchirappalli",
    subAreas: [
      "Thillai Nagar",      // NIT Trichy adjacent
      "Srirangam",
      "KK Nagar",
      "Anna Nagar",
      "Ariyamangalam",
      "Palakarai",
      "Woraiyur",
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

  for (const { city, subAreas } of LOCATIONS) {
    console.log(`  ${city}: ${subAreas.length} sub-areas`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
