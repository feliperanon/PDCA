// src/components/Menu.jsx
import { NavLink } from "react-router-dom";

export function Menu() {
  return (
    <nav className="app-menu">
      <NavLink
        to="/"
        className={({ isActive }) =>
          "app-menu-link" + (isActive ? " app-menu-link-active" : "")
        }
      >
        Início
      </NavLink>

      <NavLink
        to="/pdca/novo"
        className={({ isActive }) =>
          "app-menu-link" + (isActive ? " app-menu-link-active" : "")
        }
      >
        Novo PDCA
      </NavLink>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          "app-menu-link" + (isActive ? " app-menu-link-active" : "")
        }
      >
        Dashboard
      </NavLink>
    </nav>
  );
}
