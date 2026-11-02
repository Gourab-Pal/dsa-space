import { App } from "../../App.jsx";
import { AuthLoading } from "../../auth/AuthGate.jsx";
import { useQuestionWorkspace } from "./useQuestionWorkspace.js";

export function QuestionWorkspace({ user, onSignOut }) {
  const workspace = useQuestionWorkspace(user.id);

  if (workspace.loading) return <AuthLoading />;

  if (workspace.loadError || !workspace.data) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">DSA <span>Space</span></div>
          <h1>Workspace unavailable</h1>
          <p className="login-error" role="alert">{workspace.loadError}</p>
          <div className="cloud-actions">
            <button className="primary-button" onClick={workspace.reloadWorkspace}>Retry</button>
            <button className="secondary-button" onClick={() => onSignOut().catch(() => {})}>Sign out</button>
          </div>
        </section>
      </main>
    );
  }

  async function signOutSafely() {
    try {
      await workspace.flush();
    } catch {
      throw new Error("Your changes could not be saved. Retry saving before signing out.");
    }
    await onSignOut();
  }

  return <App workspace={workspace} onSignOut={signOutSafely} />;
}
