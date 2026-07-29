import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { config } from "@/config";
import { UpgradeView } from "./UpgradeView";

export default async function UpgradePage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/login");

  try {
    const secret = new TextEncoder().encode(config.auth.jwtSecret);
    await jwtVerify(token, secret);
  } catch {
    redirect("/login");
  }

  return <UpgradeView />;
}
