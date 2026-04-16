const BASE_URL =
  "https://ydsvglljbuszfihgrxzx.supabase.co/functions/v1/search-medication";

export const searchMedication = async (query) => {
  if (!query) return [];

  try {
    const res = await fetch(
      `${BASE_URL}?query=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      throw new Error("API failed");
    }

    const data = await res.json();

    // 🔥 IMPORTANT: Always return array
    if (!Array.isArray(data)) return [];

    return data.map((med, index) => ({
      id: index,

      name:
        med.medication_name +
        (med.strength ? ` (${med.strength})` : ""),

      usage:
        med.directions?.split("\n")[0] ||
        "No usage info available",

      timing: med.route
        ? `Route: ${med.route}`
        : "Consult doctor",

      warnings:
        med.warnings?.split("\n")[0] ||
        "No warnings available",
    }));

  } catch (err) {
    console.error("API ERROR:", err);
    return [];
  }
};