// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("🚀 handleSubmit foi chamado");
    setError("");
    setSubmitting(true);

    try {
      console.log("🔑 Chamando login(Context) com:", { email, password });
      await login(email, password);
      console.log("✅ Login OK, navegando para /");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("❌ Erro ao fazer login:", err);

      let message = "Erro ao entrar. Confira e-mail e senha.";
      if (err.code === "auth/user-not-found") {
        message = "Usuário não encontrado.";
      } else if (err.code === "auth/wrong-password") {
        message = "Senha incorreta.";
      } else if (err.code === "auth/invalid-email") {
        message = "E-mail inválido.";
      } else if (err.code === "auth/operation-not-allowed") {
        message =
          "Login com e-mail/senha não está habilitado no Firebase (console).";
      }

      setError(message);
    } finally {
      setSubmitting(false);
      console.log("🧹 Finalizou handleSubmit");
    }
  };

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  if (user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-card-header">
            <h1>Você já está autenticado</h1>
            <p className="login-subtitle">
              Use o menu superior para navegar pelos PDCAs.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary login-full-width"
            onClick={() => navigate("/", { replace: true })}
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      <div className="login-card">
        <div className="login-card-header">
          <div className="login-brand">
            <div className="login-brand-mark">PDCA NL</div>
            <span className="login-brand-sub">
              Painel de melhoria contínua da operação
            </span>
          </div>

          <h1>Entrar no PDCA NL</h1>
          <p className="login-subtitle">
            Use seu e-mail corporativo para acessar seus projetos de melhoria.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>E-mail</span>
            <input
              type="email"
              placeholder="seuemail@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="form-field">
            <span>Senha</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary login-full-width"
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-hint">
          Acesso restrito aos responsáveis pelos PDCAs da operação.
        </p>
      </div>
    </div>
  );
}
