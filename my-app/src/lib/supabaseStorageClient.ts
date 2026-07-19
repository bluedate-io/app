// ─── Supabase Storage (service role key) — server-side only, bypasses RLS ────

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";

export function getSupabaseStorage() {
  const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
  return createClient(config.supabase.url, key).storage;
}
