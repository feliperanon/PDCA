// src/App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactApp from "./ReactApp.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ReactApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
