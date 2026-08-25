import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import AdminShell from "../AdminShell";
import OptInReminderClient from "./OptInReminderClient";

export default async function AdminOptInReminderPage() {
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
      <OptInReminderClient />
    </AdminShell>
  );
}
