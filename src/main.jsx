import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

import { AuthGate, AuthLoading } from "./auth/AuthGate.jsx";
import "./dashboard.css";

const Dashboard = lazy(() =>
  import("./features/questions/QuestionWorkspace.jsx")
    .then(({ QuestionWorkspace }) => ({ default: QuestionWorkspace }))
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      {({ user, signOut }) => (
        <Suspense fallback={<AuthLoading />}>
          <Dashboard
            key={user.id}
            user={user}
            onSignOut={signOut}
          />
        </Suspense>
      )}
    </AuthGate>
  </React.StrictMode>
);
