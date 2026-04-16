import React, { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import "../styles/History.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function History() {
  const [records, setRecords] = useState([]);
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_medication_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setRecords(data || []);

      setLoading(false);
    };

    fetchHistory();
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

            {loading ? (
              <div className="loader">Loading records...</div>
            ) : records.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medication</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((r) => (
                    <tr key={r.entry_id}>
                      <td>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>

                      <td>{r.medication_name}</td>

                      <td>
                        <button
                          className="info-btn"
                          onClick={() => setSelected(r)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        )}

        {/* GRID VIEW */}
        {view === "grid" && (
          <div className="history-grid">
            {records.map((r) => (
              <div key={r.entry_id} className="history-card">
                <h4>{r.medication_name}</h4>

                <span>
                  {new Date(r.created_at).toLocaleDateString()}
                </span>

                <button
                  className="info-btn"
                  onClick={() => setSelected(r)}
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div
              className="modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{selected.medication_name}</h2>

              <hr className="modal-divider" />

              <h3>Usage</h3>
              <p><b>Directions:</b> {selected.directions}</p>
              <p><b>Route:</b> {selected.route}</p>

              <p><b>Manufacturer:</b> {selected.manufacturer}</p>

              <h3>Warnings</h3>
              <p>{selected.warnings}</p>

              <button onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}