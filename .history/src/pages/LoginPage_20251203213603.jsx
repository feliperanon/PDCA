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
      console.log("🔑 Chamando login com:", { email, password });

      // 👉 TESTE 1: por enquanto vamos SÓ logar e navegar,
      // sem depender do login de verdade
      // comente o login real para testar o fluxo:

      // await login(email, password);

      console.log("✅ (teste) Login 'falso' OK, navegando para /");
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
          <h1>Você já está autenticado</h1>
          <button
            type="button"
            className="btn-primary"
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
      <div className="login-card">
        <h1>Entrar no PDCA NL</h1>

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
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
