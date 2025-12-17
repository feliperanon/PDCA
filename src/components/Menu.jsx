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
    <nav className="app-menu" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: '#0f172a', borderBottom: '1px solid #334155',
      height: '60px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
    }}>
      {/* LEFT: LOGO */}
      <div style={{ fontWeight: 800, fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#3b82f6' }}>PDCA</span>Insight
      </div>

      {/* CENTER: MENU LINKS (User Provided Design) */}
      <div className="app-menu-links" style={{ display: 'flex', gap: '5px', background: 'rgb(15, 23, 42)', padding: '5px', borderRadius: '30px', border: '1px solid rgb(51, 65, 85)' }}>
        {[
          { to: "/", label: "Início" },
          { to: "/pdca/novo", label: "Novo PDCA" },
          { to: "/dashboard", label: "Dashboard" },
          { to: "/banco-de-dados", label: "Banco de Dados" },
          { to: "/cadastro", label: "Cadastros" },
          { to: "/operacoes", label: "Diário Op." },
          { to: "/diario", label: "Espelho Op." },
          { to: "/inteligencia", label: "📊 Inteligência" }
        ].map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => "menu-link" + (isActive ? " active" : "")}
            data-discover="true"
            style={({ isActive }) => ({
              textDecoration: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              color: isActive ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
              background: isActive ? 'rgb(59, 130, 246)' : 'transparent',
              transition: '0.2s',
              border: '1px solid transparent'
            })}
            end={link.to === "/"}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* RIGHT: USER PROFILE */}
      <div className="app-menu-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user ? (
          <>
            <div className="app-menu-user-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '12px'
              }}>
                {initials}
              </div>
              <div className="app-menu-user-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{displayName}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Logística • NL</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#64748b', cursor: 'pointer'
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <NavLink to="/login" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 700 }}>
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}