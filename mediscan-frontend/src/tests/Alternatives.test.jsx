import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Alternatives from "../pages/Alternatives";

vi.mock("../components/layout/MainLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../api/alternativesApi", () => ({
    getAlternatives: vi.fn(() =>
        Promise.resolve([
            {
                id: 1,
                name: "Cheap Med",
                price: 10,
                originalPrice: 20,
                recommended: true,
                saltMatch: true,
            },
        ])
    ),
}));

test("Search displays alternative medicines", async () => {
    render(<Alternatives />);

    const input = screen.getByPlaceholderText(/Search medication/i);

    fireEvent.change(input, { target: { value: "Med" } });

    const result = await screen.findByText("Cheap Med");

    expect(result).toBeInTheDocument();
});