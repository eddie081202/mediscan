import { NavLink } from "react-router-dom";
import { LayoutDashboard, ScanLine, Clock, Pill, Repeat, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">+</div>
        <div>
          <h3>MediScan</h3>
          <span>Your Healthcare Guide</span>
        </div>
      </div>

      <nav>
        <NavLink to="/dashboard"><LayoutDashboard size={18}/> Dashboard</NavLink>
        <NavLink to="/scan"><ScanLine size={18}/> Scan</NavLink>
        <NavLink to="/history"><Clock size={18}/> History</NavLink>
        <NavLink to="/medications"><Pill size={18}/> Medication</NavLink>
        <NavLink to="/alternatives"><Repeat size={18}/> Alternatives</NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings"><Settings size={18}/> Settings</NavLink>
      </div>
    </div>
  );
}