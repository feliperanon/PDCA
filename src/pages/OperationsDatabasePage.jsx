import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.js";

// Helper to format dates
function formatDate(isoStr) {
    if (!isoStr) return "-";
    try {
        const d = new Date(isoStr);
        if (Number.isNaN(d.getTime())) return "-";
        return d.toLocaleString('pt-BR');
    } catch { return "-"; }
}

function parseDateFromCode(code) {
    if (!code || typeof code !== 'string') return null;
    const match = code.match(/TURNO-(\d{8})-/);
    if (match && match[1]) {
        const y = match[1].substring(0, 4);
        const m = match[1].substring(4, 6);
        const d = match[1].substring(6, 8);
        return `${d}/${m}/${y}`;
    }
    return null;
}

const SECTORS_CONFIG = [
    { key: 'recebimento', label: 'Recebimento', meta: 3 },
    { key: 'expedicao', label: 'Expedição', meta: 18 },
    { key: 'camara_fria', label: 'Câmara Fria', meta: 3 },
    { key: 'selecao', label: 'Seleção', meta: 12 },
    { key: 'blocado', label: 'Blocado', meta: 2 },
    { key: 'embandejamento', label: 'Embandejamento', meta: 0 },
    { key: 'contagem', label: 'Estoque/Cont.', meta: 0 }
];

