import { apiFetch } from "./client";

export async function saveHistoryRecord(record) {
  return apiFetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}

export async function listHistoryRecords(limit = 50) {
  return apiFetch(`/api/history?limit=${limit}`);
}
