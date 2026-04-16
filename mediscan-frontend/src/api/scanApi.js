import { apiFetch } from "./client";

export const processScan = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const payload = await apiFetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  const extracted = payload.extracted || {};
  const alternatives = Array.isArray(payload.alternatives) ? payload.alternatives : [];
  return {
    confidence: 94,
    date: new Date().toLocaleDateString(),
    doctor: extracted.additional_notes || "Not specified",
    medicine: extracted.medication_name || "Unknown medication",
    dosage:
      `${extracted.dosage || ""} ${extracted.frequency || ""}`.trim() ||
      "No dosage details returned",
    preview: URL.createObjectURL(file),
    rawExtracted: extracted,
    alternatives,
    disclaimer: payload.disclaimer || "",
    warning: payload.warning || "",
  };
};