import { vi } from "vitest";

vi.mock("../components/layout/MainLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import History from "../pages/History";

test("Loads history from localStorage", () => {
    localStorage.setItem(
        "scanHistory",
        JSON.stringify([{ date: "2024", medicine: "Test", doctor: "Dr" }])
    );

    render(<History />);

    expect(screen.getByText("Test")).toBeTruthy();
});