import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// --- ÍCONES ---
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg>;

export function LoginPage() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const styles = `
    body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; color: #334155; }
    .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); }
    
    /* BACKGROUND SHAPES */
    .bg-shape { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; animation: float 10s infinite alternate; }
    .shape-1 { width: 400px; height: 400px; background: #bfdbfe; top: -100px; left: -100px; }
    .shape-2 { width: 300px; height: 300px; background: #ddd6fe; bottom: -50px; right: -50px; animation-delay: -5s; }
    
    @keyframes float { from { transform: translate(0, 0); } to { transform: translate(20px, 20px); } }

    .login-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      width: 100%;
      max-width: 420px;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
      position: relative;
      z-index: 10;
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .brand-section { text-align: center; margin-bottom: 30px; }
    .logo-mark { 
      width: 56px; height: 56px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
      border-radius: 16px; color: white; display: flex; align-items: center; justify-content: center; 
      margin: 0 auto 20px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    }
    .app-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .app-desc { font-size: 14px; color: #64748b; margin-top: 8px; font-weight: 500; }

    .form-group { margin-bottom: 20px; position: relative; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; transition: color 0.2s; }
    
    .start-input {
      width: 100%; padding: 12px 16px 12px 42px; border: 2px solid #e2e8f0; border-radius: 12px;
      font-size: 15px; outline: none; transition: all 0.2s; background: #fff; color: #1e293b;
    }
    .start-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    .start-input:focus + .input-icon { color: #2563eb; }

    .btn-login {
      width: 100%; background: #0f172a; color: white; border: none; padding: 14px; font-size: 15px;
      font-weight: 600; border-radius: 12px; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px;
    }
    .btn-login:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2); background: #1e293b; }
    .btn-login:active { transform: translateY(0); }
    .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

    .error-msg { background: #fef2f2; color: #ef4444; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; border: 1px solid #fee2e2; text-align: center; }
    .footer-note { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 25px; }
  `;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      let message = "Erro ao entrar. Tente novamente.";
      if (err.code === "auth/user-not-found") message = "Usuário não encontrado.";
      if (err.code === "auth/wrong-password") message = "Senha incorreta.";
      if (err.code === "auth/invalid-email") message = "E-mail inválido.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;

  return (
    <div className="login-container">
      <style>{styles}</style>

      {/* Background Shapes */}
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />

      {user ? (
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="logo-mark"><IconShield /></div>
          <h2>Bem-vindo de volta!</h2>
          <p className="app-desc">Você já está autenticado no sistema.</p>
          <button className="btn-login" onClick={() => navigate("/")}>Acessar Dashboard</button>
        </div>
      ) : (
        <div className="login-card">
          <div className="brand-section">
            <div className="logo-mark"><IconShield /></div>
            <h1 className="app-name">PDCA NL Manager</h1>
            <p className="app-desc">Identifique falhas. Planeje soluções. Evolua.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="input-label">E-mail Corporativo</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="start-input"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <span className="input-icon"><IconMail /></span>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Senha de Acesso</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="start-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="input-icon"><IconLock /></span>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={submitting}>
              {submitting ? "Autenticando..." : "Entrar no Sistema"}
            </button>
          </form>

          <div className="footer-note">
            Sistema seguro e monitorado · v2.5.0
          </div>
        </div>
      )}
    </div>
  );
}
