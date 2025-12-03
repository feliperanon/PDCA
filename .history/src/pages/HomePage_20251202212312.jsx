// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";

// Descobre em que etapa o PDCA está a partir do status
function getStageFromStatus(status) {
  switch (status) {
    case "Planejando":
      return "Plan";
    case "Executando":
      return "Do";
    case "Checando":
      return "Check";
    case "Padronizado":
      return "Act";
    default:
      return "Plan";
  }
}

// Converte string de data (ISO) para Date
function firestoreStringDateToDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function HomePage() {
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
        const snap = await getDocs(q);
        const docs = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const situacao = data.situacao || "ativo";
          docs.push({
            id: docSnap.id,
            codigo: data.codigo || docSnap.id,
            titulo: data.titulo || "",
            status: data.status || "Planejando",
            situacao,
            criadoEm: data.criadoEm || null,
            concluidoEm: data.concluidoEm || null,
            canceladoEm: data.canceladoEm || null,
            plan: data.plan || {},
          });
        });

        setPdcas(docs);
      } catch (e) {
        console.error("Erro ao carregar PDCAs na Home:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const ativos = pdcas.filter((p) => (p.situacao || "ativo") === "ativo");
  const concluidos = pdcas.filter(
    (p) => (p.situacao || "ativo") === "concluido"
  );
  const cancelados = pdcas.filter(
    (p) => (p.situacao || "ativo") === "cancelado"
  );

  const planList = ativos
    .filter((p) => getStageFromStatus(p.status) === "Plan")
    .slice(0, 5);
  const doList = ativos
    .filter((p) => getStageFromStatus(p.status) === "Do")
    .slice(0, 5);
  const checkList = ativos
    .filter((p) => getStageFromStatus(p.status) === "Check")
    .slice(0, 5);
  const actList = ativos
    .filter((p) => getStageFromStatus(p.status) === "Act")
    .slice(0, 5);

  const concluidosList = concluidos.slice(0, 5);
  const canceladosList = cancelados.slice(0, 5);

  const total = pdcas.length;
  const totalPlan = ativos.filter(
    (p) => getStageFromStatus(p.status) === "Plan"
  ).length;
  const totalDo = ativos.filter(
    (p) => getStageFromStatus(p.status) === "Do"
  ).length;
  const totalCheck = ativos.filter(
    (p) => getStageFromStatus(p.status) === "Check"
  ).length;
  const totalAct = ativos.filter(
    (p) => getStageFromStatus(p.status) === "Act"
  ).length;

  const totalAtivos = ativos.length;
  const totalConcluidos = concluidos.length;
  const totalCancelados = cancelados.length;

  function renderList(list) {
    if (loading) {
      return <p className="home-card-list-empty">Carregando...</p>;
    }

    if (list.length === 0) {
      return (
        <p className="home-card-list-empty">
          Nenhum PDCA nessa etapa ainda.
        </p>
      );
    }

    return (
      <ul className="home-card-list">
        {list.map((p) => {
          const dt = firestoreStringDateToDate(
            p.concluidoEm || p.canceladoEm || p.criadoEm
          );
          const label = dt ? dt.toLocaleString("pt-BR") : "Sem data";
          return (
            <li key={p.id}>
              <Link to={`/pdca/${p.id}`}>
                <strong>{p.codigo}</strong>
                <span>{p.titulo}</span>
                <small>{label}</small>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">PDCA NL – Mapa do Ciclo</h1>
      <p className="page-subtitle">
        Quatro fases, um fluxo só: enxergue desde o problema até o padrão
        consolidado.
      </p>

      <div className="home-layout">
        {/* LINHA 0 – CARD DE DASHBOARD GERAL (FULL WIDTH) */}
        <div className="home-row">
          <div className="home-card home-card-dashboard">
            <header>
              <h2>Dashboard geral</h2>
              <p>
                Visão rápida da operação: quantos PDCAs estão ativos em cada
                etapa do ciclo e quantos já fecharam (concluídos ou cancelados).
              </p>
            </header>

            <div className="home-dashboard-metrics">
              <div>
                <span className="metric-label">Total</span>
                <span className="metric-value">{total}</span>
              </div>
              <div>
                <span className="metric-label">Ativos</span>
                <span className="metric-value">{totalAtivos}</span>
              </div>
              <div>
                <span className="metric-label">Concluídos</span>
                <span className="metric-value">{totalConcluidos}</span>
              </div>
              <div>
                <span className="metric-label">Cancelados</span>
                <span className="metric-value">{totalCancelados}</span>
              </div>
              <div>
                <span className="metric-label">Plan</span>
                <span className="metric-value">{totalPlan}</span>
              </div>
              <div>
                <span className="metric-label">Do</span>
                <span className="metric-value">{totalDo}</span>
              </div>
              <div>
                <span className="metric-label">Check</span>
                <span className="metric-value">{totalCheck}</span>
              </div>
              <div>
                <span className="metric-label">Act</span>
                <span className="metric-value">{totalAct}</span>
              </div>
            </div>

            {/* Removido qualquer botão aqui para Dashboard / Histórico */}
          </div>
        </div>

        {/* LINHA 1 – PLAN | DO */}
        <div className="home-row home-row-2">
          {/* PLAN */}
          <div className="home-card">
            <header>
              <h2>Plan</h2>
              <p>
                Entender o <strong>porquê</strong> do problema, onde dói e o
                que precisa ser resolvido. Aqui você define causa, meta e
                prazo.
              </p>
            </header>
            {renderList(planList)}
            <footer>
              <Link to="/pdca/novo" className="btn-primary">
                Criar novo PDCA (Plan)
              </Link>
            </footer>
          </div>

          {/* DO */}
          <div className="home-card">
            <header>
              <h2>Do</h2>
              <p>
                Colocar o plano em prática. Registrar{" "}
                <strong>o que foi feito</strong>, por quem e quando.
              </p>
            </header>
            {renderList(doList)}
          </div>
        </div>

        {/* LINHA 2 – CHECK | ACT */}
        <div className="home-row home-row-2">
          {/* CHECK */}
          <div className="home-card">
            <header>
              <h2>Check</h2>
              <p>
                Medir o resultado: indicador antes, indicador depois,{" "}
                <strong>comparação</strong> e aprendizado.
              </p>
            </header>
            {renderList(checkList)}
          </div>

          {/* ACT */}
          <div className="home-card">
            <header>
              <h2>Act</h2>
              <p>
                Quando funciona, vira padrão. Quando não funciona, gera{" "}
                <strong>novo ciclo</strong> conectado ao histórico.
              </p>
            </header>
            {renderList(actList)}
          </div>
        </div>

        {/* LINHA 3 – CONCLUÍDOS | CANCELADOS */}
        <div className="home-row home-row-2">
          <div className="home-card">
            <header>
              <h2>Projetos concluídos</h2>
              <p>
                PDCAs que fecharam o ciclo e estão prontos para virar referência.
              </p>
            </header>
            {renderList(concluidosList)}
          </div>

          <div className="home-card">
            <header>
              <h2>Projetos cancelados</h2>
              <p>
                PDCAs encerrados antes do fim do ciclo, mas registrados para
                histórico.
              </p>
            </header>
            {renderList(canceladosList)}
          </div>
        </div>
      </div>
    </div>
  );
}
