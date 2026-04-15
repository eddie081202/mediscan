import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { searchMedication } from "../api/medicationApi";
import "../styles/Medications.css";

export default function Medications() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* HANDLE SEARCH */

  const handleSearch = async (value) => {
    setQuery(value);

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
    }

    setLoading(false);
  };

  /* UI */

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
            placeholder="Search medication (e.g., Amoxicillin)"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* RESULTS */}
        <div className="med-results">

          {/* LOADING */}
          {loading && <p className="med-loading">Searching medication...</p>}

          {/* EMPTY SEARCH STATE */}
          {!loading && query && results.length === 0 && (
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
                <strong>Safety Warnings</strong>
                <p>{med.warnings}</p>
              </div>

            </div>
          ))}

        </div>
      </div>
    </MainLayout>
  );
}