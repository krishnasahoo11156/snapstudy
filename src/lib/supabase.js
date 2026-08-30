import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseAnonKey);

export const supabase = SUPABASE_CONFIGURED
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!SUPABASE_CONFIGURED) {
  console.warn(
    "[SnapStudy] Supabase not configured — please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}
