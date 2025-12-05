// src/react-main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import ReactApp from "./ReactApp.jsx";

// CSS principal da aplicação
// aqui usamos style.css, que é o nome que você já usava antes
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
