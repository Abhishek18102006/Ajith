import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ConflictResolution from "./pages/ConflictResolution";
import Layout from "./components/Layout";

function App() {
  const [user, setUser] = useState(null);

  // 🔒 LOGIN GUARD (UNCHANGED)
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // ✅ ROUTED APP AFTER LOGIN
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/conflicts" element={<ConflictResolution />} />
      </Routes>
    </Layout>
  );
}

export default App;