export function OperationsDatabasePage() {
    const navigate = useNavigate();
    const [ops, setOps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [employeeCache, setEmployeeCache] = useState({}); // [NEW] Cache for name lookup

    // [NEW] Visualization Modal State
    const [vizModalOpen, setVizModalOpen] = useState(false);
    const [selectedVizOp, setSelectedVizOp] = useState(null);

    // Load Data & Employees
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // 1. Load Employees for Legacy Support
                const empSnap = await getDocs(collection(db, "employees"));
                const cache = {};
                empSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.matricula) cache[String(d.matricula)] = d.nome || "Colaborador";
                });
                setEmployeeCache(cache);

                // 2. Load Operations
                const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
                const snap = await getDocs(q);
                const docs = [];

                snap.forEach((docSnap) => {
                    const data = docSnap.data();
                    // Filter only valid logs/pdcas (ignore empty drafts if any)
                    if (data.type === 'turno' || data.codigo?.startsWith('TURNO-')) {
                        // Normalize Status
                        let statusNormalized = "Em Andamento";
                        const rawStatus = (data.situacao || data.status || "").toLowerCase();
                        if (rawStatus.includes("conclu") || rawStatus.includes("close")) statusNormalized = "Concluído";

                        // Extract Tonelagem for Ranking
                        const rawTon = data.snapshot?.dailyData?.tonelagem;
                        const tonValue = rawTon ? Number(String(rawTon).replace(/[^0-9,.-]/g, '').replace(',', '.')) : 0;

                        docs.push({
                            id: docSnap.id,
                            codigo: data.codigo || docSnap.id,
                            titulo: data.titulo || "Sem Título",
                            situacao: statusNormalized,
                            rawStatus: rawStatus, // For debug if needed
                            opDate: data.snapshot?.dailyData?.date
                                ? data.snapshot.dailyData.date.split('-').reverse().join('/')
                                : parseDateFromCode(data.codigo) || "-",
                            modificado: data.criadoEm || "",
                            tonelagem: tonValue,
                            originalData: data // Keep original for restore/edit logic
                        });
                    }
                });
                setOps(docs);
            } catch (e) {
                console.error("Erro ao carregar banco de dados:", e);
                setError("Erro ao carregar banco de dados.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Action: Open/Edit
    const handleEdit = (op) => {
        if (!op.originalData?.snapshot?.dailyData) {
            alert("Erro: Dados corrompidos, impossível abrir.");
            return;
        }
        // Warn if re-opening a closed shift
        if (window.confirm(`Deseja abrir o processo "${op.titulo}" para edição? Isso carregará os dados no Diário.`)) {
            const { date, shift } = op.originalData.snapshot.dailyData;
            navigate('/diario', { state: { date, shift } });
        }
    };

    // Action: Visualize (Open Modal)
    const handleVisualize = (op) => {
        if (!op.originalData?.snapshot?.dailyData) {
            alert("Erro: Dados incompletos para visualização.");
            return;
        }
        setSelectedVizOp(op);
        setVizModalOpen(true);
    };

    // Action: Delete
    const handleDelete = async (id) => {
        if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro permanentemente? Essa ação não pode ser desfeita e afetará os gráficos.")) {
            try {
                await deleteDoc(doc(db, "pdcas", id));
                setOps(ops.filter(o => o.id !== id));
            } catch (e) {
                alert("Erro ao excluir: " + e.message);
            }
        }
    };

    // --- VISUALIZATION HELPERS ---
    const getSmartMetrics = (op) => {
        if (!op) return {};
        const dailyData = op.originalData.snapshot.dailyData || {};
        const staff = dailyData.staff_effective || dailyData.staff_real || {};
        const log = dailyData.attendance_log || {};
        const ton = Number(dailyData.tonelagem) || 0; // Already parsed in load
        const tonFormatted = op.tonelagem; // Use pre-calculated value from list for consistency

        // Count staff
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalVacancies = 0; // Total gap vs Meta
        let totalMeta = 0;
        let absenteesList = [];

        // Sector Breakdown
        const sectorStats = SECTORS_CONFIG.map(sec => {
            // Filter log by sector
            const logEntries = Object.entries(log).filter(([_, entry]) => entry.sector === sec.key);
            const presentCount = logEntries.filter(([_, e]) => e.status === 'present').length;
            const sectorAbsentees = logEntries.filter(([_, e]) => e.status === 'absent');

            // Add to totals
            totalPresent += presentCount;
            totalMeta += (sec.meta || 0);
            totalAbsent += sectorAbsentees.length;

            // Absentees List
            logEntries.forEach(([id, entry]) => {
                if (['absent', 'sick', 'vacation', 'away'].includes(entry.status)) {
                    // [NEW] Smart Name Lookup
                    const solvedName = entry.nome || entry.name || employeeCache[String(id)] || `Colab. ${id}`;

                    absenteesList.push({
                        name: solvedName,
                        sector: sec.label,
                        status: entry.status
                    });
                }
            });

            const deficit = (sec.meta || 0) - presentCount;
            if (deficit > 0) totalVacancies += deficit;

            return {
                label: sec.label,
                meta: sec.meta || 0,
                present: presentCount,
                absences: sectorAbsentees.length, // [NOTE] Counts only 'unjustified' for deficit logic or all? Keeping 'absent' only for strict deficit.
                status: deficit > 0 ? `VAGAS: -${deficit}` : 'OK',
                isOk: deficit <= 0,
                totalIssues: sectorAbsentees.length // For sorting top offender
            };
        });

        // Sort sectors by issues for Top Offender Highlight
        const topOffenderSector = [...sectorStats].sort((a, b) => b.totalIssues - a.totalIssues)[0];

        // Use pre-calculated ton from ops list
        const kgPerPerson = totalPresent > 0 ? (tonFormatted / totalPresent).toFixed(0) : 0;

        // [NEW] Efficiency (Kg / Person / Hour)
        let efficiencyScore = 0;
        let hoursDuration = 0;
        let endH = 0;
        if (dailyData.hora_saida) {
            const [h, m] = dailyData.hora_saida.split(':').map(Number);
            let startH = 7; // Default start
            if (dailyData.hora_chegada) {
                const [hc, mc] = dailyData.hora_chegada.split(':').map(Number);
                startH = hc + (mc / 60);
            }
            endH = h + (m / 60);
            hoursDuration = endH - startH;

            if (hoursDuration > 0 && totalPresent > 0) {
                efficiencyScore = (tonFormatted / (totalPresent * hoursDuration)).toFixed(1);
            }
        }

        // [NEW] RANKING LOGIC (EFFICIENCY BASED)
        const allStats = ops.map(o => {
            const d = o.originalData.snapshot?.dailyData || {};
            // Robust staff count
            const sMap = d.staff_effective || d.staff_real || {};
            // Count present staff (sum of values)
            const staff = Object.values(sMap).reduce((a, v) => a + (Number(v) || 0), 0);
            const t = Number(o.tonelagem) || 0;

            let dur = 8;
            if (d.hora_saida) {
                const [hh, mm] = d.hora_saida.split(':').map(Number);
                let sh = 7;
                if (d.hora_chegada) { const [hc, mc] = d.hora_chegada.split(':').map(Number); sh = hc + (mc / 60); }
                const eh = hh + (mm / 60);
                dur = eh - sh;
                if (dur <= 0) dur += 24;
            }

            const eff = (staff > 0 && dur > 0) ? t / (staff * dur) : 0;
            // DEBUG: Log strange values
            // if (eff > 100000) console.log('High Eff:', o.id, eff, t, staff, dur);
            return { id: o.id, eff, ton: t };
        }).sort((a, b) => b.eff - a.eff);

        const rank = allStats.findIndex(x => x.id === op.id) + 1;
        const bestOp = allStats[0] || {};
        const isBestEff = rank === 1;

        // Calculate Global Tonnage Record (not efficiency record)
        const globalMaxTon = Math.max(...ops.map(o => Number(o.tonelagem) || 0));

        // [NEW] INSIGHTS GENERATOR
        const insights = [];

        // 1. Assiduidade
        const perfectAttendance = sectorStats.filter(s => s.absences === 0 && s.present > 0);
        if (perfectAttendance.length > 0) {
            const names = perfectAttendance.map(s => s.label).join(', ');
            insights.push(`👏 ${perfectAttendance.length} setores com 100% de assiduidade (${names}).`);
        }

        // 2. Tempo vs Equipe
        if (hoursDuration > 0 && totalVacancies > 0) {
            let potentialGainPerc = 0;
            if (totalPresent > 0) {
                // Gain = (Vacancies / (Existing + Vacancies))
                potentialGainPerc = (totalVacancies / (totalPresent + totalVacancies)) * 100;
                if (potentialGainPerc > 5) {
                    insights.push(`📉 Equipe incompleta (${totalPresent}/${totalPresent + totalVacancies}) reduziu a capacidade teórica em ~${potentialGainPerc.toFixed(0)}%.`);
                }
            } else {
                insights.push(`🛑 Operação realizada sem equipe registrada (Falha de Dados).`);
            }
        }

        // 3. Early Finish Highlight (Target: 9h for trucks leaving)
        if (endH > 0 && endH < 9 && tonFormatted > 20000) {
            insights.push(`🚀 Alta performance: Volume alto entregue antes das 09h!`);
        }

        return {
            totalPresent, totalAbsent, totalVacancies, totalMeta,
            absenteesList, ton: tonFormatted, kgPerPerson,
            dailyData, sectorStats, topOffenderSector,
            rank, record: globalMaxTon, bestEff: bestOp.eff,
            efficiencyScore, hoursDuration, insights, isBestEff
        };
    };

    return (
        <div className="page database-page" style={{ padding: '20px' }}>
            <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Relatórios de Turno</h1>
                    <p style={{ color: '#64748b' }}>Histórico detalhado de operações finalizadas.</p>
                </div>
                <div>
                    {/* Future Actions like Export CSV could go here */}
                </div>
            </header>

            {error && <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Carregando dados...</div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Ações</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Código</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Título / Referência</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Situação</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Dt. Op.</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Modificado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ops.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhum registro encontrado.</td>
                                </tr>
                            ) : (
                                ops.map(op => (
                                    <tr key={op.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleVisualize(op)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                                                title="Visualizar Relatório Inteligente"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => handleEdit(op)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                                title="Abrir/Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(op.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                                title="Excluir"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#334155' }}>{op.codigo}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: '500', color: '#0f172a' }}>{op.titulo}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                                                background: op.situacao === 'Concluído' ? '#dcfce7' : '#f1f5f9',
                                                color: op.situacao === 'Concluído' ? '#166534' : '#64748b'
                                            }}>
                                                {op.situacao}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#334155' }}>{op.opDate}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{formatDate(op.modificado)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* HIGH FIDELITY REPORT MODAL */}
            {vizModalOpen && selectedVizOp && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <style>{`
                        .report-container { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; width: 100%; max-width: 900px; max-height: 95vh; overflow-y: auto; padding: 30px; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
                        .r-header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .r-logo h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -1px; }
                        .r-logo span { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
                        .r-meta { text-align: right; font-size: 11px; color: #64748b; }
                        .r-meta strong { color: #3b82f6; font-size: 14px; display: block; margin-bottom: 2px; }
                        
                        .r-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                        .r-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
                        
                        .r-metric-box { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
                        .r-metric-val { font-size: 20px; font-weight: 800; display: block; margin-bottom: 2px; }
                        .r-metric-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
                        
                        .r-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                        .r-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 12px; border-left: 3px solid #3b82f6; padding-left: 8px; letter-spacing: 0.5px; }
                        
                        .r-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        .r-table th { text-align: left; color: #475569; font-weight: 700; padding: 6px 4px; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; background: #f1f5f9; }
                        .r-table td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #334155; }
                        
                        .r-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
                        .r-footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

                        @media print {
                            body * { visibility: hidden; }
                            .report-container, .report-container * { visibility: visible; }
                            .report-container { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; max-width: none; }
                            .no-print { display: none !important; }
                        }
                    `}</style>

                    <div className="report-container">
                        <button className="no-print" onClick={() => setVizModalOpen(false)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ef4444' }}>&times;</button>

                        {(() => {
                            const stats = getSmartMetrics(selectedVizOp);
                            return (
                                <>
                                    <div className="r-header">
                                        <div className="r-logo">
                                            <h1>Espelho Operacional</h1>
                                            <span>Relatório de Turno</span>
                                        </div>
                                        <div className="r-meta">
                                            <strong>{selectedVizOp.opDate} • {selectedVizOp.titulo}</strong>
                                            Gerado em {new Date().toLocaleString('pt-BR')}
                                        </div>
                                    </div>

                                    {/* KEY METRICS */}
                                    <div className="r-grid-4">
                                        <div className="r-metric-box">
                                            <span className="r-metric-val" style={{ color: '#3b82f6' }}>{Number(stats.ton).toLocaleString('pt-BR')} <span style={{ fontSize: '12px' }}>kg</span></span>
                                            <span className="r-metric-lbl">Produção Total</span>
                                        </div>
                                        <div className="r-metric-box">
                                            <span className="r-metric-val" style={{ color: '#0f172a' }}>{Number(stats.kgPerPerson).toLocaleString('pt-BR')} <span style={{ fontSize: '12px' }}>kg</span></span>
                                            <span className="r-metric-lbl">Produtivo / Pessoa</span>
                                        </div>
                                        <div className="r-metric-box">
                                            <span className="r-metric-val">{stats.dailyData.hora_chegada || "--:--"}</span>
                                            <span className="r-metric-lbl">Chegada Mercadoria</span>
                                        </div>
                                        <div className="r-metric-box">
                                            <span className="r-metric-val" style={{ color: '#10b981' }}>{stats.dailyData.hora_saida || "--:--"}</span>
                                            <span className="r-metric-lbl">Encerramento</span>
                                        </div>
                                    </div>

                                    {/* PEOPLE SUMMARY */}
                                    <div className="r-grid-5">
                                        <div className="r-metric-box" style={{ borderBottom: '3px solid #0ea5e9' }}>
                                            <span className="r-metric-val" style={{ color: '#0c4a6e' }}>{stats.totalPresent} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {stats.totalMeta}</span></span>
                                            <span className="r-metric-lbl">Presentes / Meta</span>
                                        </div>
                                        <div className="r-metric-box" style={{ borderBottom: '3px solid #ef4444', background: '#fef2f2' }}>
                                            <span className="r-metric-val" style={{ color: '#b91c1c' }}>{stats.totalVacancies > 0 ? `-${stats.totalVacancies}` : '0'}</span>
                                            <span className="r-metric-lbl">{stats.totalVacancies > 0 ? 'CONTRATAR (VAGAS)' : 'QUADRO COMPLETO'}</span>
                                        </div>
                                        <div className="r-metric-box" style={{ borderBottom: '3px solid #ef4444' }}>
                                            <span className="r-metric-val" style={{ color: '#991b1b' }}>{stats.totalAbsent}</span>
                                            <span className="r-metric-lbl">Faltas</span>
                                        </div>
                                        <div className="r-metric-box" style={{ borderBottom: '3px solid #f59e0b' }}>
                                            <span className="r-metric-val" style={{ color: '#92400e' }}>0</span>
                                            <span className="r-metric-lbl">Férias</span>
                                        </div>
                                        <div className="r-metric-box" style={{ borderBottom: '3px solid #16a34a' }}>
                                            <span className="r-metric-val" style={{ color: '#166534' }}>0</span>
                                            <span className="r-metric-lbl">Atestados</span>
                                        </div>
                                    </div>

                                    {/* MAIN GRID */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%', marginBottom: '20px' }}>
                                        {/* LEFT: STAFF TABLE */}
                                        <div className="r-card">
                                            <div className="r-section-title">Detalhamento por Setor</div>
                                            <table className="r-table">
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
                                                    {stats.sectorStats.map(sec => (
                                                        <tr key={sec.label}>
                                                            <td style={{ textTransform: 'capitalize', fontWeight: '600' }}>{sec.label}</td>
                                                            <td>{sec.meta}</td>
                                                            <td style={{ fontWeight: '700', color: '#0f172a' }}>{sec.present}</td>
                                                            <td style={{ color: '#64748b', fontSize: '10px' }}>{sec.absences > 0 ? `${sec.absences}F` : '-'}</td>
                                                            <td>
                                                                <span className="r-badge" style={{
                                                                    background: sec.isOk ? '#dcfce7' : '#fee2e2',
                                                                    color: sec.isOk ? '#15803d' : '#b91c1c'
                                                                }}>
                                                                    {sec.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* RIGHT: INSIGHTS & REPORT */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {/* RANKING CARD */}
                                            {/* RANKING CARD */}
                                            <div className="r-card" style={{ background: stats.isBestEff ? '#ecfccb' : '#fdf4ff', borderColor: stats.isBestEff ? '#a3e635' : '#f0abfc' }}>
                                                <div className="r-section-title" style={{ borderLeftColor: stats.isBestEff ? '#65a30d' : '#d946ef', color: stats.isBestEff ? '#3f6212' : '#86198f' }}>✨ Análise de Performance</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: stats.isBestEff ? '#4d7c0f' : '#d946ef' }}>#{stats.rank}</span>
                                                        <span style={{ fontSize: '9px', color: stats.isBestEff ? '#365314' : '#a21caf', textTransform: 'uppercase' }}>Ranking</span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: stats.isBestEff ? '#365314' : '#701a75' }}>
                                                        {stats.rank === 1 ? '🥇 Melhor eficiência registrada!' : `Esta foi a ${stats.rank}ª operação mais eficiente.`}
                                                        <br />
                                                        <br />
                                                        <span style={{ opacity: 0.8 }}>Score: {Number(stats.efficiencyScore).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pts (Recorde: {Number(stats.bestEff).toLocaleString('pt-BR', { maximumFractionDigits: 0 })})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* [NEW] INSIGHTS BOX */}
                                            {stats.insights.length > 0 && (
                                                <div className="r-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                                                    <div className="r-section-title" style={{ borderLeftColor: '#0ea5e9' }}>💡 Insights Operacionais</div>
                                                    <ul style={{ paddingLeft: '15px', margin: '5px 0', fontSize: '11px', color: '#334155' }}>
                                                        {stats.insights.map((ins, i) => <li key={i} style={{ marginBottom: '4px' }}>{ins}</li>)}
                                                    </ul>
                                                </div>
                                            )}



                                            {/* LEADER REPORT */}
                                            <div className="r-card">
                                                <div className="r-section-title">📋 Relatório do Líder</div>
                                                <div className="report-box" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                                                    {stats.dailyData.relatorio_lider || "Sem observações."}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTTOM: ABSENCES */}
                                    {/* BOTTOM: ABSENCES & SECTOR INFO */}
                                    <div className="r-card" style={{ marginBottom: '0' }}>
                                        <div className="r-section-title" style={{ borderLeftColor: '#f59e0b', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>⚠️ Detalhamento de Ausências</span>
                                            {stats.topOffenderSector && stats.topOffenderSector.totalIssues > 0 && (
                                                <span style={{ fontSize: '10px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px' }}>
                                                    Setor Crítico: {stats.topOffenderSector.label}
                                                </span>
                                            )}
                                        </div>
                                        {stats.absenteesList.length > 0 ? (
                                            <div style={{ marginBottom: '8px' }}>
                                                {/* Group by Type */}
                                                {['absent', 'sick', 'vacation'].map(type => {
                                                    const list = stats.absenteesList.filter(a => a.status === type);
                                                    if (list.length === 0) return null;

                                                    const label = type === 'absent' ? 'Faltas Injustificadas' : type === 'sick' ? 'Atestados Médicos' : 'Férias';
                                                    const color = type === 'absent' ? '#ef4444' : type === 'sick' ? '#3b82f6' : '#eab308';

                                                    return (
                                                        <div key={type} style={{ marginBottom: '10px' }}>
                                                            <div style={{ color: color, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                {label} ({list.length})
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                {list.map((p, idx) => (
                                                                    <span key={idx} style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                                        • <b>{p.name}</b> <span style={{ opacity: 0.7, fontSize: '9px' }}>({p.sector})</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '11px', color: '#166534' }}>Nenhuma ausência registrada. Equipe completa.</div>
                                        )}
                                    </div>

                                    <div className="r-footer">
                                        <div>User: Líder de Turno | Ref: {stats.dailyData.codigo || selectedVizOp.codigo}</div>
                                        <div style={{ fontStyle: 'italic' }}>"A excelência operacional é um hábito, não um ato."</div>
                                    </div>

                                    <div className="no-print" style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ IMPRIMIR RELATÓRIO</button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
