import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.jsx";
import { Login } from "./Login.jsx";
import "./dashboard.css";

function Root() {
  const [demoUser, setDemoUser] = useState(null);

  if (!demoUser) {
    return <Login onContinue={setDemoUser} />;
  }

  return <App onSignOut={() => setDemoUser(null)} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);