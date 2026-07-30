import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
export const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "Gap";

// Only used for the parts of the SDK that don't need per-request progress
// (uploads go through the raw REST API in storage.ts instead, for progress
// events — see the note there).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
