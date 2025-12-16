import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    setDoc,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { IntelligenceOperations } from "../components/IntelligenceOperations";

// --- ÍCONES SVG ---
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconBolt = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const IconLightbulb = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.4 1.5-3.8 0-3.2-2.8-5.7-6-5.7S6 4.5 6 7.7c0 1.4.5 2.8 1.5 3.8.8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>;
const IconWhatsapp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
const IconShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconHeart = ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconTrophy = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
const IconChart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;

const TIPOS_OCORRENCIA = [
    "Erro / Falha operacional", "Melhoria / Oportunidade", "Alerta / Risco", "Quebra / Perda",
    "Ruptura / Disponibilidade", "Cliente / Reclamação", "Treinamento / Capacitação",
    "Indicador positivo / Resultado", "Planejamento / Decisão do dia", "Evento externo / Fator externo",
    "WhatsApp / Externo"
];

const CATEGORIAS_LISTA = [
    "Recebimento (RM)", "Expedição", "Câmara Fria", "Seleção", "Blocado", "Embandejamento", "Contagem de Estoque"
];

// --- FUNÇÕES AUXILIARES ---

// 1. Função para remover acentos
const removerAcentos = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// 2. Formatação Inteligente
const formatarTextoIA = (texto) => {
    if (!texto) return "";
    let t = texto.trim();
    if (t.length === 0) return "";
    t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/\s+/g, ' ');
    return t;
};

