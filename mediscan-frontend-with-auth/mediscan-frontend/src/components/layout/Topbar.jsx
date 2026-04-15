import { Bell } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";

export default function Topbar() {
  const { data } = useDashboard();

  if (!data) return null;

  return (
    <div className="topbar">
{/*}      <input className="search" placeholder="Search prescriptions, medications..." />*/}

      <div className="topbar-right">
        <Bell size={20} />

        <div className="profile">
          <img src={data.user.avatar} alt="profile" />
          <div>
            <strong>{data.user.name}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}