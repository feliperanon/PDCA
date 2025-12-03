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
  const [selectedIds, setSelectedIds] = useState([]);

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
              responsavel: plan.responsavel || "",
              problema: plan.problema || "",
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

  // ------- seleção -------

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllVisible() {
    const allVisibleIds = filtrados.map((p) => p.id);
    setSelectedIds(allVisibleIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function getItemsToExport() {
    if (selectedIds.length === 0) return filtrados;
    const selectedSet = new Set(selectedIds);
    return filtrados.filter((p) => selectedSet.has(p.id));
  }

  // ------- exportar CSV -------

  function handleExportCsv() {
    const items = getItemsToExport();
    if (items.length === 0) {
      alert("Nenhum PDCA para exportar.");
      return;
    }

    const header = [
      "codigo",
      "titulo",
      "situacao",
      "status",
      "area",
      "prioridade",
      "responsavel",
      "problema",
      "criadoEm",
      "concluidoOuCanceladoEm",
    ];

    const rows = items.map((p) => [
      p.codigo,
      p.titulo,
      p.situacao === "concluido" ? "Concluído" : "Cancelado",
      p.status,
      p.area,
      p.prioridade,
      p.responsavel,
      (p.problema || "").replace(/\s+/g, " "),
      p.criadoEm || "",
      p.concluidoEm || p.canceladoEm || "",
    ]);

    const csvContent =
      header.join(";") +
      "\n" +
      rows.map((r) => r.map(escapeCsvCell).join(";")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pdca_historico.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function escapeCsvCell(value) {
    if (value == null) return "";
    const text = String(value);
    if (text.includes(";") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  // ------- exportar PDF (via janela de impressão) -------

  function handleExportPdf() {
    const items = getItemsToExport();
    if (items.length === 0) {
      alert("Nenhum PDCA para exportar.");
      return;
    }

    const htmlRows = items
      .map(
        (p) => `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.titulo}</td>
        <td>${p.situacao === "concluido" ? "Concluído" : "Cancelado"}</td>
        <td>${p.area || "-"}</td>
        <td>${p.prioridade || "-"}</td>
        <td>${p.responsavel || "-"}</td>
        <td>${(p.problema || "").replace(/\s+/g, " ")}</td>
        <td>${formatDate(p)}</td>
      </tr>
    `
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) {
      alert("Não foi possível abrir a janela de impressão.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Histórico de PDCAs</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              margin: 24px;
              color: #111827;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 4px;
            }
            p.sub {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
            }
            tr:nth-child(even) td {
              background: #fafafa;
            }
          </style>
        </head>
        <body>
          <h1>Histórico de PDCAs</h1>
          <p class="sub">
            Exportado em ${new Date().toLocaleString("pt-BR")} – ${
      items.length
    } registro(s)
          </p>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Situação</th>
                <th>Área</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Problema</th>
                <th>Data (conclusão/cancelamento)</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
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
    <div className="page historico-page">
      <h1 className="page-title">Histórico de PDCAs</h1>
      <p className="page-subtitle">
        PDCAs <strong>concluídos</strong> e{" "}
        <strong>cancelados</strong>, prontos para análise, exportação e
        relatório.
      </p>

      <section className="historico-summary">
        <div className="historico-summary-metrics">
          <div className="historico-summary-card">
            <span className="metric-label">Concluídos</span>
            <span className="metric-value">{concluidos.length}</span>
          </div>
          <div className="historico-summary-card">
            <span className="metric-label">Cancelados</span>
            <span className="metric-value">{cancelados.length}</span>
          </div>
          <div className="historico-summary-card">
            <span className="metric-label">Total no histórico</span>
            <span className="metric-value">{pdcas.length}</span>
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

      <section className="historico-toolbar">
        <div className="historico-selecao">
          <span>
            Selecionados: <strong>{selectedIds.length}</strong>
          </span>
          <button type="button" className="btn-secondary" onClick={selectAllVisible}>
            Selecionar todos da lista
          </button>
          <button type="button" className="btn-secondary" onClick={clearSelection}>
            Limpar seleção
          </button>
        </div>

        <div className="historico-export">
          <button type="button" className="btn-secondary" onClick={handleExportCsv}>
            Exportar CSV
          </button>
          <button type="button" className="btn-primary" onClick={handleExportPdf}>
            Exportar PDF
          </button>
        </div>
      </section>

      <section className="historico-list">
        {filtrados.length === 0 ? (
          <div className="empty">
            Nenhum PDCA encontrado para esse filtro.
          </div>
        ) : (
          <div className="historico-table-wrapper">
            <table className="historico-table">
              <thead>
                <tr>
                  <th>
                    <span>Sel.</span>
                  </th>
                  <th>Código</th>
                  <th>Título</th>
                  <th>Situação</th>
                  <th>Área</th>
                  <th>Prioridade</th>
                  <th>Responsável</th>
                  <th>Problema</th>
                  <th>Data (conclusão/cancelamento)</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="historico-row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>
                      <Link to={`/pdca/${p.id}`} className="historico-code-link">
                        {p.codigo}
                      </Link>
                    </td>
                    <td>{p.titulo}</td>
                    <td>
                      {p.situacao === "concluido" ? "Concluído" : "Cancelado"}
                    </td>
                    <td>{p.area || "-"}</td>
                    <td>{p.prioridade || "-"}</td>
                    <td>{p.responsavel || "-"}</td>
                    <td className="historico-problema">
                      {p.problema || "-"}
                    </td>
                    <td>{formatDate(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
