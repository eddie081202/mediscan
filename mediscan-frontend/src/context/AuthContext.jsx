import React, { createContext, useState, useEffect } from "react";
import { getCurrentUser, signOut } from "../api/authApi";

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData || null);
    };
    getUser();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;