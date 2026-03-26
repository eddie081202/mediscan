export const processScan = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        confidence: 94,
        date: "October 24, 2023",
        doctor: "Dr. Sarah Mitchell",
        medicine: "Amoxicillin 500mg",
        dosage:
          "Take one capsule by mouth three times daily for 10 days. Finish all medication unless otherwise directed.",
        preview: URL.createObjectURL(file),
      });
    }, 2000);
  });
};