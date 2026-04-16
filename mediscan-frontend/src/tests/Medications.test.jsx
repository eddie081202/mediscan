import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Medications from "../pages/Medications";

vi.mock("../components/layout/MainLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../api/medicationApi", () => ({
    searchMedication: vi.fn(() =>
        Promise.resolve([
            {
                id: 1,
                name: "Test Med",
                usage: "Use",
                timing: "After",
                warnings: "None",
            },
        ])
    ),
}));

test("Search displays results", async () => {
    render(<Medications />);

    const input = screen.getByPlaceholderText(/Search medication/i);

    fireEvent.change(input, { target: { value: "Test" } });

    const result = await screen.findByText("Test Med");

    expect(result).toBeInTheDocument();
});