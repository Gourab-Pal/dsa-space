import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export let supabase = null;
export let supabaseConfigError = "";

if (!url || !publishableKey) {
  supabaseConfigError = "Sign-in is not configured yet. Please contact the site owner.";
} else {
  try {
    supabase = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    supabaseConfigError = "Sign-in is unavailable. Please contact the site owner.";
  }
}