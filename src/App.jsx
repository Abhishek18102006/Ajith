import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import Conflicts from "./components/Conflicts";

function App() {
  const [user, setUser] = useState(null);
  const [trains, setTrains] = useState([]);
  const [page, setPage] = useState("dashboard");

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Layout setPage={setPage}>
      {page === "dashboard" && (
        <Dashboard trains={trains} setTrains={setTrains} />
      )}
      {page === "conflicts" && <Conflicts trains={trains} />}
    </Layout>
  );
}

export default App;
