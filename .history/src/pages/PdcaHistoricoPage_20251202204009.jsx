// src/pages/PdcaHistoricoPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";

function toDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function PdcaHistoricoPage() {
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("todos"); // todos | concluidos | cancelados

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
        const snap = await getDocs(q);
        const docs = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const situacao = data.situacao || "ativo";
          if (situacao === "concluido" || situacao === "cancelado") {
            const plan = data.plan || {};
            docs.push({
              id: docSnap.id,
              codigo: data.codigo || docSnap.id,
              titulo: data.titulo || "",
              situacao,
              status: data.status || "Planejando",
              criadoEm: data.criadoEm || null,
              concluidoEm: data.concluidoEm || null,
              canceladoEm: data.canceladoEm || null,
              area: plan.area || "",
              prioridade: plan.prioridade || "",
            });
          }
        });

        setPdcas(docs);
      } catch (e) {
        console.error("Erro ao carregar histórico de PDCAs:", e);
        setError("Erro ao carregar histórico de PDCAs.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const { concluidos, cancelados, filtrados } = useMemo(() => {
    const concluidosList = pdcas.filter(
      (p) => p.situacao === "concluido"
    );
    const canceladosList = pdcas.filter(
      (p) => p.situacao === "cancelado"
    );

    let base = pdcas;
    if (filtroSituacao === "concluidos") base = concluidosList;
    if (filtroSituacao === "cancelados") base = canceladosList;

    return {
      concluidos: concluidosList,
      cancelados: canceladosList,
      filtrados: base,
    };
  }, [pdcas, filtroSituacao]);

  function formatDate(p) {
    const raw = p.concluidoEm || p.canceladoEm || p.criadoEm;
    const d = toDate(raw);
    return d ? d.toLocaleString("pt-BR") : "-";
  }

  if (loading) {
    return <div className="page">Carregando histórico de PDCAs...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Histórico de PDCAs</h1>
      <p className="page-subtitle">
        Aqui ficam os projetos <strong>concluídos</strong> e{" "}
        <strong>cancelados</strong>. Essa base será usada para exportar CSV,
        PDF e montar linha do tempo.
      </p>

      <section className="historico-summary">
        <div className="historico-summary-metrics">
          <div>
            <span className="metric-label">Concluídos</span>
            <span className="metric-value">{concluidos.length}</span>
          </div>
          <div>
            <span className="metric-label">Cancelados</span>
            <span className="metric-value">{cancelados.length}</span>
          </div>
        </div>

        <div className="historico-filtros">
          <span>Filtrar por situação:</span>
          <button
            type="button"
            onClick={() => setFiltroSituacao("todos")}
            className={
              filtroSituacao === "todos" ? "btn-chip btn-chip-active" : "btn-chip"
            }
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("concluidos")}
            className={
              filtroSituacao === "concluidos"
                ? "btn-chip btn-chip-active"
                : "btn-chip"
            }
          >
            Concluídos
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("cancelados")}
            className={
              filtroSituacao === "cancelados"
                ? "btn-chip btn-chip-active"
                : "btn-chip"
            }
          >
            Cancelados
          </button>
        </div>
      </section>

      <section className="historico-list">
        {filtrados.length === 0 ? (
          <div className="empty">
            Nenhum PDCA encontrado para esse filtro.
          </div>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Situação</th>
                <th>Área</th>
                <th>Prioridade</th>
                <th>Data (conclusão/cancelamento)</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/pdca/${p.id}`}>{p.codigo}</Link>
                  </td>
                  <td>{p.titulo}</td>
                  <td>
                    {p.situacao === "concluido" ? "Concluído" : "Cancelado"}
                  </td>
                  <td>{p.area || "-"}</td>
                  <td>{p.prioridade || "-"}</td>
                  <td>{formatDate(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
