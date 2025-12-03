// src/react-main.jsx
// Ponto de entrada do dashboard React (usado em dashboard.html)

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ReactApp from "./ReactApp.jsx";
import "./style.css"; // reaproveita seu CSS atual

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ReactApp />
    </BrowserRouter>
  </React.StrictMode>
);
