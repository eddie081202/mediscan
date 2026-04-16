export const processScan = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Scan failed with status: ${response.status}`);
  }

  const data = await response.json();

  return {
    confidence: 99,
    date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
    doctor: "Not Extracted",
    medicine: data.medication?.medication_name || "Unknown",
    dosage: data.medication?.usage_info || "",
    additional_notes: data.medication?.additional_notes || "",
    alternatives: data.alternatives || [],
    preview: URL.createObjectURL(file),
  };
};