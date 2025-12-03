// src/ReactApp.jsx

import { Routes, Route, Link } from "react-router-dom";
import { PdcaDashboardPage } from "./pages/PdcaDashboardPage.jsx";
import { PdcaDetailPage } from "./pages/PdcaDetailPage.jsx";

export default function ReactApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <h1 className="font-bold text-sm md:text-base">
          PDCA NL – Dashboard React
        </h1>
        <nav className="text-xs md:text-sm flex gap-3">
          <Link to="/">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto py-4">
        <Routes>
          <Route path="/" element={<PdcaDashboardPage />} />
          <Route path="/pdca/:id" element={<PdcaDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
