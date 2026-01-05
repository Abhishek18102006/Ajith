import { NavLink } from "react-router-dom";

export default function Sidebar({ delayedCount = 0 }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">RailFlow Optimizer</div>

      <div className="sidebar-nav">
        <NavLink to="/" className="sidebar-link">
          Dashboard
        </NavLink>

        <NavLink to="/conflicts" className="sidebar-link">
          Conflict Resolution
          {delayedCount > 0 && (
            <span className="sidebar-badge">{delayedCount}</span>
          )}
        </NavLink>

        <NavLink to="#" className="sidebar-link">Real-Time Scheduling</NavLink>
        <NavLink to="#" className="sidebar-link">What-If Scenario</NavLink>
        <NavLink to="#" className="sidebar-link">Performance</NavLink>
      </div>
    </div>
  );
}
