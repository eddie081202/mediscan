export const processScan = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Scan failed");
  }

  const data = await response.json();
  const med = data.medication || {};

  return {
    confidence: 95, // mock confidence
    date: new Date().toLocaleDateString(),
    doctor: "Extracted Doctor", // mocked since not part of backend schema
    medicine: med.medication_name || "Unknown Medication",
    dosage: `${med.usage_info || ""} ${med.additional_notes || ""}`.trim(),
    preview: URL.createObjectURL(file), // Generate preview locally
  };
};