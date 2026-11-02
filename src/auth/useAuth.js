import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(supabase));
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    let receivedEvent = false;

    // Keep this callback synchronous. Supabase manages refresh and storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        receivedEvent = true;
        setSession(nextSession);
        setSessionError("");
        setInitializing(false);
      }
    );

    // Fallback for an initialization failure before an auth event arrives.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedEvent) return;
      setSession(error ? null : data.session);
      setSessionError(error ? "Could not restore your session. Please sign in again." : "");
      setInitializing(false);
    }).catch(() => {
      if (!active || receivedEvent) return;
      setSessionError("Could not restore your session. Please sign in again.");
      setInitializing(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!supabase) throw new Error("Sign-in is unavailable.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
  }

  return { session, initializing, sessionError, signIn, signOut };
}