import MainLayout from "../components/layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import "../styles/Dashboard.css";
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { data } = useDashboard();
  const navigate = useNavigate();

  if (!data) return <p>Loading...</p>;

  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <MainLayout>
      <div className="dashboard-wrapper">

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1>
              Hello, {user?.username?.split(" ")[0] || "User"}
            </h1>
            <p>{data.stats.greeting}</p>
          </div>
          <div className="date-pill">{today}</div>
        </div>

        {/* GRID */}
        <div className="dash-grid">

          {/* LEFT SIDE */}
          <div className="dash-left">

            {/* BANNER */}
            <div className="upload-banner">
              <div>
                <h2>Upload New Prescription</h2>
                <p>
                  Get instant AI-powered insights, drug interaction alerts,
                  and cost-effective alternatives by scanning your documents.
                </p>
                <button className="primary-btn" onClick={() => navigate("/scan")}> Start New Scan </button>
              </div>

              <div className="banner-icon">📄</div>
            </div>

            {/* TABLE */}
            <div className="table-card">
              <div className="table-head">
                <h3>Recent Prescriptions</h3>
                <span>View All</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {data.prescriptions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{today}</td>
                      <td>{item.doctor}</td>
                      <td>
                        <span className={`status ${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="dash-right">

            {/* SCHEDULE */}
            <div className="schedule-card">
              <div className="schedule-head">
                <h3>Daily Schedule</h3>
                <span>Today</span>
              </div>

              {data.schedule.map((item) => (
                <div key={item.id} className="schedule-item">
                  <div>
                    <strong>{item.time}</strong>
                    <p>{item.medicine}</p>
                  </div>
                  <button className="pill-btn">TAKEN</button>
                </div>
              ))}
            </div>

            {/* INSIGHTS */}
            <div className="insight-wrapper">
              <h3>Quick Insights</h3>

              {data.insights.map((item) => (
                <div key={item.id} className="insight-card">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
}