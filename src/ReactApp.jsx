// src/ReactApp.jsx
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { CreatePdcaPage } from "./pages/CreatePdcaPage.jsx";
import { PdcaDashboardPage } from "./pages/PdcaDashboardPage.jsx";
import { PdcaDetailPage } from "./pages/PdcaDetailPage.jsx";
import { PdcaHistoricoPage } from "./pages/PdcaHistoricoPage.jsx";
import { Menu } from "./components/Menu.jsx";

export default function ReactApp() {
  return (
    <div className="app-root">
      <Menu />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pdca/novo" element={<CreatePdcaPage />} />
          <Route path="/dashboard" element={<PdcaDashboardPage />} />
          <Route path="/pdca/:id" element={<PdcaDetailPage />} />
          <Route path="/historico" element={<PdcaHistoricoPage />} />
        </Routes>
      </main>
    </div>
  );
}
