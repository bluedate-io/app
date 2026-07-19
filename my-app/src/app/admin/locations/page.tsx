import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import AdminShell from "../AdminShell";
import LocationsClient from "./LocationsClient";
import { ADMIN_ELEVATED_PANEL } from "@/lib/adminChrome";
import { adminTheme } from "@/lib/adminTheme";

export default async function LocationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret) as { role?: string };
    if (payload.role !== "admin") redirect("/admin/login");
  } catch {
    redirect("/admin/login");
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className={`${ADMIN_ELEVATED_PANEL} mb-8`}>
          <div className="border-b-2 border-dashed pb-5 mb-5" style={{ borderColor: adminTheme.borderSoft }}>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-bd-display), Georgia, serif", color: adminTheme.ink }}
            >
              Locations
            </h1>
            <p className="mt-1 text-sm" style={{ color: adminTheme.mutedLabel }}>
              Manage city and sub-area options for non-student users.
            </p>
          </div>
          <LocationsClient />
        </div>
      </div>
    </AdminShell>
  );
}
