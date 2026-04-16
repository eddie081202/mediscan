import { supabase } from "../supabaseClient.js";

// LOGIN
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// SIGNUP 
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  console.log("SIGNUP RESPONSE:", data); // debug

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