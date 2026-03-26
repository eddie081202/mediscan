export const searchMedication = async (query) => {
  if (!query) return [];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Amoxicillin 500mg",
          usage:
            "Take one capsule by mouth three times daily for 10 days.",
          timing: "After meals",
          warnings:
            "Avoid alcohol. Complete full course unless instructed otherwise.",
        },
        {
          id: 2,
          name: "Ibuprofen 200mg",
          usage:
            "Take every 6 hours as needed for pain or fever.",
          timing: "After food",
          warnings:
            "Avoid taking on an empty stomach. Do not exceed recommended dose.",
        },
      ]);
    }, 500);
  });
};