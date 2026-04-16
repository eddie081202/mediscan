import React, { useState, useEffect } from "react";
import MainLayout from "../components/layout/MainLayout";
import { searchMedication } from "../api/medicationApi";
import "../styles/Medications.css";

export default function Medications() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openWarningId, setOpenWarningId] = useState(null);

  /* =========================
     HANDLE SEARCH (API CALL)
  ========================= */
  const handleSearch = async (value) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const res = await searchMedication(value);
      setResults(res);
    } catch (err) {
      console.error("Medication search failed:", err);
      setResults([]);
    }

    setLoading(false);
  };

  /* =========================
     DEBOUNCE (IMPORTANT)
  ========================= */
  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch(query);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  /* =========================
     UI
  ========================= */
  return (
    <MainLayout>
      <div className="med-wrapper">

        {/* HEADER */}
        <div className="med-header">
          <h1>Medication Guidance</h1>
          <p>
            Search medications to view usage instructions, timing guidance,
            and safety warnings.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="med-search">
          <input
            type="text"
            placeholder="Search medication (e.g., Tylenol)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* RESULTS */}
        <div className="med-results">

          {/* LOADING */}
          {loading && (
            <p className="med-loading">Searching medication...</p>
          )}

          {/* EMPTY SEARCH STATE */}
          {!loading && query.trim() && results.length === 0 && (
            <div className="med-empty">
              <h3>No results found</h3>
              <p>Try searching another medication.</p>
            </div>
          )}

          {/* DEFAULT EMPTY STATE */}
          {!query && (
            <div className="med-empty">
              <h3>Search a medication</h3>
              <p>
                Enter a medicine name above to view dosage instructions,
                timing guidance, and safety tips.
              </p>
            </div>
          )}

          {/* RESULTS CARDS */}
          {results.map((med) => (
            <div key={med.id} className="med-card">

              <h2>{med.name}</h2>

              <div className="med-section">
                <strong>Usage Instructions</strong>
                <p>{med.usage}</p>
              </div>

              <div className="med-section">
                <strong>Timing Guidance</strong>
                <p>{med.timing}</p>
              </div>

              <div className="med-section warning">
                <div
                  className="warning-header"
                  onClick={() =>
                    setOpenWarningId(openWarningId === med.id ? null : med.id)
                  }
                >
                  <strong>Safety Warnings</strong>
                  <span>{openWarningId === med.id ? "▲" : "▼"}</span>
                </div>

                {openWarningId === med.id && (
                  <p className="warning-content">{med.warnings}</p>
                )}
              </div>

            </div>
          ))}

        </div>
      </div>
    </MainLayout>
  );
}