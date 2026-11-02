import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

import { AuthGate, AuthLoading } from "./auth/AuthGate.jsx";
import "./dashboard.css";

const Dashboard = lazy(() =>
  import("./App.jsx").then(({ App }) => ({ default: App }))
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      {({ user, signOut }) => (
        <Suspense fallback={<AuthLoading />}>
          <Dashboard
            key={user.id}
            storageKey={`dsa-space-v1:${user.id}`}
            onSignOut={signOut}
          />
        </Suspense>
      )}
    </AuthGate>
  </React.StrictMode>
);
