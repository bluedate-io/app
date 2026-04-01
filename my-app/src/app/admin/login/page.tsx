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
    <div className="min-h-screen bg-bd-page px-4 py-10 text-bd-ink sm:px-6">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <AdminLoginForm />
      </main>
    </div>
  );
}
