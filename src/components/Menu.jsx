import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function Menu() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const displayName = profile?.nome ?? user?.email ?? "Usuário";
  const initials = displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <nav className="app-menu">
      <div className="app-menu-spacer" />

      <div className="app-menu-links">
        <NavLink to="/" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")} end>
          Início
        </NavLink>

        <NavLink to="/pdca/novo" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Novo PDCA
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Dashboard
        </NavLink>

        <NavLink to="/historico" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Histórico
        </NavLink>
        <NavLink to="/cadastro" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Cadastros
        </NavLink>

        <NavLink to="/operacoes" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Diário Op.
        </NavLink>

        <NavLink to="/diario" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          Espelho Op.
        </NavLink>

        {/* NOVO LINK INTELIGÊNCIA */}
        <NavLink to="/inteligencia" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
          📊 Inteligência
        </NavLink>
      </div>

      <div className="app-menu-right">
        {user ? (
          <>
            <div className="app-menu-user-wrapper">
              <div className="app-menu-avatar">{initials}</div>
              <div className="app-menu-user-text">
                <span className="app-menu-user-name">{displayName}</span>
                <span className="app-menu-user-role">Logística • NL</span>
              </div>
            </div>
            <button type="button" className="btn-secondary app-menu-logout" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => "app-menu-link" + (isActive ? " active" : "")}>
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}