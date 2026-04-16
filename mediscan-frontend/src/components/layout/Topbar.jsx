import { Bell } from "lucide-react";
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Topbar() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="topbar">
      {/*}      <input className="search" placeholder="Search prescriptions, medications..." />*/}

      <div className="profile">
        <img
          src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name}`}
          alt="profile"
        />
        <div>
          <strong>{user?.user_metadata?.full_name || "User"}</strong>
        </div>
      </div>
    </div>
  );
}