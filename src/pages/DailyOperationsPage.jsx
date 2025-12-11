import React, { useState, useEffect } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    collection
} from "firebase/firestore";
import { db } from "../firebase";

import { OperationalSettingsModal } from "../components/OperationalSettingsModal";
import { addDoc, query, where, getDocs, orderBy } from "firebase/firestore";

const SHIFTS = [
    { key: 'manha', label: 'Manhã' },
    { key: 'tarde', label: 'Tarde' },
    { key: 'noite', label: 'Noite' }
];

// --- ÍCONES ---
const IconGear = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconCheckSafe = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const IconWarning = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const IconTruck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const IconStar = ({ fill }) => <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? "#eab308" : "none"} stroke={fill ? "#eab308" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

const SECTORS_CONFIG = [
    { key: 'recebimento', label: 'Recebimento' },
    { key: 'expedicao', label: 'Expedição' },
    { key: 'camara_fria', label: 'Câmara Fria' },
    { key: 'selecao', label: 'Seleção' },
    { key: 'blocado', label: 'Blocado' },
    { key: 'embandejamento', label: 'Embandejamento' },
    { key: 'contagem', label: 'Estoque/Cont.' }
];

export function DailyOperationsPage() {
    // --- CSS EMBUTIDO ---
    const styles = `
    :root { --primary: #3b82f6; --bg-page: #f8fafc; --card-bg: #ffffff; --text-head: #1e293b; --text-body: #475569; --border: #e2e8f0; --safe: #dcfce7; --safe-text: #166534; --danger: #fee2e2; --danger-text: #991b1b; }
    body { background: var(--bg-page); font-family: 'Inter', sans-serif; color: var(--text-body); }
    .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header-title h1 { font-size: 24px; font-weight: 800; color: var(--text-head); margin: 0;letter-spacing: -0.5px; }
    .header-title span { font-size: 14px; font-weight: 500; color: #94a3b8; }
    .header-actions { display: flex; gap: 10px; }
    .btn-icon { background: white; border: 1px solid var(--border); padding: 8px; border-radius: 8px; cursor: pointer; color: #64748b; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; color: var(--primary); transform: rotate(15deg); }

    /* CARDS */
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    
    /* BLOCO A: STAFF */
    .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-bottom: 40px; }
    .staff-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .staff-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .staff-info h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-head); }
    .staff-meta { font-size: 12px; color: #94a3b8; }
    
    .staff-input-group { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .staff-input { width: 60px; padding: 6px; text-align: center; border: 1px solid var(--border); border-radius: 6px; font-weight: 700; color: var(--text-head); background: #f8fafc; }
    .staff-input:focus { border-color: var(--primary); outline: none; background: white; }
    .badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 20px; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
    .badge-safe { background: var(--safe); color: var(--safe-text); }
    .badge-danger { background: var(--danger); color: var(--danger-text); }

    /* BLOCO B: LOGÍSTICA */
    .logistics-container { background: white; border-radius: 16px; padding: 25px; border: 1px solid var(--border); margin-bottom: 40px; }
    .logistics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
    .kpi-box { display: flex; flex-direction: column; gap: 8px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #64748b; }
    .kpi-input-wrapper { display: flex; align-items: center; gap: 10px; }
    .kpi-input-lg { font-size: 20px; font-weight: 700; width: 100%; border: none; border-bottom: 2px solid var(--border); padding: 5px 0; color: var(--text-head); outline: none; transition: border 0.2s; background: transparent; }
    .kpi-input-lg:focus { border-color: var(--primary); }
    .kpi-target { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .alert-tag { font-size: 11px; color: #ef4444; font-weight: 700; background: #fef2f2; padding: 2px 8px; border-radius: 4px; }

    /* BLOCO C: CHECKOUT */
    .checkout-container { background: #1e293b; color: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; }
    .checkout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
    .leader-report-area { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 15px; font-family: inherit; resize: vertical; min-height: 100px; }
    .leader-report-area:focus { outline: none; border-color: rgba(255,255,255,0.3); }
    .rating-box { display: flex; gap: 5px; justify-content: center; margin: 15px 0; }
    .star-btn { background: none; border: none; cursor: pointer; transition: transform 0.2s; }
    .star-btn:hover { transform: scale(1.2); }
    
    .btn-finish { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: all 0.2s; }
    .btn-finish:hover { transform: translateY(-2px); box-shadow: 0 10px 15px rgba(0,0,0,0.3); }

    @media (max-width: 768px) { .staff-grid, .logistics-grid, .checkout-grid { grid-template-columns: 1fr; } }
    `;

    // --- ESTADOS ---
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [currentShift, setCurrentShift] = useState('manha');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // [NEW] Data selecionada
    // Armazena todas as metas carregadas do settings
    const [allTargets, setAllTargets] = useState({});
    const [closedReports, setClosedReports] = useState([]); // [NEW] Lista de fechados

    // Estado do Dia "Real"
    const [dailyData, setDailyData] = useState({
        staff_real: {},
        tonelagem: '',
        hora_chegada: '',
        hora_saida: '',
        relatorio_lider: '',
        rating: 0,
        status: 'open' // [NEW] Status: open | closed
    });

    // DocID dinâmico: Data + Turno
    const docId = `${selectedDate}_${currentShift}`;

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        carregarMetas();
        carregarFechados(); // Carrega histórico de fechamentos
    }, []);

    // Listener de dados reais (mudança de turno ou data aciona novo listener)
    useEffect(() => {
        // Reset visual ao trocar de turno/data para evitar "piscar" dados antigos
        setDailyData({
            staff_real: {}, tonelagem: '', hora_chegada: '', hora_saida: '', relatorio_lider: '', rating: 0, status: 'open'
        });

        const unsub = onSnapshot(doc(db, "daily_operations", docId), (docSnap) => {
            if (docSnap.exists()) {
                setDailyData(prev => ({ ...prev, ...docSnap.data() }));
            }
        });
        return () => unsub();
    }, [docId]);

    const carregarFechados = async () => {
        try {
            const q = query(
                collection(db, "daily_operations"),
                where("status", "==", "closed")
            );
            const snap = await getDocs(q);
            const reports = [];
            snap.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));
            // Ordenação Client-Side
            reports.sort((a, b) => b.date > a.date ? 1 : -1);
            setClosedReports(reports);
        } catch (e) {
            console.error("Erro ao carregar fechados:", e);
        }
    };

    const carregarMetas = async () => {
        const docRef = doc(db, "settings", "operational_targets");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            setAllTargets(snap.data());
        }
    };

    // Seleciona as metas do turno atual (com fallback para objeto vazio se não configurado)
    const targets = allTargets[currentShift] || {};

    // --- PERSISTÊNCIA AUTOMÁTICA (AUTO-SAVE) ---
    const updateField = async (field, value, nestedKey = null) => {
        if (dailyData.status === 'closed') return; // Bloqueia edição se fechado

        let newData = { ...dailyData };

        if (nestedKey) {
            newData[field] = { ...newData[field], [nestedKey]: value };
        } else {
            newData[field] = value;
        }

        // Atualiza estado local para UI instantânea
        setDailyData(newData);
    };

    // Botão "Atualizar" (Salvar Manualmente s/ Fechar)
    const handleUpdate = async () => {
        try {
            // [NEW] CALCULAR STAFF EFETIVO (Snapshot do momento)
            const staffEffective = {};
            SECTORS_CONFIG.forEach(sec => {
                const meta = targets[sec.key] || 0;
                const faltas = parseInt(dailyData.staff_real?.[sec.key]) || 0;
                staffEffective[sec.key] = Math.max(0, meta - faltas);
            });

            await setDoc(doc(db, "daily_operations", docId), {
                ...dailyData,
                staff_effective: staffEffective, // [NEW] Salva o calculado
                targets_snapshot: targets, // [NEW] Salva as metas do dia
                updatedAt: serverTimestamp(),
                shift: currentShift,
                date: selectedDate
            }, { merge: true });
            alert("Dados atualizados com sucesso!");
        } catch (e) {
            console.error("Erro ao salvar:", e);
            alert("Erro ao salvar.");
        }
    };

    const handleFinishDay = async () => {
        if (!dailyData.relatorio_lider) {
            alert("Por favor, preencha o Relatório do Líder antes de encerrar.");
            return;
        }

        try {
            // 1. Cria um registro no Histórico (Coleção de PDCAs) para consulta futura
            const historicoData = {
                codigo: `TURNO-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '')}-${currentShift.toUpperCase().substring(0, 3)}`,
                titulo: `Fechamento de Turno - ${currentShift.toUpperCase()}`,
                situacao: 'concluido', // Para aparecer na aba Concluídos/Histórico
                status: 'Concluído',
                criadoEm: new Date().toISOString(),
                concluidoEm: new Date().toISOString(),
                plan: {
                    area: 'Operações',
                    priority: 'Rotina',
                    responsavel: 'Líder de Turno',
                    problema: dailyData.relatorio_lider, // O relatório entra como "Problema/Descrição"
                    causas: `Avaliação: ${dailyData.rating} Estrelas | Tonelagem: ${dailyData.tonelagem}kg`,
                    planoAcao: 'Registro de rotina diária.',
                    meta: 'Cumprimento de indicadores diários.'
                }
            };

            await addDoc(collection(db, "pdcas"), historicoData);
            alert(`Turno encerrado e salvo no Histórico com Sucesso!`);

        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Erro ao finalizar turno.");
        }
    };

    // --- CÁLCULOS VISUAIS ---
    const getStaffStatus = (sectorKey) => {
        const meta = targets[sectorKey] || 0;
        const real = dailyData.staff_real?.[sectorKey] ?? meta; // Se não preencheu, assume meta (ou 0?) Melhor assumir 0 se for input vazio.
        // Mas para UX, input vazio = placeholder. O valor real numérico deve ser tratado.
        const realVal = real === '' ? 0 : parseInt(real);

        if (meta === 0) return { status: 'neutral', diff: 0 };
        if (realVal >= meta) return { status: 'safe', diff: realVal - meta };
        return { status: 'danger', diff: realVal - meta };
    };

    const checkTimeDelay = (realTime, targetTime) => {
        if (!realTime || !targetTime) return false;
        return realTime > targetTime;
    };

    return (
        <div className="page-container">
            <style>{styles}</style>

            {/* HEADER */}
            <div className="header-bar">
                <div className="header-title">
                    <h1>Espelho Operacional</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                        {/* SELETOR DE DATA */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>DATA</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{
                                    padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                    fontSize: '14px', fontWeight: 600, color: '#475569'
                                }}
                            />
                        </div>

                        {/* SELETOR DE TURNO */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>TURNO</label>
                            <div style={{ background: '#e2e8f0', padding: '2px', borderRadius: '6px', display: 'flex', gap: '2px' }}>
                                {SHIFTS.map(s => (
                                    <button
                                        key={s.key}
                                        onClick={() => setCurrentShift(s.key)}
                                        style={{
                                            border: 'none', background: currentShift === s.key ? 'white' : 'transparent',
                                            padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 700,
                                            color: currentShift === s.key ? '#3b82f6' : '#64748b', cursor: 'pointer',
                                            boxShadow: currentShift === s.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {dailyData.status === 'closed' && (
                            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '12px', border: '1px solid #fecaca' }}>
                                🔒 FECHADO
                            </div>
                        )}
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-icon" onClick={() => setSettingsModalOpen(true)} title="Configurar Metas">
                        <IconGear />
                    </button>
                </div>
            </div>

            {/* BLOCO A: SAÚDE DAS EQUIPES */}
            <div>
                <div className="section-title" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏢 Bloco A: Saúde das Equipes (Meta vs Real)
                    </div>
                    <div style={{ fontSize: '12px', background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', color: '#475569' }}>
                        <span style={{ marginRight: '10px' }}>META TOTAL: <b>{targets.totalHeadcount || 0}</b></span>
                        {/* REAL = META TOTAL - SOMA DAS FALTAS */}
                        <span>REAL: <b>{(targets.totalHeadcount || 0) - Object.values(dailyData.staff_real || {}).reduce((acc, val) => acc + (parseInt(val) || 0), 0)}</b></span>
                    </div>
                </div>
                <div className="staff-grid">
                    {SECTORS_CONFIG.map(sector => {
                        // LOGICA DE FALTAS
                        const meta = targets[sector.key] || 0;
                        const faltas = dailyData.staff_real?.[sector.key] ? parseInt(dailyData.staff_real[sector.key]) : 0;
                        const realVal = meta - faltas;

                        // Status: Se faltas > 0 -> Danger. Se faltas == 0 -> Safe.
                        const status = faltas > 0 ? 'danger' : 'safe';

                        return (
                            <div key={sector.key} className="staff-card" style={{
                                borderLeft: `4px solid ${status === 'safe' ? '#16a34a' : '#ef4444'}`
                            }}>
                                <div className="staff-info">
                                    <h3>{sector.label}</h3>
                                    <div className="staff-meta">Meta Ideal: <b>{meta}</b> pessoas</div>
                                </div>
                                <div className="staff-input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>FALTAS:</span>
                                        <input
                                            type="number"
                                            className="staff-input"
                                            value={dailyData.staff_real?.[sector.key] || ''}
                                            onChange={(e) => updateField('staff_real', e.target.value, sector.key)}
                                            placeholder="0"
                                            style={{ color: faltas > 0 ? '#ef4444' : 'inherit', borderColor: faltas > 0 ? '#ef4444' : '#e2e8f0' }}
                                        />
                                    </div>
                                    {status === 'safe' && <div className="badge badge-safe"><IconCheckSafe /> COMPLETO</div>}
                                    {status === 'danger' && <div className="badge badge-danger"><IconWarning /> -{faltas} Pessoas</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BLOCO B: LOGÍSTICA PESADA */}
            <div>
                <div className="section-title">
                    🚛 Bloco B: Logística Pesada
                </div>
                <div className="logistics-container">
                    <div className="logistics-grid">

                        {/* TONELAGEM */}
                        <div className="kpi-box">
                            <label className="kpi-label">Tonelagem Total (kg)</label>
                            <div className="kpi-input-wrapper">
                                <input
                                    type="number"
                                    className="kpi-input-lg"
                                    placeholder="0"
                                    value={dailyData.tonelagem}
                                    onChange={(e) => updateField('tonelagem', e.target.value)}
                                />
                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>kg</span>
                            </div>
                            <div className="kpi-target">Previsão: Acima de 30k é Crítico</div>
                        </div>

                        {/* CHEGADA */}
                        <div className="kpi-box">
                            <label className="kpi-label">Horário Chegada Mercadoria</label>
                            <input
                                type="time"
                                className="kpi-input-lg"
                                value={dailyData.hora_chegada}
                                onChange={(e) => updateField('hora_chegada', e.target.value)}
                            />
                            <div className="kpi-target">Meta: {targets.meta_chegada || '--:--'}</div>
                            {checkTimeDelay(dailyData.hora_chegada, targets.meta_chegada) &&
                                <span className="alert-tag">⚠️ Chegada Tardia</span>
                            }
                        </div>

                        {/* SAÍDA */}
                        <div className="kpi-box">
                            <label className="kpi-label">Horário Saída Caminhão</label>
                            <input
                                type="time"
                                className="kpi-input-lg"
                                value={dailyData.hora_saida}
                                onChange={(e) => updateField('hora_saida', e.target.value)}
                                style={{ color: checkTimeDelay(dailyData.hora_saida, targets.meta_saida) ? '#dc2626' : 'inherit' }}
                            />
                            <div className="kpi-target">Meta: {targets.meta_saida || '--:--'}</div>
                            {checkTimeDelay(dailyData.hora_saida, targets.meta_saida) &&
                                <span className="alert-tag">⚠️ ATRASO DETECTADO</span>
                            }
                        </div>

                    </div>
                </div>
            </div>

            {/* BLOCO C: CHECKOUT DO LÍDER */}
            <div>
                <div className="section-title">
                    ⭐ Bloco C: Encerramento do Turno
                </div>
                <div className="checkout-container">
                    <div className="checkout-grid">
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#94a3b8' }}>Relatório do Líder (Ocorrências, Destaques, Justificativas)</label>
                            <textarea
                                className="leader-report-area"
                                placeholder="Descreva aqui o resumo do turno..."
                                value={dailyData.relatorio_lider}
                                onChange={(e) => updateField('relatorio_lider', e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center' }}>
                                <label style={{ fontWeight: 600, color: '#94a3b8' }}>Avaliação do Turno</label>
                                <div className="rating-box">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} className="star-btn" onClick={() => updateField('rating', star)}>
                                            <IconStar fill={star <= (dailyData.rating || 0)} />
                                        </button>
                                    ))}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {dailyData.rating === 5 ? "Operação Perfeita!" : dailyData.rating === 1 ? "Caos Total" : "Avalie o dia"}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {dailyData.status !== 'closed' ? (
                                    <>
                                        <button className="btn-finish" style={{ background: '#3b82f6' }} onClick={handleUpdate}>
                                            🔄 ATUALIZAR
                                        </button>
                                        <button className="btn-finish" onClick={handleFinishDay}>
                                            ✅ ENCERRAR O DIA
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                        Este turno foi encerrado.
                                        <button
                                            onClick={() => updateField('status', 'open')}
                                            style={{ display: 'block', margin: '5px auto', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                                        >
                                            Reabrir Turno (Admin)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HISTÓRICO DE FECHADOS */}
            {closedReports.length > 0 && (
                <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h3 style={{ color: '#475569', fontSize: '16px', marginBottom: '15px' }}>📂 Últimos Fechamentos</h3>
                    <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {closedReports.map(rep => (
                            <div
                                key={rep.id}
                                onClick={() => { setSelectedDate(rep.date); setCurrentShift(rep.shift); window.scrollTo(0, 0); }}
                                style={{
                                    background: 'white', padding: '15px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                                    {new Date(rep.date).toLocaleDateString()}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: '4px 0' }}>
                                    {rep.shift.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                                    {rep.tonelagem} kg • {rep.rating} ★
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL DE SETTINGS */}
            {settingsModalOpen && (
                <OperationalSettingsModal
                    onClose={() => setSettingsModalOpen(false)}
                    onSave={carregarMetas}
                />
            )}

        </div>
    );
}
