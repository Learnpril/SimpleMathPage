import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseClient = () => {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase not configured");
  }
  return createBrowserClient(url, key);
};
