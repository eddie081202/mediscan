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

  /* HANDLE FILE UPLOAD*/

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

  /* SAVE TO HISTORY*/

  const handleSaveToHistory = () => {
    const history = JSON.parse(localStorage.getItem("scanHistory")) || [];
    history.push(result);
    localStorage.setItem("scanHistory", JSON.stringify(history));

    navigate("/history");
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
                <span>Supported formats: JPG, PNG, PDF (Max 5MB)</span>

                {/* FILE BROWSE */}
                <label className="primary-btn">
                  Select File from Computer
                  <input type="file" hidden onChange={handleBrowse} />
                </label>

                <div className="or">OR</div>

                {/* CAMERA UPLOAD */}
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