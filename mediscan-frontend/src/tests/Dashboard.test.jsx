import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "../pages/Dashboard";
import { AuthContext } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

vi.mock("../components/layout/MainLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../context/DashboardContext", () => ({
    useDashboard: () => ({
        data: {
            stats: { greeting: "Hello!" },
            prescriptions: [],
            schedule: [],
            insights: [],
        },
    }),
}));

test("Dashboard renders greeting", () => {
    render(
        <AuthContext.Provider value={{ user: { user_metadata: { name: "John" } } }}>
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        </AuthContext.Provider>
    );

    screen.getByText(/Hello, John/i)
});