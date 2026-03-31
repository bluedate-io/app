import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import AdminShell from "../AdminShell";
import { adminTheme } from "@/lib/adminTheme";

export default async function AddAdminPage() {
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
      <div
        className="flex min-h-full flex-col items-center justify-center py-32"
        style={{ color: adminTheme.mutedLabel }}
      >
        <p className="mb-2 text-lg font-semibold" style={{ color: adminTheme.ink }}>
          Add Admin
        </p>
        <p className="text-sm">Coming soon.</p>
      </div>
    </AdminShell>
  );
}
