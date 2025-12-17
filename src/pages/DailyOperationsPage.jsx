import { useLocation } from 'react-router-dom';
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
    // 1. HEADCOUNT & BREAKDOWN
    let totalPresent = 0;
    let totalMeta = 0;
    let totalSick = 0;
    let totalVacation = 0;
    let totalAbsent = 0;
    let totalAway = 0;
    let totalVacancies = 0; // NEW: Structural vacancies

    // Iterate sectors to sum counts
    SECTORS_CONFIG.forEach(sec => {
        const meta = targets[sec.key] || 0;
        totalMeta += meta;

        const logEntries = Object.entries(dailyData.attendance_log || {})
            .filter(([_, entry]) => entry.sector === sec.key);

        const currentStaffCount = logEntries.length;
        const deficit = Math.max(0, meta - currentStaffCount);
        totalVacancies += deficit;

        logEntries.forEach(([_, entry]) => {
            const s = entry.status || 'present';
            if (s === 'present') totalPresent++;
            else if (s === 'sick') totalSick++;
            else if (s === 'vacation') totalVacation++;
            else if (s === 'absent') totalAbsent++;
            else if (s === 'away') totalAway++;
        });
    });

    // Gap calculation (vs Meta)
    // "Real" force is distinct from "Present". Usually Headcount = Present.
    // Gap depends on how we define it. (Meta - Present)
    const gap = totalPresent - totalMeta;
    const isDeficit = gap < 0;

    return (
        <div style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resumo Operacional
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                {/* CARD 1: PRESENTES (MAIN) */}
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase' }}>Presentes / Ideal</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0c4a6e' }}>
                        {totalPresent} <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 600 }}>/ {totalMeta}</span>
                    </div>
                </div>

                {/* CARD 2: CONTRATAR (NEW) */}
                <div style={{ background: totalVacancies > 0 ? '#fef2f2' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${totalVacancies > 0 ? '#fee2e2' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: totalVacancies > 0 ? '#b91c1c' : '#64748b', textTransform: 'uppercase' }}>
                        {totalVacancies > 0 ? 'Contratar' : 'Vagas'}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: totalVacancies > 0 ? '#991b1b' : '#94a3b8' }}>
                        {totalVacancies > 0 ? `-${totalVacancies}` : '0'}
                    </div>
                </div>

                {/* CARD 3: FALTAS */}
                <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '8px', border: '1px solid #ffe4e6' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#be123c', textTransform: 'uppercase' }}>Faltas</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#9f1239' }}>{totalAbsent}</div>
                </div>

                {/* CARD 4: FÉRIAS */}
                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase' }}>Férias</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400e' }}>{totalVacation}</div>
                </div>

                {/* CARD 5: ATESTADOS */}
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' }}>Atestados</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>{totalSick}</div>
                </div>

                {/* CARD 6: PRODUÇÃO */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Produção</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>
                        {dailyData.tonelagem ? Number(dailyData.tonelagem).toLocaleString() : '0'} <span style={{ fontSize: '10px' }}>kg</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function DailyOperationsPage() {
    // --- CSS ---
    // --- CSS ---
    const styles = `
    :root { --primary: #3b82f6; --bg-page: #f8fafc; --card-bg: #ffffff; --text-head: #334155; --text-body: #64748b; --border: #e2e8f0; --safe: #dcfce7; --safe-text: #166534; --danger: #fee2e2; --danger-text: #991b1b; }
    body { background: var(--bg-page); font-family: 'Inter', sans-serif; color: var(--text-body); font-size: 13px; }
    .page-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header-title h1 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    
    /* CARDS */
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; margin-top: 25px; }
    
    .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .staff-card { cursor: pointer; background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .staff-card:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-color: var(--primary); }
    .staff-info h3 { margin: 0; font-size: 13px; font-weight: 600; color: #1e293b; }
    .staff-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    
    .staff-input-group { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .staff-val { font-size: 13px; font-weight: 600; color: var(--text-head); }
    
    /* UNIFIED CLOSING SECTION */
    .closing-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 40px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1.5fr;
        gap: 15px;
        align-items: stretch;
    }
    @media (max-width: 900px) { .closing-section { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .closing-section { grid-template-columns: 1fr; } }

    .closing-box { display: flex; flex-direction: column; gap: 6px; }
    .kpi-label-sm { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .kpi-input-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0; 
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 13px;
        font-weight: 500;
        color: #1e293b;
        width: 100%;
        outline: none;
        transition: all 0.2s;
    }
    .kpi-input-box:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); background: white; }

    .report-area-sm {
        flex: 1;
        min-height: 80px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px;
        font-size: 13px;
        resize: none;
        background: #f8fafc;
        font-family: inherit;
        color: #334155;
    }
    .report-area-sm:focus { background: white; border-color: #3b82f6; outline: none; }

    .btn-finish-sm {
        background: #16a34a;
        color: white;
        border: none;
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s;
        margin-top: auto;
    }
    .btn-finish-sm:hover { background: #15803d; transform: translateY(-1px); }
    
    .btn-routine-save {
        position: fixed; bottom: 30px; right: 30px; 
        background: #3b82f6; color: white; 
        padding: 12px 20px; border-radius: 50px; 
        box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5); 
        border: none; font-weight: 700; font-size: 14px; 
        cursor: pointer; display: flex; align-items: center; gap: 8px; z-index: 100;
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
    // --- ROUTER STATE (FOR EDIT MODE) ---
    const location = useLocation();
    const routerState = location.state || {};


    const [currentShift, setCurrentShift] = useState(routerState.shift || 'manha');
    const [selectedDate, setSelectedDate] = useState(routerState.date || new Date().toISOString().split('T')[0]);
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

    // --- HELPERS ---
    // Helper to find previous valid roster without demanding Index creation
    const findPreviousRoster = async () => {
        // Try up to 7 days back
        let checkDate = new Date(selectedDate);
        for (let i = 1; i <= 10; i++) {
            checkDate.setDate(checkDate.getDate() - 1);
            const dateStr = checkDate.toISOString().split('T')[0];
            const prevDocId = `${dateStr}_${currentShift}`;

            try {
                const snap = await getDoc(doc(db, "daily_operations", prevDocId));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.attendance_log && Object.keys(data.attendance_log).length > 0) {
                        return { date: dateStr, data: data };
                    }
                }
            } catch (e) { console.log("Skip day", dateStr); }
        }
        return null;
    };

    const importPreviousRoster = async (force = false) => {
        // Only auto-import if the log is currently empty (to avoid overwriting work)
        // OR if force is true (Manual button)
        const isEmpty = Object.keys(dailyData.attendance_log || {}).length === 0;

        if (isEmpty || force) {
            const result = await findPreviousRoster();
            if (result) {
                if (force && !window.confirm(`Encontrei uma escala do dia ${result.date} com ${Object.keys(result.data.attendance_log).length} pessoas. Substituir a atual?`)) return;

                // Reset statuses to 'present'
                const newLog = {};
                Object.entries(result.data.attendance_log).forEach(([id, entry]) => {
                    newLog[id] = { ...entry, status: 'present' };
                });

                setDailyData(prev => ({
                    ...prev,
                    attendance_log: newLog,
                    staff_real: {} // Clear absences
                }));
                if (force) alert("Escala importada com sucesso! Não esqueça de Salvar a rotina.");
            } else {
                if (force) alert("Nenhuma escala anterior encontrada nos últimos 10 dias.");
            }
        }
    };

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
                // NEW ENTRY: Auto-Import
                importPreviousRoster(false);
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
        // FORCE FALLBACK if currentShiftEmp is empty, don't leave it empty.
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
        // If searching, search in ALL DB. If not search, search in pre-filtered Sector Employees
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
        // [FIX] Must save Name in the log for Reports to work efficiently without joining DB
        const emp = allEmployeesDB.find(e => String(e.matricula) === String(matricula));
        const nome = emp ? emp.nome : "Nome não encontrado";

        const newLogEntry = { status, sector: checkInSector, nome: nome };
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
        <div className="page-container animate-fade-in">
            <style>{styles}</style>

            <div className="header-bar animate-slide-up">
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
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn-icon"
                        onClick={() => importPreviousRoster(true)}
                        title="Importar Escala Anterior"
                        style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#475569' }}
                    >
                        📥 <span style={{ fontSize: '13px' }}>Importar Escala</span>
                    </button>
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

            {/* MAIN OPERATIONAL GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>

                {/* LEFT COL: STAFF */}
                <div>
                    <div className="section-title" style={{ marginTop: 0 }}>🏢 Bloco A: Saúde das Equipes (Gerenciar Presença)</div>
                    <div className="staff-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                        {SECTORS_CONFIG.map(sector => {
                            const meta = targets[sector.key] || 0;
                            const logEntries = Object.entries(dailyData.attendance_log || {})
                                .filter(([_, entry]) => entry.sector === sector.key);
                            const presentCount = logEntries.reduce((acc, [_, entry]) => {
                                const s = entry.status;
                                return (!s || s === 'present') ? acc + 1 : acc;
                            }, 0);
                            const deficit = Math.max(0, meta - presentCount);
                            const isComplete = deficit === 0;

                            return (
                                <div key={sector.key} className="staff-card" onClick={() => dailyData.status !== 'closed' && openCheckIn(sector.key)} style={{ borderLeft: `4px solid ${isComplete ? '#16a34a' : '#ef4444'}`, opacity: dailyData.status === 'closed' ? 0.7 : 1, cursor: dailyData.status === 'closed' ? 'default' : 'pointer' }}>
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
                </div>

                {/* RIGHT COL: LOGISTICS & CLOSING */}
                <div>
                    <div className="section-title" style={{ marginTop: 0 }}>🔒 Logística & Encerramento</div>
                    <div className="closing-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="closing-box">
                                <label className="kpi-label-sm">Chegada Mercadorias</label>
                                <input
                                    type="time"
                                    className="kpi-input-box"
                                    value={dailyData.hora_chegada}
                                    onChange={e => updateField('hora_chegada', e.target.value)}
                                    disabled={dailyData.status === 'closed'}
                                />
                            </div>
                            <div className="closing-box">
                                <label className="kpi-label-sm">Fim Op.</label>
                                <input
                                    type="time"
                                    className="kpi-input-box"
                                    value={dailyData.hora_saida}
                                    onChange={e => updateField('hora_saida', e.target.value)}
                                    disabled={dailyData.status === 'closed'}
                                />
                            </div>
                        </div>

                        <div className="closing-box">
                            <label className="kpi-label-sm">Tonelagem (Kg)</label>
                            <input
                                type="number"
                                className="kpi-input-box"
                                placeholder="0"
                                value={dailyData.tonelagem}
                                onChange={e => updateField('tonelagem', e.target.value)}
                                disabled={dailyData.status === 'closed'}
                            />
                        </div>

                        <div className="closing-box">
                            <label className="kpi-label-sm">Avaliação do Turno</label>
                            <div style={{ display: 'flex', gap: '5px', padding: '5px 0' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <div
                                        key={star}
                                        onClick={() => dailyData.status !== 'closed' && updateField('rating', star)}
                                        style={{ cursor: dailyData.status === 'closed' ? 'default' : 'pointer', transform: dailyData.rating >= star ? 'scale(1.1)' : 'scale(1)' }}
                                    >
                                        <IconStar fill={dailyData.rating >= star} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="closing-box">
                            <textarea
                                className="report-area-sm"
                                value={dailyData.relatorio_lider}
                                onChange={e => updateField('relatorio_lider', e.target.value)}
                                placeholder="Resumo do dia / Ocorrências..."
                                rows={4}
                                disabled={dailyData.status === 'closed'}
                            />

                            {dailyData.status === 'closed' ? (
                                <div style={{
                                    background: '#f1f5f9', color: '#64748b', padding: '12px',
                                    borderRadius: '8px', textAlign: 'center', fontWeight: '700',
                                    textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px'
                                }}>
                                    🔒 Turno Encerrado
                                </div>
                            ) : (
                                <button className="btn-finish-sm" onClick={handleFinishDay}>
                                    Encerrar Diário
                                </button>
                            )}
                        </div>
                    </div>
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


