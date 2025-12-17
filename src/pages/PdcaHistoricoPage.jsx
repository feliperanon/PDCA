// src/pages/PdcaHistoricoPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "../firebase.js";

function toDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function PdcaHistoricoPage() {
  const navigate = useNavigate();
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("todos"); // todos | concluidos | cancelados
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState("pdca"); // 'pdca' | 'turnos'
  const [selectedEspelho, setSelectedEspelho] = useState(null); // Modal Data

  // [NEW] Date Filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // [NEW] Edit/Reopen Logic
  function handleEditOperation(p) {
    if (!p.snapshot || !p.snapshot.dailyData) {
      alert("Erro: Dados do espelho não encontrados para edição.");
      return;
    }
    const { date, shift } = p.snapshot.dailyData;

    // If closed, warn user
    if (p.situacao === 'concluido' || p.situacao === 'Concluído') {
      if (!window.confirm("ATENÇÃO: Este turno já foi concluído. Ao editar, você reabrirá o diário e precisará finalizar novamente. Deseja continuar?")) return;
    }

    // Navigate to Daily Operations with State
    navigate('/diario', { state: { date, shift } });
  }


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
          // [FIX] Allow "Em Andamento" and "Concluído" (with accent) to appear
          if (["concluido", "Concluído", "cancelado", "Em Andamento", "ativo"].includes(situacao)) {
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

    // 3. Filter by Date
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter(p => {
        const d = toDate(p.concluidoEm || p.criadoEm);
        return d && d >= start;
      });
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(p => {
        const d = toDate(p.concluidoEm || p.criadoEm);
        return d && d <= end;
      });
    }

    return { filteredList: list };
  }, [pdcas, filtroSituacao, activeTab, filterStartDate, filterEndDate]);

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

  // ------- BULK DELETE -------
  async function handleDeleteSelected() {
    const count = selectedIds.length;
    if (count === 0) return;

    if (!window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE ${count} registros selecionados?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, "pdcas", id))));

      setPdcas(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      alert("Registros excluídos com sucesso.");
    } catch (e) {
      console.error("Erro ao excluir em massa:", e);
      alert("Erro ao excluir alguns registros.");
    } finally {
      setLoading(false);
    }
  }



  // ------- DELETE -------
  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja EXCLUIR este registro permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      // 1. Get the doc to check if it's a turno and get IDs
      const item = pdcas.find(p => p.id === id);

      // 2. Delete Sync: If Turno, delete from 'daily_operations'
      if (item && item.type === 'turno' && item.snapshot?.dailyData) {
        const { date, shift } = item.snapshot.dailyData;
        if (date && shift) {
          const opId = `${date}_${shift}`;
          await deleteDoc(doc(db, "daily_operations", opId));
          console.log("Deleted synced daily_operation:", opId);
        }
      }

      await deleteDoc(doc(db, "pdcas", id));
      setPdcas(prev => prev.filter(p => p.id !== id));
      alert("Registro excluído com sucesso.");
    } catch (e) {
      console.error("Erro ao excluir:", e);
      alert("Erro ao excluir registro.");
    }
  }

  // --- CLEANUP TOOL ---
  const handleCleanupOrphans = async () => {
    if (!window.confirm("ATENÇÃO: Isso irá verificar e excluir registros de 'Espelho Operacional' (Closed) que não possuem um PDCA correspondente no histórico (foram excluídos incorretamente antes). Deseja continuar?")) return;

    setLoading(true);
    try {
      // 1. Get ALL Daily Ops (Open or Closed)
      // Removing the 'where' clause to catch everything that is not in PDCA history
      const qOps = collection(db, "daily_operations");
      const snapOps = await getDocs(qOps);
      const closedOps = snapOps.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Get All PDCAs (Turnos)
      // We already have 'pdcas' state, but let's ensure we use the full list if filtered? 
      // 'pdcas' state is full list from load().
      const validOpIds = new Set();
      pdcas.forEach(p => {
        if (p.type === 'turno' && p.snapshot?.dailyData) {
          const { date, shift } = p.snapshot.dailyData;
          if (date && shift) validOpIds.add(`${date}_${shift}`);
        }
      });

      // 3. Find Orphans
      const orphans = closedOps.filter(op => !validOpIds.has(op.id));

      console.log("--- CLEANUP DEBUG ---");
      console.log(`Total DailyOps in DB: ${closedOps.length}`);
      console.log(`Total Valid PDCA Links: ${validOpIds.size}`);
      console.log(`Orphans Found: ${orphans.length}`);
      console.log("Orphans:", orphans.map(o => o.id));

      if (orphans.length === 0) {
        alert(`Varredura completa!\n\n- Total de Operações no Banco: ${closedOps.length}\n- Total de Links Válidos (Histórico): ${validOpIds.size}\n- Órfãos encontrados: 0\n\nEstá tudo sincronizado! ✨`);
      } else {
        const orphanList = orphans.map(o => `• ${o.date} (${o.shift})`).join('\n');
        const confirmMsg = `Encontrados ${orphans.length} registros sem vínculo (Fantasmas):\n\n${orphanList}\n\nDeseja EXCLUIR esses arquivos permanentemente?`;

        if (window.confirm(confirmMsg)) {
          await Promise.all(orphans.map(op => deleteDoc(doc(db, "daily_operations", op.id))));
          alert(`Limpeza concluída! ${orphans.length} registros removidos.`);
        }
      }

    } catch (e) {
      console.error(e);
      alert("Erro na limpeza.");
    } finally {
      setLoading(false);
    }
  };

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
    const attendanceLog = dailyData.attendance_log || {};
    const staffReal = dailyData.staff_real || {}; // Legacy fallback

    const insight = getSmartInsights(p.id, pdcas);

    // 1. DATA PROCESSING
    let totalPresent = 0;
    let totalMeta = 0;
    let totalVacancies = 0;

    // Absence Lists
    const listAbsent = [];
    const listSick = [];
    const listVacation = [];
    const listAway = [];

    // Table Data
    const sectorStats = {};
    const validSectors = Object.keys(targets).filter(k => k !== 'meta_chegada' && k !== 'meta_saida' && k !== 'totalHeadcount');

    // Helper to get Name safely
    const getName = (entry) => entry.nome || entry.name || "Colaborador sem nome";

    validSectors.forEach(secKey => {
      const meta = parseInt(targets[secKey]) || 0;
      let present = 0;
      let sick = 0;
      let vacation = 0;
      let absent = 0;
      let away = 0;

      // Check Log
      const entries = Object.values(attendanceLog).filter(e => e.sector === secKey);

      // If log exists, use it. Else fallback.
      if (entries.length > 0 || Object.keys(attendanceLog).length > 0) {
        entries.forEach(e => {
          const s = e.status || 'present';
          if (s === 'present') present++;
          else if (s === 'sick') { sick++; listSick.push({ name: getName(e), sector: secKey }); }
          else if (s === 'vacation') { vacation++; listVacation.push({ name: getName(e), sector: secKey }); }
          else if (s === 'absent') { absent++; listAbsent.push({ name: getName(e), sector: secKey }); }
          else if (s === 'away') { away++; listAway.push({ name: getName(e), sector: secKey }); }
        });
      } else {
        // FALLBACK Legacy
        const f = parseInt(staffReal[secKey]) || 0;
        present = Math.max(0, meta - f);
        absent = f;
      }

      // Structural Vacancy: Meta - (All Linked People)
      // Linked People = Present + Sick + Vacation + Absent + Away
      const totalLinked = present + sick + vacation + absent + away;
      const vacancy = Math.max(0, meta - totalLinked);

      totalPresent += present;
      totalMeta += meta;
      totalVacancies += vacancy;

      sectorStats[secKey] = { meta, present, absent, sick, vacation, away, vacancy };
    });

    const tonnageVal = parseFloat(dailyData.tonelagem) || 0;
    const kgPerPerson = totalPresent > 0 ? (tonnageVal / totalPresent) : 0;

    const win = window.open("", "_blank");
    if (!win) return;

    // --- HTML GENERATORS ---

    const buildListHtml = (list, title, color) => {
      if (list.length === 0) return '';
      return `
            <div style="margin-bottom: 8px;">
                <div style="color: ${color}; font-size: 10px; font-weight: 700; text-transform: uppercase;">${title} (${list.length})</div>
                <div style="font-size: 11px; color: #475569; line-height: 1.4;">
                    ${list.map(i => `<span style="display:inline-block; margin-right:10px;">• ${i.name} <span style="opacity:0.6; font-size:9px">(${i.sector})</span></span>`).join('')}
                </div>
            </div>
        `;
    };

    const absencesHtml = `
        <div class="card" style="height: 100%; margin-bottom: 0;">
            <div class="section-title" style="border-left-color: #f59e0b;">⚠️ Detalhamento de Ausências</div>
            ${listAbsent.length + listSick.length + listVacation.length + listAway.length === 0
        ? '<div style="color:#94a3b8; font-style:italic;">Nenhuma ausência registrada.</div>'
        : `
                    ${buildListHtml(listAbsent, "Faltas Injustificadas", "#ef4444")}
                    ${buildListHtml(listSick, "Atestados", "#16a34a")}
                    ${buildListHtml(listVacation, "Férias", "#f59e0b")}
                    ${buildListHtml(listAway, "Afastamentos", "#64748b")}
                  `
      }
        </div>
    `;

    // Summary Cards (Mimicking Dashboard)
    const summaryCardsHtml = `
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
             <!-- PRESENTES -->
            <div class="metric-box" style="border-bottom: 3px solid #0ea5e9;">
                <span class="metric-val" style="color:#0c4a6e">${totalPresent} <span style="font-size:12px; color:#94a3b8">/ ${totalMeta}</span></span>
                <span class="metric-lbl">Presentes / Meta</span>
            </div>
             <!-- VAGAS (CONTRATAR) -->
            <div class="metric-box" style="border-bottom: 3px solid ${totalVacancies > 0 ? '#ef4444' : '#e2e8f0'}; background: ${totalVacancies > 0 ? '#fef2f2' : 'white'}">
                <span class="metric-val" style="color:${totalVacancies > 0 ? '#b91c1c' : '#94a3b8'}">${totalVacancies > 0 ? `-${totalVacancies}` : '0'}</span>
                <span class="metric-lbl">${totalVacancies > 0 ? 'CONTRATAR (VAGAS)' : 'Vagas em Aberto'}</span>
            </div>
             <!-- FALTAS -->
            <div class="metric-box" style="border-bottom: 3px solid #ef4444;">
                <span class="metric-val" style="color:#991b1b">${listAbsent.length}</span>
                <span class="metric-lbl">Faltas</span>
            </div>
             <!-- FÉRIAS -->
            <div class="metric-box" style="border-bottom: 3px solid #f59e0b;">
                 <span class="metric-val" style="color:#92400e">${listVacation.length}</span>
                <span class="metric-lbl">Férias</span>
            </div>
             <!-- ATESTADOS -->
            <div class="metric-box" style="border-bottom: 3px solid #16a34a;">
                 <span class="metric-val" style="color:#166534">${listSick.length}</span>
                <span class="metric-lbl">Atestados</span>
            </div>
        </div>
    `;


    win.document.write(`
      <html>
        <head>
          <title>Relatório Operacional - ${p.codigo}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
                font-family: 'Inter', 'Segoe UI', sans-serif; 
                background: #fff; color: #1e293b; margin: 0; padding: 0; 
                -webkit-print-color-adjust: exact; 
                font-size: 11px;
            }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -1px; }
            .logo span { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
            .meta-info { text-align: right; font-size: 11px; color: #64748b; }
            .meta-info strong { color: #3b82f6; font-size: 14px; display: block; margin-bottom: 2px; }
            
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; page-break-inside: avoid; }
            .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 12px; border-left: 3px solid #3b82f6; padding-left: 8px; letter-spacing: 0.5px; }
            
            .metric-box { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
            .metric-val { font-size: 20px; font-weight: 800; display: block; margin-bottom: 2px; }
            .metric-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
            
            .staff-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .staff-table th { text-align: left; color: #475569; font-weight: 700; padding: 6px 4px; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; background: #f1f5f9; }
            .staff-table td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #334155; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            
            .report-box { white-space: pre-wrap; color: #334155; line-height: 1.6; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
          </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">
                    <h1>Espelho Operacional</h1>
                    <span>Relatório de Turno</span>
                </div>
                <div class="meta-info">
                    <strong>${fixDate(dailyData.date || p.criadoEm)} • ${String(dailyData.shift || 'Turno Indefinido').toUpperCase()}</strong>
                    Gerado em ${new Date().toLocaleString('pt-BR')}
                </div>
            </div>

            <!-- KEY METRICS ROW -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div class="metric-box">
                    <span class="metric-val" style="color:#3b82f6">${formatNumberBr(dailyData.tonelagem)} <span style="font-size:12px">kg</span></span>
                    <span class="metric-lbl">Produção Total</span>
                </div>
                <div class="metric-box">
                    <span class="metric-val" style="color:#0f172a">${formatNumberBr(kgPerPerson)} <span style="font-size:12px">kg</span></span>
                    <span class="metric-lbl">Produtivo / Pessoa</span>
                </div>
                <div class="metric-box">
                    <span class="metric-val">${dailyData.hora_chegada || '--:--'}</span>
                    <span class="metric-lbl">Chegada Mercadoria</span>
                </div>
                <div class="metric-box">
                    <span class="metric-val" style="color:${dailyData.chegada_tardia ? '#ef4444' : '#10b981'}">${dailyData.hora_saida || '--:--'}</span>
                    <span class="metric-lbl">Encerramento</span>
                </div>
            </div>

            <!-- PEOPLE SUMMARY (NEW CARD) -->
            ${summaryCardsHtml}

            <!-- MAIN CONTENT GRID -->
            <div style="display: grid; grid-template-columns: 55% 45%; gap: 15px; margin-bottom: 20px;">
                
                <!-- LEFT COL: HEADCOUNT -->
                <div class="card">
                    <div class="section-title">Detalhamento por Setor</div>
                    <table class="staff-table">
                        <thead>
                            <tr>
                                <th>Setor</th>
                                <th>Meta</th>
                                <th>Pres.</th>
                                <th>Ausências</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(sectorStats).map(key => {
      const s = sectorStats[key];
      // Status Logic
      let statusHtml = '';
      if (s.vacancy > 0) statusHtml = `<span class="status-badge" style="background:#fee2e2; color:#b91c1c">VAGAS: -${s.vacancy}</span>`;
      else if (s.absent > 0) statusHtml = `<span class="status-badge" style="background:#fef3c7; color:#b45309">FALTAS: ${s.absent}</span>`;
      else statusHtml = `<span class="status-badge" style="background:#dcfce7; color:#15803d">OK</span>`;

      // Absence Column Detail
      let absenceDetail = [];
      if (s.absent > 0) absenceDetail.push(`${s.absent}F`);
      if (s.sick > 0) absenceDetail.push(`${s.sick}A`);
      if (s.vacation > 0) absenceDetail.push(`${s.vacation}Fer`);

      return `
                                    <tr>
                                        <td style="text-transform:capitalize; font-weight:600">${key.replace('_', ' ')}</td>
                                        <td>${s.meta}</td>
                                        <td style="font-weight:700; color:#0f172a">${s.present}</td>
                                        <td style="color:#64748b; font-size:10px">${absenceDetail.join(', ') || '-'}</td>
                                        <td>${statusHtml}</td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- RIGHT COL: INSIGHTS -->
                <div style="display: flex; flexDirection: column; gap: 15px;">
                     <div class="card" style="background: #fdf4ff; border-color: #f0abfc;">
                        <div class="section-title" style="border-left-color: #d946ef; color:#86198f;">✨ Análise de Performance</div>
                         ${insight ? `
                            <div style="display:flex; align-items:center; gap:15px">
                                 <div style="text-align:center;">
                                    <span style="display:block; font-size:20px; font-weight:800; color:#d946ef">#${insight.rank}</span>
                                    <span style="font-size:9px; color:#a21caf; text-transform:uppercase">Ranking</span>
                                </div>
                                <div style="font-size:11px; color:#701a75">
                                    Esta foi a <b>${insight.rank}ª melhor operação</b> registrada.
                                    <br/>Recorde atual: <b>${formatNumberBr(insight.bestTon)} kg</b>.
                                </div>
                            </div>
                        ` : '<div style="font-size:11px; color:#86198f">Dados insuficientes para análise comparativa.</div>'}
                    </div>

                    <div class="card">
                         <div class="section-title">📋 Relatório do Líder</div>
                         <div class="report-box">${dailyData.relatorio_lider || "Nenhum reporte registrado."}</div>
                    </div>
                </div>

            </div>

            <!-- BOTTOM GRID: ABSENCES & NOTES -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                ${absencesHtml}
            </div>

            <div class="footer">
                <div>User: ${p.responsavel} | Ref: ${p.codigo}</div>
                <div style="font-style:italic">"A excelência operacional é um hábito, não um ato."</div>
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

        <div className="historico-filtros" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="filter-group">
            <span style={{ fontSize: '12px', color: '#64748b' }}>De:</span>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '4px' }} />
          </div>
          <div className="filter-group">
            <span style={{ fontSize: '12px', color: '#64748b' }}>Até:</span>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '4px' }} />
          </div>
          <div className="divider" style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 10px' }}></div>
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
          {selectedIds.length > 0 && (
            <button type="button" className="btn-secondary" style={{ color: '#ef4444', borderColor: '#fee2e2' }} onClick={handleDeleteSelected}>
              Excluir Selecionados
            </button>
          )}
          <button type="button" onClick={handleCleanupOrphans} style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: 'none', border: '1px dashed #cbd5e1', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Corrigir dados fantasmas">
            🔧 Manutenção de Dados
          </button>
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
                  <th>Dt. Op.</th>
                  <th>Responsável</th>
                  <th>Modificado</th>
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
                        <>
                          <button onClick={() => handleOpenEspelho(p)} className="btn-icon-small" title="Abrir Espelho" style={{ background: 'none', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}>
                            📄 Abrir
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="btn-icon-small" title="Excluir" style={{ background: 'none', border: '1px solid #fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to={`/pdca/${p.id}`} className="btn-icon-small" style={{ textDecoration: 'none', border: '1px solid #e5e7eb', padding: '4px 8px', borderRadius: '6px', color: '#111', fontSize: '12px', marginRight: '4px' }}>
                            📂 Ver
                          </Link>
                          <button onClick={() => alert("Função de edição rápida em desenvolvimento.")} className="btn-icon-small" title="Editar" style={{ background: 'none', border: '1px solid #e5e7eb', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="btn-icon-small" title="Excluir" style={{ background: 'none', border: '1px solid #fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', color: activeTab === 'turnos' ? '#3b82f6' : '#111' }}>{p.codigo}</td>
                    <td>{p.titulo}</td>
                    <td>
                      {(() => {
                        if (p.situacao === "concluido") return <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Concluído</span>;
                        if (p.situacao === "cancelado") return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancelado</span>;
                        if (p.situacao === "Em Andamento") return <span style={{ color: '#eab308', fontWeight: 'bold' }}>Em Andamento</span>;
                        return p.situacao || p.status;
                      })()}
                    </td>
                    <td>
                      {(() => {
                        // Display Operation Date if available (Turno), else Area/created
                        const opDate = p.snapshot?.dailyData?.date
                          ? p.snapshot.dailyData.date.split('-').reverse().join('/')
                          : (p.plan?.area || '-');
                        return opDate;
                      })()}
                    </td>
                    <td>{p.plan?.responsavel || '-'}</td>
                    <td>{p.updatedAt ? new Date(p.updatedAt).toLocaleString('pt-BR') : (p.criadoEm ? new Date(p.criadoEm).toLocaleString('pt-BR') : '-')}</td>
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
