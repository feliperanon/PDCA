// src/ReactApp.jsx
import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { HomePage } from "./pages/HomePage.jsx";
import { CreatePdcaPage } from "./pages/CreatePdcaPage.jsx";
import { PdcaDashboardPage } from "./pages/PdcaDashboardPage.jsx";
import { PdcaDetailPage } from "./pages/PdcaDetailPage.jsx";
import { PdcaHistoricoPage } from "./pages/PdcaHistoricoPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";

import { Menu } from "./components/Menu.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default function ReactApp() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app-root">
      {!isLoginPage && <Menu />}

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />

          <Route
            path="/pdca/novo"
            element={
              <RequireAuth>
                <CreatePdcaPage />
              </RequireAuth>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <PdcaDashboardPage />
              </RequireAuth>
            }
          />

          <Route
            path="/pdca/:id"
            element={
              <RequireAuth>
                <PdcaDetailPage />
              </RequireAuth>
            }
          />

          <Route
            path="/historico"
            element={
              <RequireAuth>
                <PdcaHistoricoPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
