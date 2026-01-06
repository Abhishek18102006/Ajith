import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children, setPage }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar setPage={setPage} />
      <div style={{ flex: 1 }}>
        <Header />
        {children}
      </div>
    </div>
  );
}
