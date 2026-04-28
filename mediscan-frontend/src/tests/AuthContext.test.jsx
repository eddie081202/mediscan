import React from "react";
import { render, screen } from "@testing-library/react";
import AuthProvider, { AuthContext } from "../context/AuthContext"; 
import { useContext } from "react";

const TestComponent = () => {
    const { user } = useContext(AuthContext);
    return <div>{user ? "Logged In" : "No User"}</div>;
};

test("AuthContext provides default user as null", () => {
    render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
    );

    expect(screen.getByText("No User")).toBeTruthy(); 
});