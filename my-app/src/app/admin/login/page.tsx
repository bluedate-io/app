import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import FaqSection from "@/components/admin-bd/landing/FaqSection";
import HowItWorks from "@/components/admin-bd/landing/HowItWorks";
import LandingFooter from "@/components/admin-bd/landing/LandingFooter";
import LandingHero from "@/components/admin-bd/landing/LandingHero";
import LandingNav from "@/components/admin-bd/landing/LandingNav";
import TrustStrip from "@/components/admin-bd/landing/TrustStrip";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (token) {
    try {
      const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
      if (payload.role === "admin") redirect("/admin/users");
    } catch {
      // Invalid or expired token — show login
    }
  }

  return (
    <div className="min-h-screen bg-bd-page text-bd-ink">
      <LandingNav />
      <main>
        <LandingHero>
          <AdminLoginForm />
        </LandingHero>
        <TrustStrip />
        <HowItWorks />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
