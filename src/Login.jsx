import { useState } from "react";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import "./login.css";

export function Login({ onContinue }) {
  const [showPassword, setShowPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const email = form.elements.namedItem("email").value.trim();

    // Preview only. Never persist the password in app storage.
    onContinue({ email });
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
                onChange={(event) => setSavePassword(event.target.checked)}
                aria-describedby="login-save-help"
              />
              Save password in this browser
            </label>

            <p id="login-save-help">
              Password saving is managed by your browser.
            </p>
          </div>

          <button className="login-submit" type="submit">
            Sign in
            <ArrowRight size={19} weight="bold" />
          </button>
        </form>

        <p className="login-preview">
          Preview mode. Use any valid email and a password to continue.
        </p>
      </section>
    </main>
  );
}