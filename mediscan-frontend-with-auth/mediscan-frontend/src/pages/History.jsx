import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import "../styles/History.css";

export default function History() {
  const [records, setRecords] = useState([]);
  const [view, setView] = useState("table");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scanHistory")) || [];
    setRecords(saved.reverse());
  }, []);

  return (
    <MainLayout>
      <div className="history-wrapper">

        {/* HEADER */}
        <div className="history-header">
          <h1>Medical History</h1>

          <div className="history-controls">
            <button
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              Table
            </button>

            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
          </div>
        </div>

        {/* TABLE VIEW */}
        {view === "table" && (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medication</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.medicine}</td>
                    <td>{r.doctor}</td>
                    <td>
                      <span className="status processed">Saved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GRID VIEW */}
        {view === "grid" && (
          <div className="history-grid">
            {records.map((r, i) => (
              <div key={i} className="history-card">
                <img src={r.preview} alt="" />
                <h4>{r.medicine}</h4>
                <p>{r.doctor}</p>
                <span>{r.date}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </MainLayout>
  );
}