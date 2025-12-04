// src/react-main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import ReactApp from "./ReactApp.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <ReactApp />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);
