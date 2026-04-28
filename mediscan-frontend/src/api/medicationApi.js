import { apiFetch } from "./client";

export const searchMedication = async (query) => {
  if (!query) return [];

  try {
    const summary = await apiFetch(
      `/api/medications/search?q=${encodeURIComponent(query)}&limit=8`
    );
    const items = Array.isArray(summary.items) ? summary.items : [];
    const details = await Promise.all(
      items.slice(0, 6).map(async (item, index) => {
        const info = await apiFetch(`/api/medications/${item.setid}`);
        return {
          id: index,
          name: info.title || item.title || "Unknown medication",
          usage: info.indications_and_usage || "No usage info available",
          timing: info.dosage_and_administration || "Consult your clinician",
          warnings: info.warnings || "No warnings available",
        };
      })
    );
    return details;
  } catch (error) {
    console.error("API ERROR:", error);
    return [];
  }
};