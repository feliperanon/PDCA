import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import ReactApp from "./ReactApp.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ReactApp />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
