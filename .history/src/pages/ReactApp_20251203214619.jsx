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

  console.log("🧱 RequireAuth render:", {
    path: location.pathname,
    loading,
    hasUser: !!user,
  });

  if (loading) {
    console.log("⏳ RequireAuth: loading TRUE, mostrando carregando...");
    return <div className="app-loading">Carregando...</div>;
  }

  if (!user) {
    console.log("🔁 RequireAuth: sem usuário, redirecionando para /login");
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  console.log("✅ RequireAuth: usuário autenticado, liberando rota");
  return children;
}

export default function ReactApp() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app-root">
      {/* Não mostra o menu na tela de login */}
      {!isLoginPage && <Menu />}

      <main className="app-main">
        <Routes>
          {/* Tela de login (sem proteção) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas protegidas */}
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

          {/* Qualquer outra rota → redireciona pra Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
