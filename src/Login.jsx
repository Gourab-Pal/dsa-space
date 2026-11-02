import { useState } from "react";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import "./login.css";

export function Login({ onSignIn, configurationError = "", initialError = "" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || configurationError) return;

    const form = event.currentTarget;
    const email = form.elements.namedItem("email").value.trim();
    const password = form.elements.namedItem("password").value;

    setError("");
    setSubmitting(true);

    try {
      await onSignIn(email, password);
    } catch (failure) {
      if (failure.code === "invalid_credentials") {
        setError("The email or password is incorrect.");
      } else if (failure.code === "email_not_confirmed") {
        setError("Please confirm your email address before signing in.");
      } else if (failure.status === 429) {
        setError("Too many attempts. Please wait a little and try again.");
      } else {
        setError("Could not sign in. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          DSA <span>Space</span>
        </div>

        <header className="login-heading">
          <h1 id="login-title">Welcome back.</h1>
          <p>A little practice, every day.</p>
        </header>

        <form
          className="login-form"
          method="post"
          action="/"
          autoComplete={savePassword ? "on" : "off"}
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              readOnly={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>

            <div className="login-password">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={savePassword ? "current-password" : "off"}
                spellCheck={false}
                required
                readOnly={submitting}
              />

              <button
                className="login-reveal"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeSlash size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="login-save">
            <label htmlFor="login-save-password">
              <input
                id="login-save-password"
                name="savePassword"
                type="checkbox"
                checked={savePassword}
                disabled={submitting}
                onChange={(event) => setSavePassword(event.target.checked)}
                aria-describedby="login-save-help"
              />
              Save password in this browser
            </label>

            <p id="login-save-help">
              Password saving is managed by your browser.
            </p>
          </div>

          {(configurationError || error) && (
            <p className="login-error" role="alert">
              {configurationError || error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={submitting || Boolean(configurationError)}
          >
            {submitting ? "Signing in…" : "Sign in"}
            {!submitting && <ArrowRight size={19} weight="bold" />}
          </button>
        </form>

        <p className="login-preview">
          Sign in with the account created for you by the administrator.
        </p>
      </section>
    </main>
  );
}
