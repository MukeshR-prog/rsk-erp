import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Creates a server-side Supabase client initialized with the current user's access token
 * from request cookies. Respects Supabase Row Level Security (RLS).
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
