// src/components/Menu.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Menu() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Se não tiver contexto por algum motivo, não renderiza o menu
  if (!auth) {
    return null;
  }

  const { user, profile, logout } = auth;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  return (
    <nav className="app-menu">
      <div className="app-menu-left">
        <NavLink
          to="/"
          className={({ isActive }) =>
            "app-menu-link" + (isActive ? " active" : "")
          }
          end
        >
          Início
        </NavLink>

        <NavLink
          to="/pdca/novo"
          className={({ isActive }) =>
            "app-menu-link" + (isActive ? " active" : "")
          }
        >
          Novo PDCA
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            "app-menu-link" + (isActive ? " active" : "")
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/historico"
          className={({ isActive }) =>
            "app-menu-link" + (isActive ? " active" : "")
          }
        >
          Histórico
        </NavLink>
      </div>

      <div className="app-menu-right">
        {user && (
          <>
            <span className="app-menu-user">
              {profile?.nome ?? user.email}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
            >
              Sair
            </button>
          </>
        )}

        {!user && (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              "app-menu-link" + (isActive ? " active" : "")
            }
          >
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}
