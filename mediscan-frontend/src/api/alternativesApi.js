import { apiFetch } from "./client";

export const getAlternatives = async (query) => {
  if (!query || query.trim() === "") return [];
  try {
    const payload = await apiFetch("/api/medications/alternatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medication_name: query.trim(),
        reason: "",
        allergies: [],
        current_medications: [],
      }),
    });

    const alternatives = Array.isArray(payload.alternatives) ? payload.alternatives : [];
    return alternatives.map((item, index) => ({
      id: index + 1,
      name: item.name || "Unknown alternative",
      price: 10 + index,
      originalPrice: 14 + index,
      salts: item.rationale || "No rationale provided",
      saltMatch: index === 0,
      recommended: index === 0,
      caution: item.caution || "",
    }));
  } catch (error) {
    console.error("Alternatives API error:", error);
    return [];
  }
};