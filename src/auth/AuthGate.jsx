import { Login } from "../Login.jsx";
import { supabaseConfigError } from "../lib/supabase.js";
import { useAuth } from "./useAuth.js";

export function AuthLoading() {
  return (
    <main className="login-page">
      <section className="login-card" aria-busy="true">
        <div className="login-brand">DSA <span>Space</span></div>
        <p role="status">Opening your workspace…</p>
      </section>
    </main>
  );
}

export function AuthGate({ children }) {
  const { session, initializing, sessionError, signIn, signOut } = useAuth();

  if (initializing) return <AuthLoading />;

  if (!session) {
    return (
      <Login
        onSignIn={signIn}
        configurationError={supabaseConfigError}
        initialError={sessionError}
      />
    );
  }

  return children({ user: session.user, signOut });
}