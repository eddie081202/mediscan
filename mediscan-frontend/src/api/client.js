const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8010").replace(/\/$/, "");
const TOKEN_KEY = "mediscan_access_token";
const REQUEST_TIMEOUT_MS = 45000;

function formatErrorPayload(payload, status) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const detail = payload.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    // FastAPI validation errors often return detail as an array of objects.
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === "string" && first.trim()) {
        return first;
      }
      if (first && typeof first === "object") {
        if (typeof first.msg === "string" && first.msg.trim()) {
          return first.msg;
        }
        if (Array.isArray(first.loc) && first.loc.length > 0) {
          return `${first.loc.join(".")}: ${first.msg || "Invalid input."}`;
        }
      }
      return "Request validation failed.";
    }
  }

  return `Request failed with status ${status}`;
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = formatErrorPayload(payload, response.status);
    throw new Error(message);
  }

  return payload;
}
