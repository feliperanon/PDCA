import React, { useState, useEffect, useMemo } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    addDoc,
    limit
} from "firebase/firestore";
import { db } from "../firebase";

import { OperationalSettingsModal } from "../components/OperationalSettingsModal";

const SHIFTS = [
    { key: 'manha', label: 'Manhã' },
    { key: 'tarde', label: 'Tarde' },
    { key: 'noite', label: 'Noite' }
];

// --- ICONS ---
const IconGear = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconCheckSafe = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconWarning = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const IconStar = ({ fill }) => <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? "#eab308" : "none"} stroke={fill ? "#eab308" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconAbsence = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconPresent = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconSick = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2v2"></path><path d="M5 2v2"></path><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path><path d="M8 15a6 6 0 0 0 12 0v-3"></path><circle cx="20" cy="10" r="2"></circle></svg>;
const IconVacation = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>;
const IconAway = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconAlertTriangle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconSave = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;

const SECTORS_CONFIG = [
    { key: 'recebimento', label: 'Recebimento' },
    { key: 'expedicao', label: 'Expedição' },
    { key: 'camara_fria', label: 'Câmara Fria' },
    { key: 'selecao', label: 'Seleção' },
    { key: 'blocado', label: 'Blocado' },
    { key: 'embandejamento', label: 'Embandejamento' },
    { key: 'contagem', label: 'Estoque/Cont.' }
];

// --- NEW COMPONENTS ---
const RoutineStatusCards = ({ dailyData, targets, currentShift }) => {
    // 1. HEADCOUNT
    let totalPresent = 0;
    let totalMeta = 0;

    // Iterate sectors to sum Meta vs Present
    SECTORS_CONFIG.forEach(sec => {
        const meta = targets[sec.key] || 0;
        totalMeta += meta;

        const logEntries = Object.entries(dailyData.attendance_log || {})
            .filter(([_, entry]) => entry.sector === sec.key);

        const present = logEntries.reduce((acc, [_, entry]) => {
            return (!entry.status || entry.status === 'present') ? acc + 1 : acc;
        }, 0);
        totalPresent += present;
    });

    const gap = totalPresent - totalMeta;
    const isDeficit = gap < 0;
    const isSurplus = gap > 0;

    return (
        <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>Analise de Turno - {currentShift.toUpperCase()}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                {/* CARD 1: HEADCOUNT TOTAL */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Equipe Total
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{totalPresent}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>/ {totalMeta} Meta</span>
                        </div>
                        {isDeficit ? (
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                                {gap} Pessoas
                            </div>
                        ) : isSurplus ? (
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                +{gap} Extra
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                                Ok
                            </div>
                        )}
                    </div>
                </div>

                {/* CARD 2: TONELAGEM PREVIA */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Produção (Kg)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
                                {dailyData.tonelagem ? Number(dailyData.tonelagem).toLocaleString() : '0'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>kg</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function DailyOperationsPage() {
    // --- CSS ---
    const styles = `
    :root { --primary: #3b82f6; --bg-page: #f8fafc; --card-bg: #ffffff; --text-head: #1e293b; --text-body: #475569; --border: #e2e8f0; --safe: #dcfce7; --safe-text: #166534; --danger: #fee2e2; --danger-text: #991b1b; }
    body { background: var(--bg-page); font-family: 'Inter', sans-serif; color: var(--text-body); }
    .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header-title h1 { font-size: 24px; font-weight: 800; color: var(--text-head); margin: 0;letter-spacing: -0.5px; }
    
    /* CARDS */
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    
    .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-bottom: 40px; }
    .staff-card { cursor: pointer; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .staff-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-color: var(--primary); }
    .staff-info h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-head); }
    .staff-meta { font-size: 12px; color: #94a3b8; }
    
    .staff-input-group { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .staff-val { font-size: 18px; font-weight: 700; color: var(--text-head); }
    
    .logistics-container { background: white; border-radius: 16px; padding: 25px; border: 1px solid var(--border); margin-bottom: 40px; }
    .logistics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
    .kpi-box { display: flex; flex-direction: column; gap: 8px; }
    .kpi-label { font-size: 13px; font-weight: 600; color: #64748b; }
    .kpi-input-lg { font-size: 20px; font-weight: 700; width: 100%; border: none; border-bottom: 2px solid var(--border); padding: 5px 0; color: var(--text-head); outline: none; transition: border 0.2s; background: transparent; }
    .kpi-input-lg:focus { border-color: var(--primary); }
    .kpi-target { font-size: 12px; color: #94a3b8; font-weight: 500; }
    
    .checkout-container { background: #1e293b; color: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; }
    .leader-report-area { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; padding: 15px; font-family: inherit; resize: vertical; min-height: 100px; }
    .btn-finish { background: #16a34a; color: #ffffff; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: 800; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s; letter-spacing: 0.5px; }
    .btn-finish:hover { background: #15803d; }
    
    .btn-routine-save {
        position: fixed; bottom: 30px; right: 30px; 
        background: #3b82f6; color: white; 
        padding: 15px 25px; border-radius: 50px; 
        box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5); 
        border: none; font-weight: 700; font-size: 16px; 
        cursor: pointer; display: flex; align-items: center; gap: 10px; z-index: 100;
        transition: transform 0.2s;
    }
    .btn-routine-save:hover { transform: scale(1.05); }

    /* CHECK-IN MODAL SPLIT VIEW */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; justify-content: center; align-items: center; }
    .modal-content { background: white; width: 95%; max-width: 1000px; border-radius: 16px; padding: 20px; height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
    
    .modal-split-body { display: flex; gap: 20px; flex: 1; overflow: hidden; margin-top: 15px; }
    .split-col { flex: 1; display: flex; flex-direction: column; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    
    .col-header { padding: 15px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .col-title { font-size: 14px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px; }
    
    .col-list { flex: 1; overflow-y: auto; padding: 10px; }
    
    .emp-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s; }
    .emp-card:hover { border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
    .emp-main { display: flex; justify-content: space-between; align-items: center; }
    .emp-name { font-size: 13px; font-weight: 600; color: #334155; }
    .emp-id { font-size: 11px; color: #94a3b8; }
    
    .btn-add { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px; }
    .btn-add:hover { background: #3b82f6; color: white; border-color: #3b82f6; }
    
    .status-actions { display: flex; gap: 5px; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #f1f5f9; }
    .status-icon-btn { flex: 1; border: 1px solid transparent; background: transparent; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #cbd5e1; transition: all 0.2s; }
    .status-icon-btn:hover { background: #f1f5f9; color: #64748b; }
    
    .status-icon-btn.active.s-present { background: #dcfce7; color: #166534; border-color: #86efac; }
    .status-icon-btn.active.s-absent { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
    .status-icon-btn.active.s-sick { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
    .status-icon-btn.active.s-vacation { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
    .status-icon-btn.active.s-away { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
    
    .btn-remove { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; }
    .btn-remove:hover { background: #fee2e2; color: #ef4444; }

    .search-input { width: 100%; border: none; outline: none; font-size: 13px; background: transparent; }
    .search-box { display: flex; alignItems: center; gap: 8px; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%; }

    @media (max-width: 768px) { .modal-split-body { flex-direction: column; } .modal-content { height: 95vh; } }
    `;

    // --- STATES ---
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [currentShift, setCurrentShift] = useState('manha');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [allTargets, setAllTargets] = useState({});
    const [closedReports, setClosedReports] = useState([]);

    // --- DAILY DATA ---
    const [dailyData, setDailyData] = useState({
        staff_real: {},
        attendance_log: {}, // { matricula: { status: 'present', sector: 'key' } }
        tonelagem: '',
        hora_chegada: '',
        hora_saida: '',
        relatorio_lider: '',
        rating: 0,
        status: 'open'
    });

    // --- CHECK-IN STATES ---
    const [checkInSector, setCheckInSector] = useState(null);
    const [sectorEmployees, setSectorEmployees] = useState([]); // Default sector list
    const [filterText, setFilterText] = useState("");
    const [allEmployeesDB, setAllEmployeesDB] = useState([]); // Full Cache

    const docId = `${selectedDate}_${currentShift}`;

    // --- EFFECTS ---
    useEffect(() => {
        carregarMetas();
        carregarFechados();
    }, []);

    useEffect(() => {
        setDailyData({
            staff_real: {}, attendance_log: {}, tonelagem: '', hora_chegada: '', hora_saida: '', relatorio_lider: '', rating: 0, status: 'open'
        });
        const unsub = onSnapshot(doc(db, "daily_operations", docId), async (docSnap) => {
            if (docSnap.exists()) {
                setDailyData(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                // CARRY FORWARD LOGIC
                try {
                    const qPrev = query(
                        collection(db, "daily_operations"),
                        where("shift", "==", currentShift),
                        where("date", "<", selectedDate),
                        orderBy("date", "desc"),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(qPrev);
                    if (!querySnapshot.empty) {
                        const lastDoc = querySnapshot.docs[0].data();
                        if (lastDoc.attendance_log) {
                            setDailyData(prev => ({
                                ...prev,
                                attendance_log: lastDoc.attendance_log,
                                staff_real: lastDoc.staff_real || {}
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error carry forward:", err);
                }
            }
        });
        return () => unsub();
    }, [docId, selectedDate, currentShift]);

    const carregarFechados = async () => {
        const q = query(collection(db, "daily_operations"), where("status", "==", "closed"));
        const snap = await getDocs(q);
        const reports = [];
        snap.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));
        reports.sort((a, b) => b.date > a.date ? 1 : -1);
        setClosedReports(reports);
    };

    const carregarMetas = async () => {
        const docRef = doc(db, "settings", "operational_targets");
        const snap = await getDoc(docRef);
        if (snap.exists()) setAllTargets(snap.data());
    };

    const targets = allTargets[currentShift] || {};

    const updateField = async (field, value, nestedKey = null) => {
        if (dailyData.status === 'closed') return;
        let newData = { ...dailyData };
        if (nestedKey) newData[field] = { ...newData[field], [nestedKey]: value };
        else newData[field] = value;
        setDailyData(newData);
    };

    const handleUpdate = async () => {
        try {
            // 1. UPDATE DAILY OPERATION (The Source of Truth)
            await setDoc(doc(db, "daily_operations", docId), {
                ...dailyData,
                updatedAt: serverTimestamp(),
                shift: currentShift,
                date: selectedDate,
                // Ensure status is 'open' if not closed, to allow edits
                status: dailyData.status === 'closed' ? 'closed' : 'open'
            }, { merge: true });

            // 2. SYNC TO HISTORY (As 'Em Andamento' / 'In Progress')
            // Using a DETERMINISTIC ID based on Code to prevent duplicates in History
            if (dailyData.status !== 'closed') {
                const dateClean = selectedDate.replace(/-/g, '');
                const shiftCode = currentShift.toUpperCase().substring(0, 3);
                const pdcaId = `TURNO-${dateClean}-${shiftCode}`;

                // Helper to calc staff for sync
                const staffEffective = {};
                SECTORS_CONFIG.forEach(sec => {
                    const meta = targets[sec.key] || 0;
                    const faltas = parseInt(dailyData.staff_real?.[sec.key]) || 0;
                    staffEffective[sec.key] = Math.max(0, meta - faltas);
                });

                const snapshot = { dailyData, targets, staffEffective, efficiencyScore: 0 };

                const historicoData = {
                    id: pdcaId, // Explicit ID to prevent duplicates
                    codigo: pdcaId,
                    titulo: `Fechamento de Turno - ${currentShift.toUpperCase()}`,
                    situacao: 'Em Andamento', // Status visibly distinct
                    status: 'Em Andamento',
                    criadoEm: new Date().toISOString(),
                    // Modificado is updated
                    concluidoEm: null,
                    snapshot: snapshot,
                    plan: {
                        area: 'Operações', priority: 'Rotina', responsavel: 'Líder de Turno',
                        problema: dailyData.relatorio_lider || 'Preenchimento em andamento...',
                        causas: `Avaliação: ${dailyData.rating} Estrelas`,
                        planoAcao: 'Registro de rotina diária.',
                        meta: 'Cumprimento de indicadores diários.'
                    },
                    type: 'turno' // Tag it clearly
                };

                await setDoc(doc(db, "pdcas", pdcaId), historicoData, { merge: true });
            }

            alert("Rotina Salva e Sincronizada! 🔄");
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar.");
        }
    };

    const handleFinishDay = async () => {
        // 1. VALIDATION LOCK
        const missing = [];
        if (!dailyData.tonelagem) missing.push("Tonelagem");
        if (!dailyData.hora_chegada) missing.push("Hora Chegada");
        if (!dailyData.hora_saida) missing.push("Hora Saída");
        if (!dailyData.relatorio_lider) missing.push("Relatório do Líder");

        if (missing.length > 0) {
            alert(`⚠️ IMPOSSÍVEL ENCERRAR!\n\nPor favor preencha os dados obrigatórios:\n- ${missing.join('\n- ')}`);
            return;
        }

        if (!window.confirm("Confirma o encerramento do turno? Essa ação não pode ser desfeita e os dados serão congelados.")) return;

        try {
            // Update local status first
            const finalData = { ...dailyData, status: 'closed' };
            setDailyData(finalData);

            // 1. Close Daily Operation
            await setDoc(doc(db, "daily_operations", docId), {
                ...finalData,
                updatedAt: serverTimestamp(),
                shift: currentShift,
                date: selectedDate
            }, { merge: true });

            const staffEffective = {};
            SECTORS_CONFIG.forEach(sec => {
                const meta = targets[sec.key] || 0;
                const faltas = parseInt(dailyData.staff_real?.[sec.key]) || 0;
                staffEffective[sec.key] = Math.max(0, meta - faltas);
            });

            const snapshot = { dailyData: finalData, targets, staffEffective, efficiencyScore: 0 };

            // Generate STABLE ID again
            const dateClean = selectedDate.replace(/-/g, '');
            const shiftCode = currentShift.toUpperCase().substring(0, 3);
            const pdcaId = `TURNO-${dateClean}-${shiftCode}`;

            const historicoData = {
                id: pdcaId,
                codigo: pdcaId,
                titulo: `Fechamento de Turno - ${currentShift.toUpperCase()}`,
                situacao: 'Concluído',
                status: 'Concluído',
                criadoEm: new Date().toISOString(), // Keeps original if merge
                concluidoEm: new Date().toISOString(), // Now it's done
                snapshot: snapshot,
                plan: {
                    area: 'Operações', priority: 'Rotina', responsavel: 'Líder de Turno',
                    problema: dailyData.relatorio_lider,
                    causas: `Avaliação: ${dailyData.rating} Estrelas`,
                    planoAcao: 'Registro de rotina diária.',
                    meta: 'Cumprimento de indicadores diários.'
                },
                type: 'turno'
            };

            // UPSERT (Create or Update existing "Em Andamento")
            await setDoc(doc(db, "pdcas", pdcaId), historicoData, { merge: true });

            alert("Turno encerrado com sucesso! 🎉");
            carregarFechados(); // Refresh list if needed
        } catch (e) { console.error(e); alert("Erro ao encerrar."); }
    };

    // --- CHECK IN LOGIC ---
    const openCheckIn = async (sectorKey) => {
        if (dailyData.status === 'closed') return;
        setCheckInSector(sectorKey);
        setFilterText("");

        const snap = await getDocs(collection(db, "employees"));
        const all = snap.docs.map(d => d.data());
        setAllEmployeesDB(all);

        // Pre-calculate default sector list
        // Strategy: Default list shows ONLY current shift employees for this sector.
        const normalizedSectorLabel = removerAcentos(SECTORS_CONFIG.find(s => s.key === sectorKey)?.label || "").toLowerCase();

        const initial = all.filter(e => {
            const cc = removerAcentos(e.centroCusto || "").toLowerCase();
            // Match exact key or label partial
            return (cc.includes(sectorKey) || cc.includes(normalizedSectorLabel)) && e.status !== 'demitido';
        });

        // Filter by Current Shift for default view
        const currentShiftEmp = initial.filter(e => {
            const cc = removerAcentos(e.centroCusto || "").toLowerCase();
            return cc.includes(currentShift.toLowerCase());
        });

        // Use Current Shift if available, otherwise show all sector employees (fallback)
        setSectorEmployees(currentShiftEmp.length > 0 ? currentShiftEmp : initial);
    };

    // SPLIT VIEW DATA
    const { availableEmployees, activeEmployees } = useMemo(() => {
        if (!checkInSector) return { availableEmployees: [], activeEmployees: [] };

        // 1. ACTIVE: Everyone in the log for this sector
        const logEntries = Object.entries(dailyData.attendance_log || {})
            .filter(([_, entry]) => entry.sector === checkInSector);

        const activeIds = logEntries.map(([k]) => String(k)); // Force String for easy comparison

        const active = activeIds.map(id => {
            // Compare String(id) with String(matricula)
            const emp = allEmployeesDB.find(e => String(e.matricula) === id);
            return emp || { matricula: id, nome: 'Desconhecido', status: 'ativo' }; // Fallback
        });

        // 2. AVAILABLE: 
        let pool = filterText ? allEmployeesDB : sectorEmployees;

        // Apply text filter if searching
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            pool = pool.filter(e =>
                (e.nome || "").toLowerCase().includes(lowerFilter) ||
                String(e.matricula).includes(lowerFilter)
            );
        }

        // Exclude already active (String vs String comparison)
        const available = pool.filter(e => !activeIds.includes(String(e.matricula))).slice(0, 50);

        return { availableEmployees: available, activeEmployees: active };

    }, [checkInSector, filterText, dailyData.attendance_log, allEmployeesDB, sectorEmployees]);


    const addEmployee = (matricula) => {
        // Default to 'present' when adding
        updateAttendanceLog(matricula, 'present');
    };

    const removeEmployee = (matricula) => {
        const newLog = { ...dailyData.attendance_log };
        delete newLog[matricula];

        const faltasCount = calculateFaltas(newLog);
        setDailyData({ ...dailyData, attendance_log: newLog, staff_real: { ...dailyData.staff_real, [checkInSector]: faltasCount } });
    };

    const updateAttendanceLog = (matricula, status) => {
        const newLogEntry = { status, sector: checkInSector };
        const newLog = { ...dailyData.attendance_log, [matricula]: newLogEntry }; // Overwrite if exists, add if new

        const faltasCount = calculateFaltas(newLog);
        setDailyData({ ...dailyData, attendance_log: newLog, staff_real: { ...dailyData.staff_real, [checkInSector]: faltasCount } });
    };

    const calculateFaltas = (log) => {
        let count = 0;
        Object.values(log).forEach(entry => {
            if (entry.sector === checkInSector && entry.status === 'absent') count++;
        });
        return count;
    }

    return (
        <div className="page-container">
            <style>{styles}</style>

            <div className="header-bar">
                <div className="header-title">
                    <h1>Espelho Operacional</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#475569' }} />
                        <div style={{ background: '#e2e8f0', padding: '2px', borderRadius: '6px', display: 'flex', gap: '2px' }}>
                            {SHIFTS.map(s => (
                                <button key={s.key} onClick={() => setCurrentShift(s.key)} style={{ border: 'none', background: currentShift === s.key ? 'white' : 'transparent', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 700, color: currentShift === s.key ? '#3b82f6' : '#64748b', cursor: 'pointer', boxShadow: currentShift === s.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-icon" onClick={() => setSettingsModalOpen(true)} title="Configurar Metas"><IconGear /></button>
                </div>
            </div>

            {/* FLOATING SAVE BUTTON */}
            {dailyData.status !== 'closed' && (
                <button className="btn-routine-save" onClick={handleUpdate}>
                    <IconSave /> SALVAR ROTINA
                </button>
            )}

            {/* ROUTINE STATUS */}
            <RoutineStatusCards dailyData={dailyData} targets={targets} currentShift={currentShift} />

            <div className="section-title">🏢 Bloco A: Saúde das Equipes (Gerenciar Presença)</div>
            <div className="staff-grid">
                {SECTORS_CONFIG.map(sector => {
                    const meta = targets[sector.key] || 0;

                    // Calculate Present (Effective) Count
                    // We need to iterate the log for this sector
                    const logEntries = Object.entries(dailyData.attendance_log || {})
                        .filter(([_, entry]) => entry.sector === sector.key);

                    const presentCount = logEntries.reduce((acc, [_, entry]) => {
                        const s = entry.status;
                        return (!s || s === 'present') ? acc + 1 : acc;
                    }, 0);

                    // Logic: If Meta > 0, we check if we met the target.
                    // Deficit = Meta - Present.
                    // If Meta is 0, we assume it's valid (or no target set), but if there are absences explicitly marked, we can show them?
                    // User request: "1 active, 1 vacation. Not complete." -> Implies Meta is higher (e.g. 2).
                    // Or implies that simply having someone OUT makes it incomplete?
                    // Let's stick to "Meta" as the truth. Check if user set Meta.

                    const deficit = Math.max(0, meta - presentCount);
                    const isComplete = deficit === 0;

                    // Also count explicit "Faltas" for display if needed, but "Deficit" is more accurate for "Completeness"
                    // If we don't have a Meta set (0), maybe fallback to "Anyone Absent?"
                    // BUT user has "Meta: 2" (implied).

                    return (
                        <div key={sector.key} className="staff-card" onClick={() => openCheckIn(sector.key)} style={{ borderLeft: `4px solid ${isComplete ? '#16a34a' : '#ef4444'}` }}>
                            <div className="staff-info">
                                <h3>{sector.label}</h3>
                                <div className="staff-meta">Meta: <b>{meta}</b> | Real: <b>{presentCount}</b></div>
                            </div>
                            <div className="staff-input-group">
                                {!isComplete ? (
                                    <div className="staff-val" style={{ color: '#ef4444' }}>
                                        -{deficit} Pessoas
                                    </div>
                                ) : (
                                    <div className="staff-val" style={{ color: '#16a34a', fontSize: '14px' }}>COMPLETO</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="section-title">🚛 Bloco B: Logística Pesada</div>
            <div className="logistics-container">
                <div className="logistics-grid">
                    <div className="kpi-box">
                        <label className="kpi-label">Tonelagem</label>
                        <input type="number" className="kpi-input-lg" value={dailyData.tonelagem} onChange={e => updateField('tonelagem', e.target.value)} />
                    </div>
                    <div className="kpi-box">
                        <label className="kpi-label">Chegada</label>
                        <input type="time" className="kpi-input-lg" value={dailyData.hora_chegada} onChange={e => updateField('hora_chegada', e.target.value)} />
                    </div>
                    <div className="kpi-box">
                        <label className="kpi-label">Saída</label>
                        <input type="time" className="kpi-input-lg" value={dailyData.hora_saida} onChange={e => updateField('hora_saida', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="section-title">⭐ Bloco C: Encerramento</div>
            <div className="checkout-container">
                <textarea className="leader-report-area" value={dailyData.relatorio_lider} onChange={e => updateField('relatorio_lider', e.target.value)} placeholder="Resumo do dia..." />
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button className="btn-finish" onClick={handleFinishDay}>ENCERRAR DIÁRIO</button>
                </div>
            </div>

            {/* MODAL CHECK-IN */}
            {checkInSector && (
                <div className="modal-overlay" onClick={() => setCheckInSector(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Chamada: {SECTORS_CONFIG.find(s => s.key === checkInSector)?.label}</h3>
                            <button onClick={() => setCheckInSector(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Fechar</button>
                        </div>

                        <div className="modal-split-body">
                            {/* LEFT: AVAILABLE */}
                            <div className="split-col">
                                <div className="col-header">
                                    <div className="col-title"><IconSearch /> Banco / Adicionar</div>
                                </div>
                                <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div className="search-box">
                                        <input
                                            className="search-input"
                                            placeholder="Buscar nome ou matrícula..."
                                            value={filterText}
                                            autoFocus
                                            onChange={e => setFilterText(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-list">
                                    {availableEmployees.map(emp => {
                                        const empShift = ((emp.centroCusto || "").toLowerCase().match(/manha|tarde|noite/) || ['outros'])[0];
                                        const isWrongShift = empShift !== 'outros' && empShift !== currentShift;

                                        // Lock logic
                                        const lockEntry = dailyData.attendance_log?.[emp.matricula];
                                        const isLocked = lockEntry && lockEntry.sector !== checkInSector;
                                        const lockedSectorName = isLocked ? SECTORS_CONFIG.find(s => s.key === lockEntry.sector)?.label : '';

                                        return (
                                            <div key={emp.matricula} className="emp-card" style={isLocked ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                                <div className="emp-main">
                                                    <div>
                                                        <div className="emp-name">{emp.nome}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <div className="emp-id">{emp.matricula}</div>
                                                            {isWrongShift && <div style={{ fontSize: '10px', color: '#d97706', background: '#fffbeb', padding: '0 4px', borderRadius: '4px' }}>Turno {empShift}</div>}
                                                            {isLocked && <div style={{ fontSize: '10px', color: '#ef4444', background: '#fee2e2', padding: '0 4px', borderRadius: '4px' }}>Em: {lockedSectorName}</div>}
                                                        </div>
                                                    </div>
                                                    {!isLocked && (
                                                        <button className="btn-add" onClick={() => addEmployee(emp.matricula)}>
                                                            <IconCheckSafe /> Incluir
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {availableEmployees.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>Ninguém disponível encontrado.</div>}
                                </div>
                            </div>

                            {/* RIGHT: ACTIVE */}
                            <div className="split-col">
                                <div className="col-header">
                                    {(() => {
                                        const presentCount = activeEmployees.reduce((acc, emp) => {
                                            const s = dailyData.attendance_log?.[emp.matricula]?.status;
                                            return (!s || s === 'present') ? acc + 1 : acc;
                                        }, 0);

                                        return (
                                            <div className="col-title" style={{ color: '#166534' }}>
                                                <IconPresent /> Equipe Presente ({presentCount})
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginLeft: '5px' }}>
                                                    / Total: {activeEmployees.length}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="col-list">
                                    {activeEmployees.length === 0 && (
                                        <div style={{ padding: '30px', textAlign: 'center', color: '#cbd5e1' }}>
                                            <div style={{ marginBottom: '10px' }}><IconPresent /></div>
                                            Adicione colaboradores da lista ao lado.
                                        </div>
                                    )}
                                    {activeEmployees.map(emp => {
                                        const logEntry = dailyData.attendance_log?.[emp.matricula];
                                        const status = logEntry?.status || 'present';

                                        return (
                                            <div key={emp.matricula} className="emp-card" style={{ borderColor: status === 'present' ? '#16a34a' : status === 'absent' ? '#ef4444' : '#e2e8f0' }}>
                                                <div className="emp-main">
                                                    <div>
                                                        <div className="emp-name">{emp.nome}</div>
                                                        <div className="emp-id">{emp.matricula}</div>
                                                    </div>
                                                    <button className="btn-remove" onClick={() => removeEmployee(emp.matricula)} title="Remover da Rotina">✕</button>
                                                </div>
                                                <div className="status-actions">
                                                    <button className={`status-icon-btn s-present ${status === 'present' ? 'active' : ''}`} onClick={() => updateAttendanceLog(emp.matricula, 'present')} title="Presente"><IconPresent /></button>
                                                    <button className={`status-icon-btn s-absent ${status === 'absent' ? 'active' : ''}`} onClick={() => updateAttendanceLog(emp.matricula, 'absent')} title="Falta"><IconAbsence /></button>
                                                    <button className={`status-icon-btn s-sick ${status === 'sick' ? 'active' : ''}`} onClick={() => updateAttendanceLog(emp.matricula, 'sick')} title="Atestado"><IconSick /></button>
                                                    <button className={`status-icon-btn s-vacation ${status === 'vacation' ? 'active' : ''}`} onClick={() => updateAttendanceLog(emp.matricula, 'vacation')} title="Férias"><IconVacation /></button>
                                                    <button className={`status-icon-btn s-away ${status === 'away' ? 'active' : ''}`} onClick={() => updateAttendanceLog(emp.matricula, 'away')} title="Afastado"><IconAway /></button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {settingsModalOpen && <OperationalSettingsModal onClose={() => setSettingsModalOpen(false)} onSave={carregarMetas} />}
        </div>
    );
}


