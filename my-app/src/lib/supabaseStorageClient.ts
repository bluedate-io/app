// ─── Supabase Storage (anon key) — shared by onboarding, admin match cards, etc. ─

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";

export function getSupabaseStorage() {
  return createClient(config.supabase.url, config.supabase.anonKey).storage;
}
