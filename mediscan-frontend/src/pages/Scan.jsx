import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { processScan } from "../api/scanApi";
import { saveHistoryRecord } from "../api/historyApi";
import "../styles/Scan.css";

export default function Scan() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  /* HANDLE FILE UPLOAD*/

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setError("");
    setResult(null);

    if (!selectedFile.type?.startsWith("image/")) {
      setFile(null);
      setError("Please upload an image file (JPG, JPEG, or PNG).");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("File is too large. Please upload an image under 5MB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const res = await processScan(selectedFile);
      setResult(res);
    } catch (err) {
      console.error("Scan failed:", err);
      setError(err?.message || "Unable to process this image right now.");
    }

    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleBrowse = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
    // Allow picking the same file again after an error.
    e.target.value = "";
  };

  /* SAVE TO HISTORY*/

  const handleSaveToHistory = async () => {
    const history = JSON.parse(localStorage.getItem("scanHistory")) || [];
    history.push(result);
    localStorage.setItem("scanHistory", JSON.stringify(history));
    try {
      await saveHistoryRecord({
        medication_name: result.medicine || "Unknown medication",
        dosage: result.dosage || "",
        frequency: "",
        notes: result.doctor || "",
        source: "scan",
      });
    } catch (error) {
      console.error("Failed to save record to API:", error);
    }

    navigate("/history");
  };

  const handleFindAlternatives = () => {
    const medName = (result?.medicine || "").trim();
    if (!medName) {
      setError("Medication name is missing. Please edit details first.");
      return;
    }
    navigate(`/alternatives?q=${encodeURIComponent(medName)}`, {
      state: {
        prefillAlternatives: Array.isArray(result?.alternatives) ? result.alternatives : [],
      },
    });
  };

  /* UI*/

  return (
    <MainLayout>
      <div className="scan-wrapper">

        {/* HEADER */}
        <div className="scan-header">
          <div>
            <h1>Prescription Scanner</h1>
            <p>
              Upload or scan your prescription to extract medication details
              automatically using our AI engine.
            </p>
          </div>

          <span className="ai-status">AI System Online</span>
        </div>

        {/* GRID */}
        <div className="scan-grid">

          {/* LEFT SIDE */}
          <div className="scan-left">
            <div className="drop-zone-wrapper">

              {/* DROP ZONE */}
              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <h3>Drag & drop prescription here</h3>
                <span>Supported formats: JPG, PNG (Max 5MB)</span>

                {/* FILE BROWSE */}
                <label className="primary-btn">
                  Select File from Computer
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    hidden
                    onChange={handleBrowse}
                  />
                </label>

                <div className="or">OR</div>

                {/* CAMERA UPLOAD */}
                <label className="secondary-btn">
                  Camera Upload
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    capture="environment"
                    hidden
                    onChange={handleBrowse}
                  />
                </label>
              </div>

              {file && !loading && (
                <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "#6b7280" }}>
                  Selected file: {file.name}
                </p>
              )}

              {error && (
                <p style={{ marginTop: "10px", color: "#dc2626", fontWeight: 500 }}>
                  {error}
                </p>
              )}

              {result?.warning && (
                <p style={{ marginTop: "10px", color: "#b45309", fontWeight: 500 }}>
                  {result.warning}
                </p>
              )}

              {/* LOADING */}
              {loading && (
                <div className="progress-box">
                  <p>Processing Image...</p>

                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="scan-right">

            {/* OCR RESULT */}
            {result && !editing && (
              <div className="ocr-card">

                <div className="ocr-head">
                  <h3>OCR Results</h3>
                  <span>AI Confidence: {result.confidence}%</span>
                </div>

                <img src={result.preview} alt="preview" />

                <div className="ocr-info">
                  <p><strong>Prescription Date:</strong> {result.date}</p>
                  <p><strong>Doctor Name:</strong> {result.doctor}</p>
                  <p><strong>Medication Name:</strong> {result.medicine}</p>
                  <p><strong>Dosage & Frequency:</strong> {result.dosage}</p>
                </div>

                <button className="primary-btn" onClick={handleSaveToHistory}>
                  Save to History
                </button>

                <button
                  className="secondary-btn"
                  onClick={handleFindAlternatives}
                >
                  Find Alternatives
                </button>

                {Array.isArray(result.alternatives) && result.alternatives.length > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      background: "#f8fafc",
                    }}
                  >
                    <p style={{ marginBottom: "8px", fontWeight: 600 }}>
                      Suggested Alternatives
                    </p>
                    {result.alternatives.slice(0, 3).map((alt, idx) => (
                      <p key={`${alt.name || "alt"}-${idx}`} style={{ margin: "6px 0" }}>
                        <strong>{alt.name || "Unknown alternative"}</strong>
                        {alt.rationale ? ` - ${alt.rationale}` : ""}
                      </p>
                    ))}
                    {result.disclaimer && (
                      <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#6b7280" }}>
                        {result.disclaimer}
                      </p>
                    )}
                  </div>
                )}

                <button
                  className="secondary-btn"
                  onClick={() => {
                    setEditData(result);
                    setEditing(true);
                  }}
                >
                  Edit Details Manually
                </button>
              </div>
            )}

            {/* EDIT MODE */}
            {editing && (
              <div className="ocr-card">
                <h3>Edit Details</h3>

                <input
                  placeholder="Prescription Date"
                  value={editData.date || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, date: e.target.value })
                  }
                />

                <input
                  placeholder="Doctor Name"
                  value={editData.doctor || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, doctor: e.target.value })
                  }
                />

                <input
                  placeholder="Medication Name"
                  value={editData.medicine || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, medicine: e.target.value })
                  }
                />

                <textarea
                  placeholder="Dosage"
                  value={editData.dosage || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, dosage: e.target.value })
                  }
                />

                <button
                  className="primary-btn"
                  onClick={() => {
                    setResult(editData);
                    setEditing(false);
                  }}
                >
                  Save Changes
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </MainLayout>
  );
}