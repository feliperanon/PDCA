// src/components/Menu.jsx
import { NavLink } from "react-router-dom";

export function Menu() {
  return (
    <nav className="app-menu">
      <NavLink to="/" className="app-menu-link">
        Início
      </NavLink>
      <NavLink to="/pdca/novo" className="app-menu-link">
        Novo PDCA
      </NavLink>
      <NavLink to="/dashboard" className="app-menu-link">
        Dashboard
      </NavLink>
      <NavLink to="/historico" className="app-menu-link">
        Histórico
      </NavLink>
    </nav>
  );
}
