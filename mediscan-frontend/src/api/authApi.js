import { apiFetch, clearAccessToken, setAccessToken } from "./client";

const normalizeUser = (response) => ({
  user_id: response.user_id,
  username: response.username,
});

export const signIn = async (email, password) => {
  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: email.trim(),
        password,
      }),
    });
    setAccessToken(data.access_token);
    return { data: { user: normalizeUser(data) }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signUp = async (email, password, name) => {
  try {
    const username = (name || "").trim() || email.split("@")[0];
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: email.trim(),
        username,
        password,
      }),
    });
    setAccessToken(data.access_token);
    return { data: { user: normalizeUser(data) }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  clearAccessToken();
};

export const getCurrentUser = async () => {
  try {
    return await apiFetch("/api/auth/me");
  } catch {
    clearAccessToken();
    return null;
  }
};