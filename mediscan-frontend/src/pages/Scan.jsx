import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { processScan } from "../api/scanApi";
import "../styles/Scan.css";

export default function Scan() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setResult(null);

    try {
      const res = await processScan(selectedFile);
      setResult(res);
    } catch (err) {
      console.error("Scan failed:", err);
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
  };

  const handleSaveToHistory = () => {
    const history = JSON.parse(localStorage.getItem("scanHistory")) || [];
    history.push(result);
    localStorage.setItem("scanHistory", JSON.stringify(history));
    navigate("/history");
  };

  const badgeColors = [
    { bg: "#eef0ff", color: "#5b5ce2", border: "#c7caff" },
    { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
    { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  ];

  return (
    <MainLayout>
      <div className="scan-wrapper">

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

        <div className="scan-grid">

          <div className="scan-left">
            <div className="drop-zone-wrapper">

              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <h3>Drag &amp; drop prescription here</h3>
                <span>Supported formats: JPG, PNG, PDF (Max 5MB)</span>

                <label className="primary-btn">
                  Select File from Computer
                  <input type="file" hidden onChange={handleBrowse} />
                </label>

                <div className="or">OR</div>

                <label className="secondary-btn">
                  Camera Upload
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handleBrowse}
                  />
                </label>
              </div>

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

          <div className="scan-right">

            {result && !editing && (
              <div className="ocr-card">

                <div className="ocr-head">
                  <h3>OCR Results</h3>
                  <span className="confidence-badge">AI Confidence: {result.confidence}%</span>
                </div>

                <img src={result.preview} alt="prescription preview" />

                <div className="ocr-info">
                  <div className="ocr-field">
                    <span className="ocr-label">📅 Prescription Date</span>
                    <span className="ocr-value">{result.date}</span>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">👨‍⚕️ Doctor Name</span>
                    <span className="ocr-value">{result.doctor}</span>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">💊 Medication Name</span>
                    <span className="ocr-value medication-name">{result.medicine}</span>
                  </div>
                  <div className="ocr-field">
                    <span className="ocr-label">⏱️ Dosage &amp; Frequency</span>
                    <span className="ocr-value">{result.dosage}</span>
                  </div>
                </div>

                {result.additional_notes && (
                  <div className="ocr-notes">
                    <span className="ocr-notes-label">⚠️ Additional Notes</span>
                    <p>{result.additional_notes}</p>
                  </div>
                )}

                <div className="ocr-actions">
                  <button className="primary-btn" onClick={handleSaveToHistory}>
                    Save to History
                  </button>
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
              </div>
            )}

            {editing && (
              <div className="ocr-card">
                <h3>Edit Details</h3>

                <input
                  placeholder="Prescription Date"
                  value={editData.date || ""}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
                <input
                  placeholder="Doctor Name"
                  value={editData.doctor || ""}
                  onChange={(e) => setEditData({ ...editData, doctor: e.target.value })}
                />
                <input
                  placeholder="Medication Name"
                  value={editData.medicine || ""}
                  onChange={(e) => setEditData({ ...editData, medicine: e.target.value })}
                />
                <textarea
                  placeholder="Dosage &amp; Frequency"
                  value={editData.dosage || ""}
                  onChange={(e) => setEditData({ ...editData, dosage: e.target.value })}
                />
                <textarea
                  placeholder="Additional Notes"
                  value={editData.additional_notes || ""}
                  onChange={(e) => setEditData({ ...editData, additional_notes: e.target.value })}
                />

                <div className="ocr-actions">
                  <button
                    className="primary-btn"
                    onClick={() => { setResult(editData); setEditing(false); }}
                  >
                    Save Changes
                  </button>
                  <button className="secondary-btn" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {result && !editing && result.alternatives && result.alternatives.length > 0 && (
          <div className="alternatives-panel">

            <div className="alt-panel-header">
              <div>
                <h2>🔄 Alternative Medications</h2>
                <p>
                  AI-suggested alternatives to <strong>{result.medicine}</strong> based on similar
                  pharmacological action, active ingredient, or drug class.
                </p>
              </div>
              <span className="alt-count-badge">{result.alternatives.length} Suggested</span>
            </div>

            <div className="alt-cards-grid">
              {result.alternatives.map((alt, idx) => {
                const palette = badgeColors[idx % badgeColors.length];
                return (
                  <div className="alt-card" key={idx}>
                    <div className="alt-card-top">
                      <span className="alt-index">#{idx + 1}</span>
                      <span
                        className="alt-class-badge"
                        style={{ background: palette.bg, color: palette.color, borderColor: palette.border }}
                      >
                        {alt.drug_class || "Drug Class"}
                      </span>
                    </div>

                    <h4 className="alt-name">{alt.name}</h4>

                    <div className="alt-salt-row">
                      <span className="alt-salt-icon">⚗️</span>
                      <span className="alt-salt">{alt.active_ingredient}</span>
                    </div>

                    <p className="alt-reason">{alt.why_similar}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}