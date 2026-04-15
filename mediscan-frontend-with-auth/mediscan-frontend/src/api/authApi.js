import { supabase } from "../supabaseClient.js";

// LOGIN
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// SIGNUP (optional)
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

// LOGOUT
export const signOut = async () => {
  await supabase.auth.signOut();
};

// GET USER
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};