// 3. Data e Hora Segura
const renderSafeData = (valor) => {
    if (!valor) return "";
    if (typeof valor === 'object' && valor.seconds) return new Date(valor.seconds * 1000).toLocaleDateString('pt-BR');
    return valor;
};
const renderSafeHora = (valor) => {
    if (!valor) return "--:--";
    if (typeof valor === 'object' && valor.seconds) return new Date(valor.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (typeof valor === 'string' && valor.includes(':')) return valor.substring(0, 5);
    return valor;
};

function calcularDataAlvo(prioridade) {
    const hoje = new Date();
    let diasExtras = 7;
    if (prioridade === 'Crítica') diasExtras = 4;
    else if (prioridade === 'Alta') diasExtras = 5;
    else if (prioridade === 'Média') diasExtras = 6;
    hoje.setDate(hoje.getDate() + diasExtras);
    return hoje.toISOString().split('T')[0];
}

export function OperationsLogPage() {
    const navigate = useNavigate();

    // --- CSS EMBUTIDO ---
    const styles = `
    :root { --primary: #2563eb; --primary-dark: #1e40af; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
    .operations-page-container { max-width: 1100px; margin: 0 auto; padding: 20px; }
    
    .coach-panel { padding: 20px; border-radius: 16px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.5s; }
    .coach-good { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 1px solid #86efac; color: #14532d; }
    .coach-bad { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #fca5a5; color: #7f1d1d; }
    .coach-content { display: flex; align-items: center; gap: 15px; z-index: 1; }
    .coach-message h2 { margin: 0; font-size: 18px; font-weight: 700; }
    .coach-message p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
    .btn-coach-action { background: white; border: none; padding: 10px 20px; border-radius: 30px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; transition: transform 0.2s; animation: pulse 2s infinite; color: var(--danger); }
    .btn-coach-action:hover { transform: scale(1.05); }

    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .header-controls { display: flex; gap: 15px; align-items: center; }
    .date-filter { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; color: #444; cursor: pointer; }
    
    .score-box { text-align: center; }
    .lives-container { display: flex; gap: 4px; justify-content: center; margin-top: 5px; }
    .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

    .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; }
    .kpi-card { flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); }
    .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; font-weight: 700; }
    .kpi-value { font-size: 16px; font-weight: 700; color: #333; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .card-safe .kpi-value { color: var(--success); }
    .card-danger .kpi-value { color: var(--danger); }
    .card-safe { background: #f0fdf4; border-bottom: 3px solid var(--success); }
    .card-danger { background: #fff; border-bottom: 3px solid var(--danger); }

    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
    .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; }
    .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 100px; flex-grow: 1; }
    .main-textarea:focus { border-color: var(--primary); }
    
    .quick-tags { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .tag-chip { border: 1px solid #e5e7eb; background: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #6b7280; transition: all 0.2s; }
    .tag-chip:hover { background: #f9fafb; border-color: #d1d5db; }
    .tag-chip.active-erro { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    .tag-chip.active-ideia { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
    .tag-chip.active-normal { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
    .btn-magic { background: #111827; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
    .btn-magic:hover { background: #000; }

    .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #666; }
    .history-stat { margin-top: 15px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; width: 100%; }

    .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .timeline-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff; }
    .btn-new-pdca { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
    .btn-bulk-delete { background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; animation: fadeIn 0.3s; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
    td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:hover { background: #f8fafc; }
    .check-cell { width: 30px; text-align: center; }
    .custom-checkbox { width: 16px; height: 16px; cursor: pointer; }

    .badge { padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 10px; color: white; display: inline-block; text-transform: uppercase; white-space: nowrap; }
    .badge-Erro { background: var(--danger); } 
    .badge-Alerta { background: var(--warning); } 
    .badge-Melhoria { background: var(--success); }
    .badge-WhatsApp { background: #25D366; color: white; display: flex; align-items: center; gap: 4px; justify-content: center;}
    .badge-Outros { background: #9ca3af; }
    
    .actions { display: flex; gap: 6px; align-items: center; }
    .icon-btn { border: 1px solid transparent; background: transparent; cursor: pointer; padding: 5px; border-radius: 6px; color: #9ca3af; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .icon-btn:hover { background: #f3f4f6; color: #1f2937; border-color: #e5e7eb; }
    .btn-row-pdca { color: var(--primary); background: #eff6ff; border: 1px solid #dbeafe; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
    .modal-card { background: white; width: 95%; max-width: 650px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s; display: flex; flex-direction: column; max-height: 90vh; }
    .card-header-styled { background: #f8fafc; padding: 15px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .card-content { padding: 25px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; }
    .type-selector { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; background: white; margin-top: 5px; }
    .modal-label { font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px; color: #475569; }
    .modal-textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1e293b; background: white; min-height: 80px; resize: vertical; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
    .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
    @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } .kpi-grid { flex-direction: column; } }
  `;
    // --- ESTADOS ---
    const [logs, setLogs] = useState([]);
    const [dataFiltro, setDataFiltro] = useState(() => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    });
    const [inputTexto, setInputTexto] = useState('');
    const [tipoManual, setTipoManual] = useState(null);
    const [alertaOntem, setAlertaOntem] = useState(null);
    const [idsSelecionados, setIdsSelecionados] = useState(new Set());
    const [showPdcaModal, setShowPdcaModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);

    const [pdcaForm, setPdcaForm] = useState({
        logId: null, descricao: '', causas: '', indicadorAntes: '', indicadorMeta: '', metaDescritiva: '', planoAcao: '', tipo: '', tipoObjeto: '', descricaoObjeto: ''
    });
    const [editForm, setEditForm] = useState({ id: null, textoOriginal: '', tipo: '', categoria: '', cliente: '', origem: '' });
    const [metricsForm, setMetricsForm] = useState({
        data: new Date().toISOString().split('T')[0],
        tonelagem: '',
        horaSaida: '',
        qtdFuncionarios: '',
        faltaExpedicao: 0,
        faltaSelecao: 0,
        faltaRecebimento: 0,
        feriado: false,
        chegadaTardia: false
    });

    // [NEW] Estado para métricas do dia (Tempo Real)
    const [dailyMetrics, setDailyMetrics] = useState(null);


    // [NEW] Estado para dados em tempo real do Espelho Operacional
    const [mirrorData, setMirrorData] = useState(null);

    // --- EFEITOS ---
    // 1. Listener do Espelho Operacional (Tempo Real)
    useEffect(() => {
        const getShift = () => {
            const h = new Date().getHours();
            if (h >= 6 && h < 14) return 'manha';
            if (h >= 14 && h < 22) return 'tarde';
            return 'noite';
        };
        const hoje = new Date().toISOString().split('T')[0];
        const shift = getShift();
        const docId = `${hoje}_${shift}`;

        const unsub = onSnapshot(doc(db, "daily_operations", docId), (docSnap) => {
            if (docSnap.exists()) {
                setMirrorData(docSnap.data());
            } else {
                setMirrorData(null);
            }
        });
        return () => unsub();
    }, []);

    // 2. Listener de Métricas do Dia (Para Eficiência)
    useEffect(() => {
        const hoje = new Date().toISOString().split('T')[0];
        const unsub = onSnapshot(doc(db, "daily_metrics", hoje), (docSnap) => {
            if (docSnap.exists()) {
                setDailyMetrics(docSnap.data());
            } else {
                setDailyMetrics(null);
            }
        });
        return () => unsub();
    }, []);

    // 2. Listener de Logs
    useEffect(() => {
        const q = query(collection(db, "operation_logs"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    textoOriginal: data.textoOriginal ? formatarTextoIA(data.textoOriginal) : "",
                    tipo: data.tipo || "Outros",
                    categoria: data.categoria || "Geral",
                    cliente: data.cliente || "Geral",
                    origem: data.origem || "web",
                    data: data.data || ""
                };
            });
            setLogs(logsData);
            verificarOntem(logsData);
        }, (error) => console.error("Erro logs:", error));
        return () => unsubscribe();
    }, []);

    const verificarOntem = (logsAtuais) => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString();
        const errosOntem = logsAtuais.filter(l => l.data === dataOntem && (l.tipo || "").includes('Erro'));
        if (errosOntem.length > 0) setAlertaOntem(`Morning Call: Ontem tivemos ${errosOntem.length} ocorrências críticas.`);
        else setAlertaOntem(null);
    };

    const logsFiltrados = logs.filter(log => {
        if (!log.textoOriginal || log.textoOriginal.trim() === "") return false;
        const partes = log.data.split('/');
        if (partes.length === 3) {
            const dataLogFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
            return dataLogFormatada === dataFiltro;
        }
        return false;
    });

    const excluirLog = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este registro permanentemente do Firebase?')) {
            try {
                await deleteDoc(doc(db, "operation_logs", id));
            } catch (error) {
                console.error("Erro ao excluir:", error);
                alert("Erro de permissão ou conexão ao excluir.");
            }
        }
    };

    const excluirEmMassa = async () => {
        if (!window.confirm(`Excluir ${idsSelecionados.size} registros selecionados?`)) return;
        try {
            const batch = writeBatch(db);
            idsSelecionados.forEach(id => {
                const docRef = doc(db, "operation_logs", id);
                batch.delete(docRef);
            });
            await batch.commit();
            setIdsSelecionados(new Set());
        } catch (error) {
            console.error("Erro exclusão em massa:", error);
            alert("Erro ao excluir em massa.");
        }
    };

    const analisarTexto = (texto) => {
        const t = removerAcentos(texto || "");
        let cat = 'Geral';
        let tipo = 'Planejamento / Decisão do dia';
        let cliente = 'Geral';

        if (t.includes('rm') || t.includes('recebimento') || t.includes('chegou') || t.includes('chegada') || t.includes('conferencia') || t.includes('fornecedor') || t.includes('nota fiscal') || t.includes('descarga')) cat = 'Recebimento (RM)';
        else if (t.includes('selecao') || t.includes('selecionar') || t.includes('triagem') || t.includes('escolha') || t.includes('classificacao')) cat = 'Seleção';
        else if (t.includes('camara') || t.includes('fria') || t.includes('geladeira') || t.includes('temperatura') || t.includes('climatizacao') || t.includes('perecivel')) cat = 'Câmara Fria';
        else if (t.includes('blocado') || t.includes('sacos') || t.includes('caixas') || t.includes('batata') || t.includes('cebola') || t.includes('abobora') || t.includes('palete') || t.includes('pilha')) cat = 'Blocado';
        else if (t.includes('embandejamento') || t.includes('bandeja') || t.includes('filme') || t.includes('embalar') || t.includes('etiqueta') || t.includes('peso')) cat = 'Embandejamento';
        else if (t.includes('contagem') || t.includes('estoque') || t.includes('inventario') || t.includes('auditoria') || t.includes('divergencia') || t.includes('furo')) cat = 'Contagem de Estoque';
        else if (t.includes('expedicao') || t.includes('expedir') || t.includes('separacao') || t.includes('carregamento') || t.includes('embarque') || t.includes('saida') || t.includes('rota')) cat = 'Expedição';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('veiculo') || t.includes('motorista')) cat = 'Frota';
        else if (t.includes('rh') || t.includes('atestado') || t.includes('faltou')) cat = 'RH';
        else if (t.includes('manutencao') || t.includes('conserto') || t.includes('quebrou')) cat = 'Manutenção';

        if (t.includes('melhoria') || t.includes('ideia') || t.includes('sugestao')) tipo = 'Melhoria / Oportunidade';
        else if (t.includes('erro') || t.includes('falha') || t.includes('esqueci')) tipo = 'Erro / Falha operacional';
        else if (t.includes('alerta') || t.includes('risco') || t.includes('atraso')) tipo = 'Alerta / Risco';
        else if (t.includes('quebra') || t.includes('dano') || t.includes('perda') || t.includes('estragou') || t.includes('podre') || t.includes('avariad')) tipo = 'Quebra / Perda';
        else if (t.includes('falta') || t.includes('acabou') || t.includes('ruptura')) tipo = 'Ruptura / Disponibilidade';
        else if (t.includes('cliente') || t.includes('reclamacao') || t.includes('devolucao')) tipo = 'Cliente / Reclamação';
        else if (t.includes('treinamento')) tipo = 'Treinamento / Capacitação';
        else if (t.includes('whatsapp')) tipo = 'WhatsApp / Externo';

        if (t.includes('verdemar')) cliente = 'Verdemar';
        else if (t.includes('rena')) cliente = 'Rena';
        else if (t.includes('carrefour')) cliente = 'Carrefour';
        else if (t.includes('epa')) cliente = 'EPA';

        return { categoria: cat, tipoSugerido: tipo, cliente: cliente };
    };

    const registrarNovo = async () => {
        if (!inputTexto.trim()) return;
        const analise = analisarTexto(inputTexto);
        const tipoFinal = tipoManual ? tipoManual : analise.tipoSugerido;
        const textoFormatado = formatarTextoIA(inputTexto);

        try {
            await addDoc(collection(db, "operation_logs"), {
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR'),
                timestamp: serverTimestamp(),
                textoOriginal: textoFormatado,
                categoria: analise.categoria,
                cliente: analise.cliente,
                tipo: tipoFinal,
                origem: "web"
            });
            setInputTexto(''); setTipoManual(null);
        } catch (error) { console.error("Erro ao salvar log:", error); }
    };

    const toggleTipoManual = (tipo) => {
        if (tipoManual === tipo) setTipoManual(null); else setTipoManual(tipo);
    };

    const toggleSelecao = (id) => {
        const novosIds = new Set(idsSelecionados);
        if (novosIds.has(id)) novosIds.delete(id); else novosIds.add(id);
        setIdsSelecionados(novosIds);
    };
    const selecionarTodos = () => {
        if (idsSelecionados.size === logsFiltrados.length) setIdsSelecionados(new Set());
        else setIdsSelecionados(new Set(logsFiltrados.map(l => l.id)));
    };

    const abrirModalEdicao = (log) => {
        setEditForm({
            id: log.id,
            textoOriginal: log.textoOriginal || "",
            tipo: log.tipo || "",
            categoria: log.categoria || "",
            cliente: log.cliente || "Geral",
            origem: log.origem || ""
        });
        setShowEditModal(true);
    };

    const salvarEdicao = async () => {
        const analise = analisarTexto(editForm.textoOriginal);
        const textoFormatado = formatarTextoIA(editForm.textoOriginal);
        const clienteFinal = analise.cliente !== 'Geral' ? analise.cliente : editForm.cliente;

        try {
            const logRef = doc(db, "operation_logs", editForm.id);
            await updateDoc(logRef, {
                textoOriginal: textoFormatado,
                tipo: editForm.tipo,
                categoria: editForm.categoria,
                cliente: clienteFinal,
                origem: editForm.origem
            });
            setShowEditModal(false);
        } catch (error) { console.error("Erro ao editar:", error); }
    };

    const gerarSugestaoPDCA = (texto, tipo) => {
        const t = texto ? texto.toLowerCase() : "";
        let sugestao = { causas: "1. Causa raiz não identificada.", plano: "1. Investigar ocorrência.", tipoObjeto: "Processo", descObjeto: "Processo Operacional" };

        if (t.includes('caminhao') || t.includes('veiculo')) { sugestao.tipoObjeto = "Veículo"; sugestao.descObjeto = "Veículo envolvido"; }
        else if (t.includes('sistema') || t.includes('internet')) { sugestao.tipoObjeto = "TI"; sugestao.descObjeto = "Sistema"; }
        if (t.includes('caminhao') || t.includes('quebra')) { sugestao.causas = "1. Falta de manutenção."; sugestao.plano = "1. Enviar para oficina."; }
        else if (t.includes('falta')) { sugestao.causas = "1. Ausência não programada."; sugestao.plano = "1. Realocar equipe."; }
        return sugestao;
    };

    const abrirModalPDCA = (origem) => {
        let textoBase = ''; let tipoBase = '';
        if (origem === 'auto') {
            const erro = logsFiltrados.find(l => (l.tipo || "").includes('Erro'));
            textoBase = erro ? erro.textoOriginal : "Análise de falhas do dia";
            tipoBase = erro ? erro.tipo : "Geral";
        } else {
            textoBase = origem.textoOriginal || ""; tipoBase = origem.tipo || "";
        }
        const sugestoes = gerarSugestaoPDCA(textoBase, tipoBase);
        setPdcaForm({
            logId: origem.id || null, descricao: textoBase, causas: sugestoes.causas, indicadorAntes: '', indicadorMeta: '', metaDescritiva: 'Resolver problema raiz', planoAcao: sugestoes.plano, tipo: tipoBase, tipoObjeto: sugestoes.tipoObjeto, descricaoObjeto: sugestoes.descObjeto
        });
        setShowPdcaModal(true);
    };

    const confirmarSalvarPDCA = async () => {
        try {
            const novoPDCA = {
                codigo: "OP-" + Math.floor(Math.random() * 10000),
                titulo: `PDCA: ${pdcaForm.descricao.substring(0, 20)}...`,
                status: "Planejando",
                criadoEm: new Date().toISOString(),
                plan: {
                    area: "Operações", priority: "Alta", dataAlvo: calcularDataAlvo("Alta"), problema: pdcaForm.descricao, causas: pdcaForm.causas, planoAcao: pdcaForm.planoAcao, meta: pdcaForm.metaDescritiva
                }
            };
            await addDoc(collection(db, "pdcas"), novoPDCA);
            setShowPdcaModal(false);
            alert("PDCA Criado com Sucesso!");
        } catch (e) { console.error(e); }
    };

    const abrirModalMetricas = async () => {
        const hoje = new Date().toISOString().split('T')[0];
        try {
            const docRef = doc(db, "daily_metrics", hoje);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMetricsForm({ ...docSnap.data(), data: hoje });
            } else {
                setMetricsForm(prev => ({ ...prev, data: hoje }));
            }
            setShowMetricsModal(true);
        } catch (e) { console.error(e); setShowMetricsModal(true); }
    };

    const salvarMetricas = async () => {
        try {
            const docId = metricsForm.data;
            await setDoc(doc(db, "daily_metrics", docId), {
                ...metricsForm,
                tonelagem: Number(metricsForm.tonelagem),
                qtdFuncionarios: Number(metricsForm.qtdFuncionarios),
                faltaExpedicao: Number(metricsForm.faltaExpedicao),
                faltaSelecao: Number(metricsForm.faltaSelecao),
                faltaRecebimento: Number(metricsForm.faltaRecebimento),
                updatedAt: serverTimestamp()
            });
            setShowMetricsModal(false);
            alert("Métricas Diárias Salvas! O aprendizado foi atualizado.");
        } catch (error) {
            console.error("Erro ao salvar métricas:", error);
            alert("Erro ao salvar.");
        }
    };

    const statsHoje = logsFiltrados.reduce((acc, log) => {
        const cat = log.categoria || "Geral";
        const tipo = log.tipo || "";
        if (!acc[cat]) acc[cat] = { total: 0, erros: 0 };
        acc[cat].total += 1;
        if (tipo.includes('Erro') || tipo.includes('Falha')) acc[cat].erros += 1;
        return acc;
    }, {});
    CATEGORIAS_LISTA.forEach(cat => { if (!statsHoje[cat]) statsHoje[cat] = { total: 0, erros: 0 }; });

    let errosTotais = 0;
    logsFiltrados.forEach(l => { if ((l.tipo || "").includes('Erro')) errosTotais++; });

    const maxHearts = 5;
    const heartsLeft = Math.max(0, maxHearts - (errosTotais * 0.5));
    const isBadDay = heartsLeft <= 3.5;

    const getBadgeClass = (tipo) => {
        if (!tipo) return 'badge-Outros';
        if (tipo.includes('Erro')) return 'badge-Erro';
        if (tipo.includes('Alerta')) return 'badge-Alerta';
        if (tipo.includes('Melhoria')) return 'badge-Melhoria';
        if (tipo.includes('WhatsApp')) return 'badge-WhatsApp';
        return 'badge-Outros';
    };
    return (
        <div className="operations-page-container">
            <style>{styles}</style>
            <div className={`coach-panel ${isBadDay ? 'coach-bad' : 'coach-good'}`}>
                <div className="coach-content">
                    {isBadDay ? (
                        <>
                            <IconAlert />
                            <div className="coach-message">
                                <h2>Atenção à Operação!</h2>
                                <p>Identificamos {errosTotais} erros hoje. A saúde operacional está baixa.</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <IconTrophy />
                            <div className="coach-message">
                                <h2>Excelente Trabalho!</h2>
                                <p>A operação está fluindo bem. Continue assim!</p>
                            </div>
                        </>
                    )}
                </div>
                {isBadDay && (
                    <button className="btn-coach-action" onClick={() => abrirModalPDCA('auto')}>
                        <IconBrain /> Usar IA para Sugestão de Melhorias
                    </button>
                )}
            </div>

            <div className="header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '20px' }}>Diário de Operações</h1>
                    <button onClick={() => navigate('/diario')} style={{ marginTop: '5px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <IconBolt />
                        Ir para Espelho Operacional (Novo)
                    </button>
                </div>
                <div className="score-box">
                    <div className="lives-container">
                        {[...Array(5)].map((_, i) => (
                            <IconHeart key={i} filled={i < heartsLeft} />
                        ))}
                    </div>
                    <span className="score-label">Saúde Operacional</span>
                </div>
            </div>

            {alertaOntem && <div className="morning-alert"><IconAlert /> <strong>{alertaOntem}</strong></div>}

            <div className="kpi-grid">
                {CATEGORIAS_LISTA.map((cat) => {
                    const dados = statsHoje[cat] || { erros: 0, total: 0 };
                    const isSafe = dados.erros === 0;
                    return (
                        <div className={`kpi-card ${isSafe ? 'card-safe' : 'card-danger'}`} key={cat}>
                            <h3>{cat}</h3>
                            <span className="kpi-value">
                                {isSafe ? (
                                    <> <IconShield /> <span style={{ fontSize: '12px', fontWeight: '500' }}>100% Seguro</span> </>
                                ) : (
                                    <> {dados.erros} <span style={{ fontSize: '12px', fontWeight: '400', color: '#888' }}>Erros</span> </>
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="main-grid">
                <div className="smart-input-container">
                    <div className="smart-header"><h3><IconCheck /> Registro Rápido</h3></div>
                    <textarea className="main-textarea" placeholder="Descreva o fato..." value={inputTexto} onChange={(e) => setInputTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), registrarNovo())} />
                    <div className="quick-tags">
                        <div className={`tag-chip ${tipoManual === 'Melhoria / Oportunidade' ? 'active-ideia' : ''}`} onClick={() => toggleTipoManual('Melhoria / Oportunidade')}><IconLightbulb /> Ideia / Melhoria</div>
                        <div className={`tag-chip ${tipoManual === 'Erro / Falha operacional' ? 'active-erro' : ''}`} onClick={() => toggleTipoManual('Erro / Falha operacional')}><IconAlert /> Erro / Falha</div>
                        <div className={`tag-chip ${tipoManual === null ? 'active-normal' : ''}`} onClick={() => setTipoManual(null)}>🤖 Auto (IA)</div>
                    </div>
                    <button className="btn-magic" onClick={registrarNovo}>Registrar Ocorrência</button>
                </div>
                <div className="intelligence-wrapper">
                    <IntelligenceOperations logs={logs} mirrorData={mirrorData} dailyMetrics={dailyMetrics} />
                </div>
            </div>

            <div className="timeline-card">
                <div className="timeline-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h3 style={{ margin: 0 }}>Histórico</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IconCalendar />
                            <input type="date" className="date-filter" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
                        </div>
                        {idsSelecionados.size > 0 && (
                            <button className="btn-bulk-delete" onClick={excluirEmMassa}><IconTrash /> Excluir {idsSelecionados.size}</button>
                        )}
                    </div>
                    <button className="btn-new-pdca" style={{ background: '#7c3aed' }} onClick={abrirModalMetricas}><IconChart /> Métricas do Dia</button>
                    <button className="btn-new-pdca" onClick={() => abrirModalPDCA({ textoOriginal: '' })}><IconPlus /> Novo PDCA</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className="check-cell"><input type="checkbox" className="custom-checkbox" checked={logsFiltrados.length > 0 && idsSelecionados.size === logsFiltrados.length} onChange={selecionarTodos} /></th>
                            <th style={{ width: '140px' }}>Data/Hora</th>
                            <th>Cat.</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logsFiltrados.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>Nenhum registro para esta data.</td></tr>
                        ) : (
                            logsFiltrados.map((log) => (
                                <tr key={log.id}>
                                    <td className="check-cell"><input type="checkbox" className="custom-checkbox" checked={idsSelecionados.has(log.id)} onChange={() => toggleSelecao(log.id)} /></td>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{renderSafeData(log.data)}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>{renderSafeHora(log.hora)}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {log.categoria}
                                            {(log.tipo.includes('WhatsApp') || (log.origem && log.origem.includes('whatsapp'))) && (
                                                <IconWhatsapp />
                                            )}
                                        </div>
                                    </td>
                                    <td><span className={`badge ${getBadgeClass(log.tipo)}`}>{log.tipo}</span></td>
                                    <td><b>{log.cliente}:</b> {log.textoOriginal}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="icon-btn btn-row-pdca" title="PDCA" onClick={() => abrirModalPDCA(log)}><IconBolt width="14" height="14" /></button>
                                            <button className="icon-btn icon-edit" title="Editar" onClick={() => abrirModalEdicao(log)}><IconEdit /></button>
                                            <button className="icon-btn icon-del" title="Excluir" onClick={() => excluirLog(log.id)}><IconTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showEditModal && (
                <div className="modal-overlay">
                    <section className="modal-card">
                        <div className="card-header-styled"><h2>Editar Registro</h2><button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconX /></button></div>
                        <div className="card-content">
                            <div><label className="modal-label">Descrição</label><textarea className="modal-textarea" rows="3" value={editForm.textoOriginal} onChange={(e) => setEditForm({ ...editForm, textoOriginal: e.target.value })} /></div>
                            <div className="form-grid-2">
                                <div>
                                    <label className="modal-label">Categoria</label>
                                    <select className="type-selector" value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}>
                                        {CATEGORIAS_LISTA.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="modal-label">Tipo de Ocorrência</label>
                                    <select className="type-selector" value={editForm.tipo} onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}>
                                        {TIPOS_OCORRENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="section-actions"><button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button><button className="btn-primary" onClick={salvarEdicao}>Salvar</button></div>
                        </div>
                    </section>
                </div>
            )}

            {showPdcaModal && (
                <div className="modal-overlay">
                    <section className="modal-card plan-card">
                        <div className="card-header-styled">
                            <h2><IconBrain color="#6366f1" /> Novo PDCA <span className="ai-badge">IA Auto-fill</span></h2>
                            <button onClick={() => setShowPdcaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconX /></button>
                        </div>
                        <div className="card-content">
                            <div><label className="modal-label">Problema (Fato)</label><textarea className="modal-textarea" rows="2" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({ ...pdcaForm, descricao: e.target.value })} /></div>
                            <div><label className="modal-label">Causas (Sugestão IA)</label><textarea className="modal-textarea" rows="3" style={{ background: '#fcfaff', borderColor: '#e0e7ff' }} value={pdcaForm.causas} onChange={(e) => setPdcaForm({ ...pdcaForm, causas: e.target.value })} /></div>
                            <div className="form-grid-2">
                                <div><label className="modal-label">Indicador Antes</label><input className="modal-textarea" style={{ minHeight: '40px' }} value={pdcaForm.indicadorAntes} onChange={(e) => setPdcaForm({ ...pdcaForm, indicadorAntes: e.target.value })} /></div>
                                <div><label className="modal-label">Indicador Meta</label><input className="modal-textarea" style={{ minHeight: '40px' }} value={pdcaForm.indicadorMeta} onChange={(e) => setPdcaForm({ ...pdcaForm, indicadorMeta: e.target.value })} /></div>
                            </div>
                            <div><label className="modal-label">Meta (Descritiva)</label><input className="modal-textarea" style={{ minHeight: '40px' }} value={pdcaForm.metaDescritiva} onChange={(e) => setPdcaForm({ ...pdcaForm, metaDescritiva: e.target.value })} /></div>
                            <div><label className="modal-label">Plano de Ação (Sugestão IA)</label><textarea className="modal-textarea" rows="4" style={{ background: '#fcfaff', borderColor: '#e0e7ff' }} value={pdcaForm.planoAcao} onChange={(e) => setPdcaForm({ ...pdcaForm, planoAcao: e.target.value })} /></div>
                            <div className="section-actions">
                                <button className="btn-secondary" onClick={() => setShowPdcaModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={confirmarSalvarPDCA}>Criar PDCA</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {showMetricsModal && (
                <div className="modal-overlay">
                    <section className="modal-card">
                        <div className="card-header-styled">
                            <h2><IconChart /> Dados do Dia (Aprendizado)</h2>
                            <button onClick={() => setShowMetricsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><IconX /></button>
                        </div>
                        <div className="card-content">
                            <div><label className="modal-label">Data de Referência</label><input type="date" className="modal-textarea" style={{ minHeight: '40px' }} value={metricsForm.data} onChange={(e) => setMetricsForm({ ...metricsForm, data: e.target.value })} /></div>

                            <div className="form-grid-2">
                                <div><label className="modal-label">Tonelagem (Kg)</label><input type="number" placeholder="Ex: 38000" className="modal-textarea" style={{ minHeight: '40px' }} value={metricsForm.tonelagem} onChange={(e) => setMetricsForm({ ...metricsForm, tonelagem: e.target.value })} /></div>
                                <div><label className="modal-label">Qtd. Funcionários</label><input type="number" placeholder="Ex: 15" className="modal-textarea" style={{ minHeight: '40px' }} value={metricsForm.qtdFuncionarios} onChange={(e) => setMetricsForm({ ...metricsForm, qtdFuncionarios: e.target.value })} /></div>
                            </div>
                            <div className="form-grid-2" style={{ marginTop: '15px' }}>
                                <div><label className="modal-label">Horário Saída Caminhão</label><input type="time" className="modal-textarea" style={{ minHeight: '40px' }} value={metricsForm.horaSaida} onChange={(e) => setMetricsForm({ ...metricsForm, horaSaida: e.target.value })} /></div>
                            </div>

                            <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <label className="modal-label" style={{ color: 'var(--danger)' }}>Absenteísmo (Faltas)</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>Expedição</label><input type="number" className="modal-textarea" style={{ minHeight: '35px' }} value={metricsForm.faltaExpedicao} onChange={(e) => setMetricsForm({ ...metricsForm, faltaExpedicao: e.target.value })} /></div>
                                    <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>Seleção</label><input type="number" className="modal-textarea" style={{ minHeight: '35px' }} value={metricsForm.faltaSelecao} onChange={(e) => setMetricsForm({ ...metricsForm, faltaSelecao: e.target.value })} /></div>
                                    <div style={{ flex: 1 }}><label style={{ fontSize: '11px' }}>Recebimento</label><input type="number" className="modal-textarea" style={{ minHeight: '35px' }} value={metricsForm.faltaRecebimento} onChange={(e) => setMetricsForm({ ...metricsForm, faltaRecebimento: e.target.value })} /></div>
                                </div>
                            </div>

                            <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={metricsForm.feriado} onChange={(e) => setMetricsForm({ ...metricsForm, feriado: e.target.checked })} /> Feriado?
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={metricsForm.chegadaTardia} onChange={(e) => setMetricsForm({ ...metricsForm, chegadaTardia: e.target.checked })} /> Chegada Tardia de Mercadoria?
                                </label>
                            </div>

                            <div className="section-actions">
                                <button className="btn-secondary" onClick={() => setShowMetricsModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={salvarMetricas}>Salvar Dados</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}