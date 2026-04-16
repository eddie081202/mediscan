import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Login from "../pages/Login";
import { AuthContext } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

test("Login input changes correctly", () => {
    render(
        <AuthContext.Provider value={{ login: vi.fn() }}>
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        </AuthContext.Provider>
    );

    const emailInput = screen.getByPlaceholderText("name@company.com");

    fireEvent.change(emailInput, {
        target: { value: "test@email.com" },
    });

    expect(emailInput.value).toBe("test@email.com");
});