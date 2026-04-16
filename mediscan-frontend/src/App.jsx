import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import History from "./pages/History";
import Medications from "./pages/Medications";
import Alternatives from "./pages/Alternatives";

function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          {/* LOGIN FIRST */}
          <Route path="/" element={<Login />} />

          {/* APP ROUTES */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/history" element={<History />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/alternatives" element={<Alternatives />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;