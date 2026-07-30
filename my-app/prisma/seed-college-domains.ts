/**
 * Seed verified Indian university email domains.
 * Only institutions that actively issue email accounts to students are included.
 * Run: npx tsx prisma/seed-college-domains.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

const COLLEGES: { collegeName: string; domain: string }[] = [
  // ── Already in DB (will be skipped via skipDuplicates) ────────────────────
  { collegeName: "VIT-AP University",            domain: "vitap.ac.in" },
  { collegeName: "SRM University AP",            domain: "srmap.edu.in" },
  { collegeName: "KL University",                domain: "kluniversity.in" },

  // ── IITs ─────────────────────────────────────────────────────────────────
  { collegeName: "IIT Bombay",                   domain: "iitb.ac.in" },
  { collegeName: "IIT Delhi",                    domain: "iitd.ac.in" },
  { collegeName: "IIT Madras",                   domain: "iitm.ac.in" },
  { collegeName: "IIT Kanpur",                   domain: "iitk.ac.in" },
  { collegeName: "IIT Kharagpur",                domain: "iitkgp.ac.in" },
  { collegeName: "IIT Roorkee",                  domain: "iitr.ac.in" },
  { collegeName: "IIT Hyderabad",                domain: "iith.ac.in" },
  { collegeName: "IIT Guwahati",                 domain: "iitg.ac.in" },
  { collegeName: "IIT BHU Varanasi",             domain: "iitbhu.ac.in" },
  { collegeName: "IIT Jodhpur",                  domain: "iitj.ac.in" },
  { collegeName: "IIT Gandhinagar",              domain: "iitgn.ac.in" },
  { collegeName: "IIT Indore",                   domain: "iiti.ac.in" },
  { collegeName: "IIT Patna",                    domain: "iitp.ac.in" },
  { collegeName: "IIT Bhubaneswar",              domain: "iitbbs.ac.in" },
  { collegeName: "IIT Mandi",                    domain: "iitmandi.ac.in" },
  { collegeName: "IIT Ropar",                    domain: "iitrpr.ac.in" },
  { collegeName: "IIT Tirupati",                 domain: "iittp.ac.in" },
  { collegeName: "IIT Palakkad",                 domain: "iitpkd.ac.in" },
  { collegeName: "IIT Dharwad",                  domain: "iitdh.ac.in" },
  { collegeName: "IIT Jammu",                    domain: "iitjammu.ac.in" },
  { collegeName: "IIT Bhilai",                   domain: "iitbhilai.ac.in" },
  { collegeName: "IIT Goa",                      domain: "iitgoa.ac.in" },

  // ── NITs ─────────────────────────────────────────────────────────────────
  { collegeName: "NIT Trichy",                   domain: "nitt.edu" },
  { collegeName: "NIT Warangal",                 domain: "nitw.ac.in" },
  { collegeName: "NIT Calicut",                  domain: "nitc.ac.in" },
  { collegeName: "NIT Karnataka (Surathkal)",    domain: "nitk.ac.in" },
  { collegeName: "NIT Rourkela",                 domain: "nitrkl.ac.in" },
  { collegeName: "NIT Kurukshetra",              domain: "nitkkr.ac.in" },
  { collegeName: "MNIT Jaipur",                  domain: "mnit.ac.in" },
  { collegeName: "MNNIT Allahabad",              domain: "mnnit.ac.in" },
  { collegeName: "MANIT Bhopal",                 domain: "manit.ac.in" },
  { collegeName: "VNIT Nagpur",                  domain: "vnit.ac.in" },
  { collegeName: "NIT Durgapur",                 domain: "nitdgp.ac.in" },
  { collegeName: "NIT Hamirpur",                 domain: "nith.ac.in" },
  { collegeName: "NIT Jalandhar",                domain: "nitj.ac.in" },
  { collegeName: "NIT Patna",                    domain: "nitp.ac.in" },
  { collegeName: "NIT Silchar",                  domain: "nits.ac.in" },
  { collegeName: "NIT Srinagar",                 domain: "nitsri.ac.in" },
  { collegeName: "NIT Goa",                      domain: "nitgoa.ac.in" },
  { collegeName: "NIT Puducherry",               domain: "nitpy.ac.in" },
  { collegeName: "NIT Andhra Pradesh",           domain: "nitandhra.ac.in" },
  { collegeName: "NIT Uttarakhand",              domain: "nituk.ac.in" },
  { collegeName: "NIT Manipur",                  domain: "nitmanipur.ac.in" },
  { collegeName: "NIT Meghalaya",                domain: "nitm.ac.in" },
  { collegeName: "NIT Agartala",                 domain: "nitagartala.ac.in" },

  // ── BITS Pilani campuses ──────────────────────────────────────────────────
  { collegeName: "BITS Pilani",                  domain: "pilani.bits-pilani.ac.in" },
  { collegeName: "BITS Pilani Goa",              domain: "goa.bits-pilani.ac.in" },
  { collegeName: "BITS Pilani Hyderabad",        domain: "hyderabad.bits-pilani.ac.in" },

  // ── IIITs ─────────────────────────────────────────────────────────────────
  { collegeName: "IIIT Hyderabad",               domain: "iiit.ac.in" },
  { collegeName: "IIIT Delhi",                   domain: "iiitd.ac.in" },
  { collegeName: "IIIT Bangalore",               domain: "iiitb.ac.in" },
  { collegeName: "IIIT Allahabad",               domain: "iiita.ac.in" },
  { collegeName: "ABV-IIITM Gwalior",            domain: "iiitm.ac.in" },
  { collegeName: "IIIT Kottayam",                domain: "iiitkottayam.ac.in" },
  { collegeName: "IIIT Lucknow",                 domain: "iiitl.ac.in" },
  { collegeName: "IIIT Vadodara",                domain: "iiitvadodara.ac.in" },
  { collegeName: "IIIT Nagpur",                  domain: "iiitn.ac.in" },
  { collegeName: "IIIT Ranchi",                  domain: "iiitranchi.ac.in" },
  { collegeName: "IIIT Sri City",                domain: "iiits.ac.in" },
  { collegeName: "IIIT Manipur",                 domain: "iiitmanipur.ac.in" },
  { collegeName: "IIIT Una",                     domain: "iiitu.ac.in" },

  // ── VIT campuses ──────────────────────────────────────────────────────────
  { collegeName: "VIT University Vellore",       domain: "vit.ac.in" },
  { collegeName: "VIT Chennai",                  domain: "vitstudent.ac.in" },
  { collegeName: "VIT Bhopal",                   domain: "vitbhopal.ac.in" },

  // ── SRM campuses ──────────────────────────────────────────────────────────
  { collegeName: "SRM Institute Kattankulathur", domain: "srmist.edu.in" },
  { collegeName: "SRM Ramapuram",                domain: "srmrmp.edu.in" },
  { collegeName: "SRM Vadapalani",               domain: "srmvadapalani.edu.in" },
  { collegeName: "SRM Amaravati",                domain: "srmap.edu.in" }, // skip dup

  // ── Manipal group ─────────────────────────────────────────────────────────
  { collegeName: "Manipal Institute of Technology", domain: "manipal.edu" },
  { collegeName: "Manipal University Jaipur",    domain: "jaipur.manipal.edu" },

  // ── Major Private & Deemed Universities ───────────────────────────────────
  { collegeName: "Thapar Institute of Engineering", domain: "thapar.edu" },
  { collegeName: "Chandigarh University",        domain: "cuchd.in" },
  { collegeName: "Lovely Professional University", domain: "lpu.in" },
  { collegeName: "Amity University",             domain: "s.amity.edu" },
  { collegeName: "UPES Dehradun",                domain: "ddn.upes.ac.in" },
  { collegeName: "Christ University",            domain: "christuniversity.in" },
  { collegeName: "Symbiosis International University", domain: "siu.edu.in" },
  { collegeName: "Delhi Technological University", domain: "dtu.ac.in" },
  { collegeName: "NSUT Delhi",                   domain: "nsut.ac.in" },
  { collegeName: "IGDTUW Delhi",                 domain: "igdtuw.ac.in" },
  { collegeName: "PSG College of Technology",    domain: "psgtech.ac.in" },
  { collegeName: "Amrita Vishwa Vidyapeetham",   domain: "amrita.edu" },
  { collegeName: "SASTRA University",            domain: "sastra.edu" },
  { collegeName: "Karunya Institute of Technology", domain: "karunya.edu" },
  { collegeName: "Sathyabama Institute",         domain: "sathyabama.ac.in" },
  { collegeName: "Hindustan Institute of Technology", domain: "hindustanuniv.ac.in" },
  { collegeName: "PESIT Bangalore",              domain: "pes.edu" },
  { collegeName: "RV College of Engineering",    domain: "rvce.edu.in" },
  { collegeName: "BMS College of Engineering",   domain: "bmsce.ac.in" },
  { collegeName: "MS Ramaiah Institute",         domain: "msrit.edu" },
  { collegeName: "Dayananda Sagar University",   domain: "dsu.edu.in" },
  { collegeName: "Jain University",              domain: "jainuniversity.ac.in" },
  { collegeName: "Gitam University",             domain: "gitam.edu" },
  { collegeName: "Shiv Nadar University",        domain: "snu.edu.in" },
  { collegeName: "Bennett University",           domain: "bennett.edu.in" },
  { collegeName: "Ashoka University",            domain: "ashoka.edu.in" },
  { collegeName: "OP Jindal Global University",  domain: "jgu.edu.in" },
  { collegeName: "Graphic Era University",       domain: "geu.ac.in" },
  { collegeName: "DIT University Dehradun",      domain: "dituniversity.edu.in" },
  { collegeName: "Chitkara University Punjab",   domain: "chitkara.edu.in" },

  // ── Central & State Universities ──────────────────────────────────────────
  { collegeName: "Jawaharlal Nehru University",  domain: "jnu.ac.in" },
  { collegeName: "Jamia Millia Islamia",         domain: "jmi.ac.in" },
  { collegeName: "Banaras Hindu University",     domain: "bhu.ac.in" },
  { collegeName: "University of Hyderabad",      domain: "uohyd.ac.in" },
  { collegeName: "Delhi University",             domain: "du.ac.in" },
  { collegeName: "Panjab University Chandigarh", domain: "pu.ac.in" },
  { collegeName: "Osmania University",           domain: "osmania.ac.in" },
  { collegeName: "JNTU Hyderabad",               domain: "jntuh.ac.in" },
  { collegeName: "Anna University",              domain: "annauniv.edu" },
  { collegeName: "Cochin University of Science & Technology", domain: "cusat.ac.in" },
  { collegeName: "University of Kerala",         domain: "keralauniversity.ac.in" },
  { collegeName: "Aligarh Muslim University",    domain: "amu.ac.in" },
  { collegeName: "Pondicherry University",       domain: "pondiuni.edu.in" },
  { collegeName: "University of Mysore",         domain: "uni-mysore.ac.in" },
  { collegeName: "Andhra University",            domain: "andhrauniversity.edu.in" },
  { collegeName: "Sri Venkateswara University",  domain: "svuniversity.ac.in" },
  { collegeName: "Vikram University",            domain: "vikramuniv.ac.in" },
  { collegeName: "University of Rajasthan",      domain: "uniraj.ac.in" },
  { collegeName: "Lucknow University",           domain: "lkouniv.ac.in" },
  { collegeName: "Allahabad University",         domain: "allduniv.ac.in" },
];

async function main() {
  // Deduplicate by domain before inserting
  const seen = new Set<string>();
  const rows = COLLEGES.filter(({ domain }) => {
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });

  const result = await db.collegeDomain.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`✓ Inserted ${result.count} college domains (${rows.length} attempted, ${rows.length - result.count} already existed).`);

  // Summary by type
  const types = [
    { label: "IITs",                    match: (n: string) => n.startsWith("IIT ") },
    { label: "NITs",                    match: (n: string) => n.startsWith("NIT ") || n.endsWith("NIT") || ["MNIT","MNNIT","MANIT","VNIT"].some(p => n.startsWith(p)) },
    { label: "BITS campuses",           match: (n: string) => n.startsWith("BITS ") },
    { label: "IIITs",                   match: (n: string) => n.startsWith("IIIT ") || n.startsWith("ABV-IIIT") },
    { label: "VIT campuses",            match: (n: string) => n.startsWith("VIT ") },
    { label: "SRM campuses",            match: (n: string) => n.startsWith("SRM ") },
  ];
  for (const { label, match } of types) {
    const count = rows.filter(r => match(r.collegeName)).length;
    if (count) console.log(`  ${label}: ${count}`);
  }
  console.log(`  Others: ${rows.filter(r => !types.some(t => t.match(r.collegeName))).length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
