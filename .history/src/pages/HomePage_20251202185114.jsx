// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";

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

function firestoreStringDateToDate(str) {
  if (!str) return null;
  return new Date(str);
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
          docs.push({
            id: docSnap.id,
            codigo: data.codigo || docSnap.id,
            titulo: data.titulo || "",
            status: data.status || "Planejando",
            criadoEm: data.criadoEm || null,
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

  const planList = pdcas
    .filter((p) => getStageFromStatus(p.status) === "Plan")
    .slice(0, 5);
  const doList = pdcas
    .filter((p) => getStageFromStatus(p.status) === "Do")
    .slice(0, 5);
  const checkList = pdcas
    .filter((p) => getStageFromStatus(p.status) === "Check")
    .slice(0, 5);
  const actList = pdcas
    .filter((p) => getStageFromStatus(p.status) === "Act")
    .slice(0, 5);

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
          const dt = firestoreStringDateToDate(p.criadoEm);
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

      <div className="home-grid">
        {/* PLAN */}
        <div className="home-card">
          <header>
            <h2>Plan</h2>
            <p>
              Entender o <strong>porquê</strong> do problema, onde dói e o que
              precisa ser resolvido. Aqui você define causa, meta e prazo.
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
              Colocar o plano em prática. Registrar <strong>o que foi feito</strong>,
              por quem e quando.
            </p>
          </header>
          {renderList(doList)}
          <footer>
            <Link to="/dashboard" className="btn-secondary">
              Ver PDCAs em Do no quadro
            </Link>
          </footer>
        </div>

        {/* CHECK */}
        <div className="home-card">
          <header>
            <h2>Check</h2>
            <p>
              Medir o resultado: indicador antes, indicador depois,
              <strong> comparação</strong> e aprendizado.
            </p>
          </header>
          {renderList(checkList)}
          <footer>
            <Link to="/dashboard" className="btn-secondary">
              Ver PDCAs em Check no quadro
            </Link>
          </footer>
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
          <footer>
            <Link to="/dashboard" className="btn-secondary">
              Ver PDCAs em Act no quadro
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
