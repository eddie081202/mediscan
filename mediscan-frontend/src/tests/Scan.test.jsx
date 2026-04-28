import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Scan from "../pages/Scan";
import { BrowserRouter } from "react-router-dom";

vi.mock("../components/layout/MainLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../api/scanApi", () => ({
    processScan: vi.fn(() =>
        Promise.resolve({
            confidence: 90,
            doctor: "Dr Test",
            medicine: "TestMed",
            date: "2024",
            dosage: "Test dosage",
            preview: "",
        })
    ),
}));

test("Displays scan result after upload", async () => {
    render(
        <BrowserRouter>
            <Scan />
        </BrowserRouter>
    );

    const input = document.querySelector('input[type="file"]');

    const file = new File(["dummy"], "test.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    const result = await screen.findByText(/Dr Test/i);

    expect(result).toBeInTheDocument();
});