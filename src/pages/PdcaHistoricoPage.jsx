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
  // [NEW] Tabs State
  const [activeTab, setActiveTab] = useState("pdca"); // 'pdca' | 'turnos'
  const [selectedEspelho, setSelectedEspelho] = useState(null); // Modal Data

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
            // Determine type: 'turno' if has snapshot or special code, else 'pdca'
            const isTurno = !!data.snapshot || (data.codigo && data.codigo.startsWith("TURNO-"));

            docs.push({
              id: docSnap.id,
              type: isTurno ? 'turno' : 'pdca',
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
              snapshot: data.snapshot || null,
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

  const { filteredList } = useMemo(() => {
    // 1. Filter by Tab
    let list = pdcas.filter(p => p.type === (activeTab === 'turnos' ? 'turno' : 'pdca'));

    // 2. Filter by Situation
    if (filtroSituacao === "concluidos") list = list.filter(p => p.situacao === 'concluido');
    if (filtroSituacao === "cancelados") list = list.filter(p => p.situacao === 'cancelado');

    return { filteredList: list };
  }, [pdcas, filtroSituacao, activeTab]);

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
    const allVisibleIds = filteredList.map((p) => p.id);
    setSelectedIds(allVisibleIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function getItemsToExport() {
    if (selectedIds.length === 0) return filteredList;
    const selectedSet = new Set(selectedIds);
    return filteredList.filter((p) => selectedSet.has(p.id));
  }

  // ------- OPEN MODAL -------
  function handleOpenEspelho(p) {
    if (p.snapshot) {
      setSelectedEspelho(p);
    } else {
      // Fallback legacy without snapshot
      alert("Este registro antigo não possui visualização detalhada de Espelho.");
    }
  }

  function handleCloseModal() {
    setSelectedEspelho(null);
  }


  // ------- exportar CSV -------

  function handleExportCsv() {
    const items = getItemsToExport();
    if (items.length === 0) {
      alert("Nenhum item para exportar.");
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
    link.setAttribute("download", `historico_${activeTab}.csv`);
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
      alert("Nenhum item para exportar.");
      return;
    }

    // Direct Detailed Print if Single Shift Selected
    const item = items[0];
    if (items.length === 1 && item.snapshot && activeTab === 'turnos') {
      handleExportDetailedPdf(item);
      return;
    }

    // Generic Table Print
    const htmlRows = items
      .map(
        (p) => `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.titulo}</td>
        <td>${p.situacao === "concluido" ? "Concluído" : "Cancelado"}</td>
        <td>${p.area || "-"}</td>
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
          <title>Histórico - ${activeTab === 'turnos' ? 'Espelhos Operacionais' : 'PDCAs'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top:20px }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Histórico: ${activeTab === 'turnos' ? 'Espelhos Operacionais' : 'Projetos PDCA'}</h1>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Situação</th>
                <th>Área</th>
                <th>Responsável</th>
                <th>Descrição/Report</th>
                <th>Data</th>
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


  // [NEW] Helper for Smart Insights (Ranking)
  function getSmartInsights(currentId, list) {
    // Filter only Turnos
    const turnos = list.filter(p => p.type === 'turno' && p.snapshot?.dailyData?.tonelagem);
    if (turnos.length === 0) return null;

    // Sort by tonnage descending
    const sorted = [...turnos].sort((a, b) => (b.snapshot.dailyData.tonelagem || 0) - (a.snapshot.dailyData.tonelagem || 0));
    const rank = sorted.findIndex(p => p.id === currentId) + 1;
    const total = sorted.length;

    const best = sorted[0];
    const isBest = best.id === currentId;

    return { rank, total, isBest, bestTon: best.snapshot.dailyData.tonelagem };
  }

  function formatNumberBr(num) {
    if (!num && num !== 0) return '-';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  }

  function fixDate(dateString) {
    if (!dateString) return '-';
    if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  }

  function handleExportDetailedPdf(p) {
    const snap = p.snapshot;
    const dailyData = snap.dailyData || {};
    const targets = snap.targets || {};
    const staffReal = dailyData.staff_real || {};

    const insight = getSmartInsights(p.id, pdcas); // Compute ranking

    // Calculate Kg/Pessoa
    let totalRealStaff = 0;
    Object.keys(staffReal).forEach(k => {
      if (k !== 'totalHeadcount') totalRealStaff += (parseInt(staffReal[k]) || 0);
    });
    // Fallback if totalRealStaff is 0 to avoid Infinity, though 0 staff with tonnage is odd.
    const tonnageVal = parseFloat(dailyData.tonelagem) || 0;
    const kgPerPerson = totalRealStaff > 0 ? (tonnageVal / totalRealStaff) : 0;

    const win = window.open("", "_blank");
    if (!win) return;

    // Helper p/ cor de status
    const getStatusColor = (real, meta) => {
      if (!meta) return '#6b7280';
      const r = parseInt(real) || 0;
      const diff = meta - r;
      if (r > 0) return '#ef4444'; // Tem falta
      return '#10b981'; // Completo
    };

    win.document.write(`
      <html>
        <head>
          <title>Relatório Operacional - ${p.codigo}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { 
                font-family: 'Segoe UI', system-ui, sans-serif; 
                background: #fff; color: #1e293b; margin: 0; padding: 0; 
                -webkit-print-color-adjust: exact; 
                font-size: 12px;
            }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo h1 { margin: 0; font-size: 22px; color: #1e293b; letter-spacing: -0.5px; }
            .logo span { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .meta-info { text-align: right; font-size: 12px; color: #64748b; }
            .meta-info strong { color: #3b82f6; font-size: 14px; display: block; margin-bottom: 2px; }
            
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 10px; border-left: 3px solid #3b82f6; padding-left: 8px; }
            
            .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 15px; }
            .metric-box { background: white; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
            .metric-val { font-size: 18px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 4px; }
            .metric-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; line-height: 1.2; display:block; }
            
            .staff-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .staff-table th { text-align: left; color: #64748b; font-weight: 600; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
            .staff-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; }
            .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }

            .report-box { background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px; line-height: 1.5; white-space: pre-wrap; min-height: 80px; }
            
            .insight-box { display: flex; align-items: center; gap: 15px; font-size: 12px; color: #334155; }
            .rank-badge { background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 11px; }
            
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">
                    <h1>Espelho Operacional</h1>
                    <span>Relatório de Turno</span>
                </div>
                <div class="meta-info">
                    <strong>DATA: ${fixDate(dailyData.date)}</strong>
                    TURNO: ${String(dailyData.shift).toUpperCase()} 
                </div>
            </div>

            <div class="metrics-grid">
                <div class="metric-box">
                    <span class="metric-val" style="color:#3b82f6">${formatNumberBr(dailyData.tonelagem)} Kg</span>
                    <span class="metric-lbl">Peso Movimentado</span>
                </div>
                 <div class="metric-box">
                    <span class="metric-val" style="color:#0f172a">${formatNumberBr(kgPerPerson)} Kg</span>
                    <span class="metric-lbl">Peso / Pessoa</span>
                </div>
                 <div class="metric-box">
                    <span class="metric-val">${dailyData.hora_chegada || '--:--'}</span>
                    <span class="metric-lbl">Chegada Mercadorias</span>
                </div>
                 <div class="metric-box">
                    <span class="metric-val" style="color:${dailyData.chegada_tardia ? '#ef4444' : '#10b981'}">${dailyData.hora_saida || '--:--'}</span>
                    <span class="metric-lbl">Saída NL</span>
                </div>
                 <div class="metric-box">
                    <span class="metric-val">${dailyData.rating || 0} ★</span>
                    <span class="metric-lbl">Liderança</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="card">
                    <div class="section-title">Saúde das Equipes (Headcount)</div>
                    <table class="staff-table">
                        <thead>
                            <tr>
                                <th>Setor</th>
                                <th>Meta</th>
                                <th>Faltas</th>
                                <th style="text-align:right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(targets).filter(k => k !== 'meta_chegada' && k !== 'meta_saida' && k !== 'totalHeadcount').map(key => {
      const meta = targets[key] || 0;
      const faltas = parseInt(staffReal[key]) || 0;
      const color = faltas > 0 ? '#ef4444' : '#10b981';
      const label = faltas > 0 ? `-${faltas}` : 'OK';
      return `
                                    <tr>
                                        <td style="text-transform:capitalize">${key.replace('_', ' ')}</td>
                                        <td>${meta}</td>
                                        <td style="color:${faltas > 0 ? '#ef4444' : '#64748b'}">${faltas}</td>
                                        <td style="text-align:right; color:${color}; font-weight:700">
                                            <span class="status-dot" style="background:${color}"></span>${label}
                                        </td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <div class="section-title">🧠 Super Inteligência (Insight)</div>
                    <div class="insight-box">
                        ${insight ? `
                            <div style="text-align:center; padding-right:15px; border-right:1px solid #e2e8f0; min-width:80px">
                                <span style="display:block; font-size:24px; font-weight:800; color:${insight.isBest ? '#10b981' : '#3b82f6'}">#${insight.rank}</span>
                                <span style="font-size:10px; color:#64748b; text-transform:uppercase">Ranking</span>
                            </div>
                            <div>
                                <p style="margin:0; font-weight:600; margin-bottom:4px">
                                    ${insight.isBest ? '🏆 MELHOR DIA REGISTRADO!' : `Este turno ocupa a ${insight.rank}ª posição.`}
                                </p>
                                <p style="margin:0; color:#64748b">
                                    Comparado com ${insight.total} turnos no histórico.
                                    ${!insight.isBest ? `O recorde atual é de <strong>${formatNumberBr(insight.bestTon)} Kg</strong>.` : 'Parabéns pelo recorde de produtividade!'}
                                </p>
                            </div>
                        ` : '<p>Dados insuficientes para ranking.</p>'}
                    </div>
                </div>
            </div>

            <div class="card" style="background: #fff; border: 2px solid #e2e8f0;">
                <div class="section-title">📝 Relatório do Líder & Ocorrências</div>
                <div class="report-box">${dailyData.relatorio_lider || "Nenhum reporte registrado."}</div>
            </div>

            <div class="footer">
                <div>
                    Gerado via Sistema PDCA • ${p.codigo}<br/>
                    Usuário: ${p.responsavel} | Impresso em ${new Date().toLocaleString('pt-BR')}
                </div>
                <div style="text-align:right">
                    __________________________________________<br/>
                    Assinatura do Responsável
                </div>
            </div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  if (loading) {
    return <div className="page">Carregando histórico...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  // --- Modal Display Logic Reuse (Simplify for now) ---
  const modalDailyData = selectedEspelho?.snapshot?.dailyData;

  return (
    <div className="page historico-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Histórico Geral</h1>
          <p className="page-subtitle">PDCAs Concluídos e Fechamentos de Turno</p>
        </div>
      </div>

      <div style={{ paddingBottom: '15px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <button
          onClick={() => { setActiveTab('pdca'); clearSelection(); }}
          style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === 'pdca' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'pdca' ? '#3b82f6' : '#64748b',
            fontWeight: '600', paddingBottom: '10px', fontSize: '15px', cursor: 'pointer'
          }}>
          📁 Projetos PDCA
        </button>
        <button
          onClick={() => { setActiveTab('turnos'); clearSelection(); }}
          style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === 'turnos' ? '3px solid #3b82f6' : '3px solid transparent',
            color: activeTab === 'turnos' ? '#3b82f6' : '#64748b',
            fontWeight: '600', paddingBottom: '10px', fontSize: '15px', cursor: 'pointer'
          }}>
          📊 Espelhos Operacionais
        </button>
      </div>

      <section className="historico-summary">
        <div className="historico-summary-metrics">
          <div className="historico-summary-card">
            <span className="metric-label">{activeTab === 'turnos' ? 'Turnos Encerrados' : 'Projetos Concluídos'}</span>
            <span className="metric-value">{filteredList.length}</span>
          </div>
        </div>

        <div className="historico-filtros">
          <span>Filtrar:</span>
          <button type="button" onClick={() => setFiltroSituacao("todos")} className={filtroSituacao === "todos" ? "btn-chip btn-chip-active" : "btn-chip"}>Todos</button>
          <button type="button" onClick={() => setFiltroSituacao("concluidos")} className={filtroSituacao === "concluidos" ? "btn-chip btn-chip-active" : "btn-chip"}>Concluídos</button>
          <button type="button" onClick={() => setFiltroSituacao("cancelados")} className={filtroSituacao === "cancelados" ? "btn-chip btn-chip-active" : "btn-chip"}>Cancelados</button>
        </div>
      </section>

      <section className="historico-toolbar">
        <div className="historico-selecao">
          <span>Selecionados: <strong>{selectedIds.length}</strong></span>
          <button type="button" className="btn-secondary" onClick={selectAllVisible}>Todos</button>
          <button type="button" className="btn-secondary" onClick={clearSelection}>Limpar</button>
        </div>
        <div className="historico-export">
          <button type="button" className="btn-secondary" onClick={handleExportCsv}>Exportar CSV</button>
          <button type="button" className="btn-primary" onClick={handleExportPdf}>
            {selectedIds.length === 1 && activeTab === 'turnos' ? 'Imprimir Registro' : 'Lista em PDF'}
          </button>
        </div>
      </section>

      <section className="historico-list">
        {filteredList.length === 0 ? (
          <div className="empty">Nenhum registro encontrado.</div>
        ) : (
          <div className="historico-table-wrapper">
            <table className="historico-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Sel.</th>
                  <th>Ação</th>
                  <th>Código</th>
                  <th>Título / Referência</th>
                  <th>Situação</th>
                  <th>Área</th>
                  <th>Responsável</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p) => (
                  <tr key={p.id} className="historico-row">
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td>
                      {activeTab === 'turnos' ? (
                        <button onClick={() => handleOpenEspelho(p)} className="btn-icon-small" title="Abrir Espelho" style={{ background: 'none', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                          📄 Abrir
                        </button>
                      ) : (
                        <Link to={`/pdca/${p.id}`} className="btn-icon-small" style={{ textDecoration: 'none', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '6px', color: '#111', fontSize: '12px' }}>
                          📂 Ver
                        </Link>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', color: activeTab === 'turnos' ? '#3b82f6' : '#111' }}>{p.codigo}</td>
                    <td>{p.titulo}</td>
                    <td>{p.situacao === "concluido" ? "Concluído" : "Cancelado"}</td>
                    <td>{p.area || "-"}</td>
                    <td>{p.responsavel || "-"}</td>
                    <td>{formatDate(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL ESPELHO */}
      {selectedEspelho && modalDailyData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', width: '800px', maxWidth: '95%', borderRadius: '12px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Detalhes do Espelho</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>{selectedEspelho.titulo}</h3>
                  <p style={{ margin: 0, color: '#64748b' }}>{selectedEspelho.codigo}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#64748b' }}>Líder: <strong>{selectedEspelho.responsavel}</strong></p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{fixDate(modalDailyData.date)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Peso Movim.</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{formatNumberBr(modalDailyData.tonelagem)} Kg</span>
                </div>
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Chegada</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{modalDailyData.hora_chegada || '-'}</span>
                </div>
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Saída NL</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: modalDailyData.chegada_tardia ? '#ef4444' : '#10b981' }}>
                    {modalDailyData.hora_saida || '-'}
                  </span>
                </div>
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}>Avaliação</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{modalDailyData.rating || 0} ★</span>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, fontSize: '14px', textTransform: 'uppercase', color: '#475569' }}>Relatório do Líder</h4>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#334155' }}>{modalDailyData.relatorio_lider}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button onClick={handleCloseModal} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Fechar</button>
                <button
                  onClick={() => handleExportDetailedPdf(selectedEspelho)}
                  style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  🖨️ Imprimir Relatório Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
