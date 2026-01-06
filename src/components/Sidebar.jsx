export default function Sidebar({ setPage }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">RailFlow Optimizer</div>

      <Nav label="Dashboard" onClick={() => setPage("dashboard")} />
      <Nav label="Conflict Resolution" onClick={() => setPage("conflicts")} />
    </div>
  );
}

function Nav({ label, onClick }) {
  return (
    <div className="sidebar-item" onClick={onClick}>
      {label}
    </div>
  );
}
