import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { config } from "@/config";
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
    <main
      className="min-h-screen flex flex-col p-6"
      style={{ backgroundColor: "#FBF8F6" }}
    >
      <AdminLoginForm />
    </main>
  );
}
