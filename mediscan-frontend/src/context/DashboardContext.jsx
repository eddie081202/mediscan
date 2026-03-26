import React, { createContext, useContext, useEffect, useState } from "react";
import { getDashboardData } from "../api/dashboardApi";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await getDashboardData();
    setData(res);
  };

  return (
    <DashboardContext.Provider value={{ data }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);