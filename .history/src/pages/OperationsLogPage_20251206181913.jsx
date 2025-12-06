import React, { useState, useEffect } from 'react';
import { collection, addDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 

// --- ÍCONES SVG ---
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconBolt = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const IconLightbulb = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.4 1.5-3.8 0-3.2-2.8-5.7-6-5.7S6 4.5 6 7.7c0 1.4.5 2.8 1.5 3.8.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
const IconWhatsapp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

const TIPOS_OCORRENCIA = [
    "Erro / Falha operacional", "Melhoria / Oportunidade", "Alerta / Risco", "Quebra / Perda",
    "Ruptura / Disponibilidade", "Cliente / Reclamação", "Treinamento / Capacitação",
    "Indicador positivo / Resultado", "Planejamento / Decisão do dia", "Evento externo / Fator externo"
];

// Função auxiliar para calcular data alvo
function calcularDataAlvo(prioridade) {
    const hoje = new Date();
    let diasExtras = 7; // Padrão Baixa

    if (prioridade === 'Crítica') diasExtras = 4;
    else if (prioridade === 'Alta') diasExtras = 5;
    else if (prioridade === 'Média') diasExtras = 6;
    
    hoje.setDate(hoje.getDate() + diasExtras);
    return hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

export function OperationsLogPage() {

    // --- CSS ---
    const styles = `
        :root { --primary: #2563eb; --primary-dark: #1e40af; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1100px; margin: 0 auto; padding: 20px; }
        
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.5s; }
        
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-box { text-align: center; }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

        .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; }
        .kpi-card { flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; animation: slideIn 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }
        .empty-kpi { width: 100%; text-align: center; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; color: #999; font-size: 13px; }

        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }

        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); position: relative; display: flex; flex-direction: column; height: 100%; }
        .smart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .smart-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 100px; flex-grow: 1; }
        .main-textarea:focus { border-color: var(--primary); }
        
        /* ESTILOS PARA OS CHIPS DE SELEÇÃO */
        .quick-tags { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .tag-chip { border: 1px solid #e5e7eb; background: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #6b7280; transition: all 0.2s; }
        .tag-chip:hover { background: #f9fafb; border-color: #d1d5db; }
        .tag-chip.active-erro { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .tag-chip.active-ideia { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
        .tag-chip.active-normal { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
        
        .btn-magic { background: #111827; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .btn-magic:hover { background: #000; }

        .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .intelligence-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: #374151; font-weight: 600; }
        .alert-box { padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        
        .btn-pdca-auto { background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2); transition: transform 0.1s; }
        .btn-pdca-auto:hover { transform: translateY(-1px); filter: brightness(1.05); }

        .history-stat { margin-top: auto; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; }

        .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .timeline-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff; }
        .timeline-actions { display: flex; gap: 10px; align-items: center; }
        
        /* Botão Novo PDCA Lindo */
        .btn-new-pdca { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .btn-new-pdca:hover { background: var(--primary-dark); transform: translateY(-1px); }
        
        .btn-timeline-action { background: white; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; color: #555; }
        .btn-timeline-action:hover { background: #f9fafb; border-color: #ccc; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:hover { background: #f8fafc; }
        
        .badge { padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 10px; color: white; display: inline-block; text-transform: uppercase; white-space: nowrap; }
        .badge-Erro { background: var(--danger); } 
        .badge-Alerta { background: var(--warning); } 
        .badge-Melhoria { background: var(--success); }
        .badge-Quebra { background: #7c3aed; }
        .badge-Ruptura { background: #db2777; }
        .badge-Cliente { background: #ea580c; }
        .badge-Treinamento { background: #0891b2; }
        .badge-Indicador { background: #059669; }
        .badge-Planejamento { background: #4f46e5; }
        .badge-Evento { background: #64748b; }
        .badge-Outros { background: #9ca3af; }
        .badge-WhatsApp { background: #25D366; color: white; }
        
        .actions { display: flex; gap: 6px; align-items: center; }
        .icon-btn { border: 1px solid transparent; background: transparent; cursor: pointer; padding: 5px; border-radius: 6px; color: #9ca3af; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { background: #f3f4f6; color: #1f2937; border-color: #e5e7eb; }
        
        /* Botão PDCA na linha (Raio) */
        .btn-row-pdca { color: var(--primary); background: #eff6ff; border: 1px solid #dbeafe; }
        .btn-row-pdca:hover { background: var(--primary); color: white; border-color: var(--primary); }
        
        .icon-edit:hover { color: #d97706; background: #fffbeb; border-color: #fcd34d; }
        .icon-del:hover { color: var(--danger); background: #fef2f2; border-color: #fecaca; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
        .modal-card { background: white; width: 95%; max-width: 650px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s; display: flex; flex-direction: column; max-height: 90vh; }
        .card-header-styled { background: #f8fafc; padding: 15px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h2 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .card-content { padding: 25px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; }
        .type-selector { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; background: white; margin-top: 5px; }
        .modal-label { font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px; color: #475569; }
        .modal-textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1e293b; background: white; min-height: 80px; resize: vertical; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
        .btn-primary:hover { background: var(--primary-dark); }
        .ai-badge { font-size: 10px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 5px; font-weight: bold; letter-spacing: 0.5px; }
        
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } .kpi-grid { flex-direction: column; } }
    `;

    // --- ESTADOS ---
    const [logs, setLogs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ops_logs_vitalicio')) || []; } catch { return []; }
    });

    const [inputTexto, setInputTexto] = useState('');
    // ESTADO: Tipo Manual (Botoes de Tag)
    const [tipoManual, setTipoManual] = useState(null); 
    const [alertaOntem, setAlertaOntem] = useState(null);
    
    // Controle de Modais
    const [showPdcaModal, setShowPdcaModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Formulários
    const [pdcaForm, setPdcaForm] = useState({ 
        logId: null, 
        descricao: '', 
        causas: '', 
        indicadorAntes: '', 
        indicadorMeta: '', 
        metaDescritiva: '', 
        planoAcao: '', 
        tipo: '',
        tipoObjeto: '', // NOVO
        descricaoObjeto: '' // NOVO
    });
    const [editForm, setEditForm] = useState({ id: null, textoOriginal: '', tipo: '' });

    // --- EFEITOS ---
    useEffect(() => {
        localStorage.setItem('ops_logs_vitalicio', JSON.stringify(logs));
        verificarOntem();
    }, [logs]);

    const verificarOntem = () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString(); 

        const errosOntem = logs.filter(l => l.data === dataOntem && l.tipo.includes('Erro'));
        
        if (errosOntem.length > 0) {
            setAlertaOntem(`Morning Call: Ontem tivemos ${errosOntem.length} ocorrências críticas. Verificar passagem de turno.`);
        }
    };

    // --- INTELIGÊNCIA BÁSICA (Categorização) ---
    const analisarTexto = (texto) => {
        const t = texto.toLowerCase();
        let cat = 'Operacional'; // Default
        let tipo = 'Planejamento / Decisão do dia'; // Default
        let cliente = 'Geral';

        // Categorias
        if (t.includes('rh') || t.includes('falt') || t.includes('atestad') || t.includes('ferias')) cat = 'RH';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('veiculo') || t.includes('pneu') || t.includes('motorista')) cat = 'Frota';
        else if (t.includes('qualidade') || t.includes('avaria') || t.includes('devolucao') || t.includes('cliente')) cat = 'Qualidade';
        else if (t.includes('juridico') || t.includes('processo')) cat = 'Jurídico';
        else if (t.includes('logistica') || t.includes('expedicao') || t.includes('recebimento') || t.includes('estoque')) cat = 'Logística';
        else if (t.includes('manutencao') || t.includes('obra')) cat = 'Manutenção';
        else if (t.includes('ti') || t.includes('sistema') || t.includes('net')) cat = 'TI';

        // Tipos (Prioridade para palavras chave se não houver manual)
        if (t.includes('melhoria') || t.includes('ideia') || t.includes('sugestao')) tipo = 'Melhoria / Oportunidade';
        else if (t.includes('erro') || t.includes('falha') || t.includes('esqueci')) tipo = 'Erro / Falha operacional';
        else if (t.includes('alerta') || t.includes('risco') || t.includes('atraso')) tipo = 'Alerta / Risco';
        else if (t.includes('quebra') || t.includes('dano') || t.includes('perda')) tipo = 'Quebra / Perda';
        else if (t.includes('falta') || t.includes('acabou') || t.includes('ruptura')) tipo = 'Ruptura / Disponibilidade';
        else if (t.includes('cliente') || t.includes('reclamacao')) tipo = 'Cliente / Reclamação';
        else if (t.includes('treinamento') || t.includes('curso')) tipo = 'Treinamento / Capacitação';
        
        // Clientes
        if (t.includes('verdemar')) cliente = 'Verdemar';
        else if (t.includes('rena')) cliente = 'Rena';
        else if (t.includes('carrefour')) cliente = 'Carrefour';
        else if (t.includes('epa')) cliente = 'EPA';

        return { categoria: cat, tipoSugerido: tipo, cliente: cliente };
    };

    const registrarNovo = () => {
        if (!inputTexto.trim()) return;
        
        const analise = analisarTexto(inputTexto);
        
        // Se o usuário clicou num botão, usa o tipo dele. Senão, usa a IA.
        const tipoFinal = tipoManual ? tipoManual : analise.tipoSugerido;

        const novoLog = {
            id: Date.now() + Math.random(),
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            timestamp: new Date(),
            textoOriginal: inputTexto,
            categoria: analise.categoria, 
            cliente: analise.cliente,
            tipo: tipoFinal
        };
        setLogs([novoLog, ...logs]);
        setInputTexto('');
        setTipoManual(null); // Reseta o botão
    };

    // --- SELEÇÃO MANUAL (Quick Tags) ---
    const toggleTipoManual = (tipo) => {
        if (tipoManual === tipo) setTipoManual(null);
        else setTipoManual(tipo);
    };

    // --- EDIÇÃO (EM MODAL) ---
    const abrirModalEdicao = (log) => {
        setEditForm({ id: log.id, textoOriginal: log.textoOriginal, tipo: log.tipo });
        setShowEditModal(true);
    };

    const salvarEdicao = () => {
        const analise = analisarTexto(editForm.textoOriginal);
        setLogs(logs.map(log => 
            log.id === editForm.id 
            ? { ...log, textoOriginal: editForm.textoOriginal, tipo: editForm.tipo, categoria: analise.categoria, cliente: analise.cliente } 
            : log
        ));
        setShowEditModal(false);
    };

    const excluirLog = (id) => {
        if(window.confirm('Excluir este registro?')) {
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    // --- PDCA NO FIREBASE COM IA (PREENCHIMENTO INTELIGENTE ATUALIZADO) ---
    const gerarSugestaoPDCA = (texto, tipo) => {
        const t = texto ? texto.toLowerCase() : "";
        
        // Valores Padrão (Fallback)
        let sugestao = { 
            causas: "1. Causa raiz não identificada.\n2. Falta de processo padrão.", 
            plano: "1. Investigar ocorrência.\n2. Definir novo padrão operacional.",
            tipoObjeto: "Processo", // Default
            descObjeto: "Processo Operacional" // Default
        };

        // --- Lógica de Objeto ---
        if (t.includes('caminhao') || t.includes('veiculo') || t.includes('frota')) {
            sugestao.tipoObjeto = "Veículo / Frota";
            sugestao.descObjeto = "Veículo envolvido na ocorrência";
        } else if (t.includes('empilhadeira') || t.includes('maquina') || t.includes('esteira')) {
            sugestao.tipoObjeto = "Equipamento";
            sugestao.descObjeto = "Equipamento em falha";
        } else if (t.includes('sistema') || t.includes('computador') || t.includes('internet') || t.includes('rede')) {
            sugestao.tipoObjeto = "Sistema / TI";
            sugestao.descObjeto = "Sistema ou Hardware";
        } else if (t.includes('colaborador') || t.includes('funcionario') || t.includes('equipe') || t.includes('motorista')) {
            sugestao.tipoObjeto = "Pessoas / Equipe";
            sugestao.descObjeto = "Colaborador ou Turno";
        }

        // --- Lógica de Causas e Plano ---
        if (t.includes('caminhao') || t.includes('frota') || t.includes('pneu') || t.includes('quebra') || t.includes('manutencao')) {
            sugestao.causas = "1. Desgaste natural da peça ou componente.\n2. Falta de manutenção preventiva.\n3. Más condições da via de transporte.";
            sugestao.plano = "1. Enviar veículo para oficina credenciada imediatamente.\n2. Atualizar checklist de saída dos motoristas.\n3. Revisar plano de manutenção da frota.";
        } 
        else if (t.includes('falta') || t.includes('rh') || t.includes('atestad') || t.includes('colaborador') || t.includes('ausencia')) {
            sugestao.causas = "1. Ausência não programada do colaborador.\n2. Falha na comunicação da escala de trabalho.\n3. Imprevisto pessoal ou doença.";
            sugestao.plano = "1. Acionar banco de horas para cobertura de turno.\n2. Realizar realocação interna de equipe.\n3. Agendar conversa de feedback no retorno do colaborador.";
        }
        else if (t.includes('cliente') || t.includes('devolucao') || t.includes('reclama') || t.includes('entrega')) {
            sugestao.causas = "1. Erro operacional na separação do pedido.\n2. Avaria ocorrida durante o transporte.\n3. Divergência de nota fiscal na conferência.";
            sugestao.plano = "1. Contatar cliente para pedido formal de desculpas.\n2. Agendar reposição imediata da mercadoria.\n3. Treinar equipe de expedição nos procedimentos de conferência.";
        }
        else if (t.includes('sistema') || t.includes('internet') || t.includes('travou') || t.includes('ti') || t.includes('lento')) {
            sugestao.causas = "1. Falha momentânea no provedor de serviço.\n2. Sobrecarga no servidor local.\n3. Equipamento obsoleto ou desatualizado.";
            sugestao.plano = "1. Abrir chamado técnico urgente (TI).\n2. Operar em modo de contingência (manual) até o restabelecimento.\n3. Reiniciar equipamentos de rede.";
        }
        else if (tipo && tipo.includes('Melhoria')) {
            sugestao.causas = "Oportunidade de ganho de eficiência detectada na operação.";
            sugestao.plano = "1. Analisar viabilidade técnica e financeira da ideia.\n2. Realizar teste piloto em pequena escala.\n3. Medir resultados e padronizar se positivo.";
        }
        
        return sugestao;
    };

    const abrirModalPDCA = (origem) => {
        let textoBase = '';
        let tipoBase = '';
        let idOrigem = null;

        // CENÁRIO 1: Objeto de Log (Clique no botão de Raio na tabela)
        if (typeof origem === 'object' && origem !== null && origem.textoOriginal) {
            textoBase = origem.textoOriginal;
            tipoBase = origem.tipo;
            idOrigem = origem.id;
        } 
        // CENÁRIO 2: Automático (Botão de Alerta Crítico)
        else if (origem === 'auto') {
            const erroHoje = logs.find(l => l.data === new Date().toLocaleDateString() && l.tipo.includes('Erro'));
            textoBase = erroHoje ? erroHoje.textoOriginal : 'Erro operacional crítico detectado no turno.';
            tipoBase = erroHoje ? erroHoje.tipo : 'Erro / Falha operacional';
            idOrigem = erroHoje ? erroHoje.id : null;
        } 
        // CENÁRIO 3: Manual (Botão Novo PDCA)
        else {
            textoBase = ''; 
            tipoBase = '';
        }

        // GERA A SUGESTÃO INTELIGENTE
        const sugestoes = gerarSugestaoPDCA(textoBase, tipoBase);

        setPdcaForm({
            logId: idOrigem,
            descricao: textoBase,        // Preenche Problema com o texto original
            causas: sugestoes.causas,    // Preenche Causas com a IA
            indicadorAntes: '', 
            indicadorMeta: '',
            metaDescritiva: 'Eliminar a causa raiz e evitar reincidência.',
            planoAcao: sugestoes.plano,   // Preenche Plano com a IA
            tipo: tipoBase, // Guarda o tipo para a lógica de prioridade
            tipoObjeto: sugestoes.tipoObjeto, // NOVO
            descricaoObjeto: sugestoes.descObjeto // NOVO
        });
        setShowPdcaModal(true);
    };

    const confirmarSalvarPDCA = async () => {
        try {
            // 1. Definir Prioridade baseada no tipo (IA Simples)
            let prioridadeSugerida = "Média";
            const tipo = pdcaForm.tipo || ""; 
            
            if (tipo.includes("Erro") || tipo.includes("Ruptura") || tipo.includes("Quebra") || tipo.includes("Falha")) {
                prioridadeSugerida = "Alta";
            }
            if (pdcaForm.descricao.toLowerCase().includes("urgente") || pdcaForm.descricao.toLowerCase().includes("parou") || pdcaForm.descricao.toLowerCase().includes("crítico")) {
                prioridadeSugerida = "Crítica";
            }

            // 2. Calcular Data Alvo
            const dataCalculada = calcularDataAlvo(prioridadeSugerida);

            const novoPDCA = {
                codigo: "OP-" + Math.floor(Math.random() * 10000),
                titulo: pdcaForm.descricao ? `PDCA: ${pdcaForm.descricao.substring(0, 30)}...` : "Novo PDCA Operacional",
                status: "Planejando",
                situacao: "ativo",
                criadoEm: new Date().toISOString(),
                // Removemos 'responsavel' e 'turno' daqui
                plan: {
                    area: "Operações",
                    prioridade: prioridadeSugerida, // Salva a prioridade
                    dataAlvo: dataCalculada,        // Salva a data calculada
                    problema: pdcaForm.descricao,
                    causas: pdcaForm.causas,
                    indicadorAntes: pdcaForm.indicadorAntes,
                    indicadorMeta: pdcaForm.indicadorMeta,
                    meta: pdcaForm.metaDescritiva,
                    planoAcao: pdcaForm.planoAcao,
                    // Novos campos salvos no Plan
                    tipoObjeto: pdcaForm.tipoObjeto,
                    descricaoObjeto: pdcaForm.descricaoObjeto
                }
            };

            await addDoc(collection(db, "pdcas"), novoPDCA);
            setShowPdcaModal(false);
            alert("PDCA criado com sucesso e enviado para o Dashboard!");
        } catch (error) {
            console.error("Erro ao salvar no Firebase:", error);
            alert("Erro ao conectar com o banco de dados.");
        }
    };

    // --- DADOS DO DIA ---
    const hojeData = new Date().toLocaleDateString();
    const logsHoje = logs.filter(l => l.data === hojeData);
    
    const statsHoje = logsHoje.reduce((acc, log) => {
        if (!acc[log.categoria]) acc[log.categoria] = { total: 0, erros: 0 };
        acc[log.categoria].total += 1;
        if (log.tipo.includes('Erro') || log.tipo.includes('Falha')) acc[log.categoria].erros += 1;
        return acc;
    }, {});

    const temErroHoje = logsHoje.some(l => l.tipo.includes('Erro'));
    let score = 100;
    logsHoje.forEach(l => {
        if (l.tipo.includes('Erro')) score -= 20;
        if (l.tipo.includes('Alerta')) score -= 10;
    });
    if (score < 0) score = 0;

    const getBadgeClass = (tipo) => {
        if(!tipo) return 'badge-Outros';
        if(tipo.includes('Erro') || tipo.includes('Falha')) return 'badge-Erro';
        if(tipo.includes('Alerta') || tipo.includes('Risco')) return 'badge-Alerta';
        if(tipo.includes('Melhoria') || tipo.includes('Positivo') || tipo.includes('Resultado')) return 'badge-Melhoria';
        if(tipo.includes('Quebra') || tipo.includes('Perda')) return 'badge-Quebra';
        if(tipo.includes('Ruptura')) return 'badge-Ruptura';
        if(tipo.includes('Cliente')) return 'badge-Cliente';
        if(tipo.includes('Treinamento')) return 'badge-Treinamento';
        if(tipo.includes('Planejamento')) return 'badge-Planejamento';
        if(tipo.includes('Evento')) return 'badge-Evento';
        if(tipo.includes('WhatsApp')) return 'badge-WhatsApp';
        return 'badge-Outros';
    };

    const gerarDadosOntem = () => {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString();
        const logsTeste = [{ id: Date.now() + Math.random(), data: dataOntem, hora: '14:30:00', tipo: 'Erro / Falha operacional', categoria: 'RH', cliente: 'Geral', textoOriginal: 'Falta de pessoal na expedição noturna' }];
        setLogs([...logs, ...logsTeste]);
        alert("Dados de ontem gerados! O Morning Call deve aparecer.");
    };

    // --- SIMULAÇÃO DE WHATSAPP (INTEGRAÇÃO Z-API) ---
    const simularMensagemWhatsApp = () => {
        const mensagensExemplo = [
            "Esteira 03 parou de funcionar agora - Enviado por João (Manutenção)",
            "Caminhão da Placa HGB-1234 chegou com atraso de 2h - Enviado por Portaria",
            "Falta de energia no setor B - Enviado por Segurança",
            "Cliente Verdemar reclamou da entrega de ontem - Enviado por SAC"
        ];
        const msgAleatoria = mensagensExemplo[Math.floor(Math.random() * mensagensExemplo.length)];
        
        const novoLogZap = {
            id: Date.now() + Math.random(),
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            timestamp: new Date(),
            textoOriginal: `[WhatsApp] ${msgAleatoria}`,
            categoria: 'Comunicação / WhatsApp',
            cliente: 'Geral',
            tipo: 'Alerta / Risco'
        };
        setLogs([novoLogZap, ...logs]);
        alert("Nova mensagem recebida via WhatsApp!");
    };

    return (
        <div className="app-root">
            <style>{styles}</style>

            <div className="header">
                <div>
                    <h1 style={{margin:0, fontSize:'20px'}}>Diário de Operações</h1>
                    <span style={{color:'#666', fontSize:'13px'}}>{new Date().toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}</span>
                    <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                        <button onClick={gerarDadosOntem} style={{fontSize:'10px', cursor:'pointer', border:'1px dashed #ccc', background:'none'}}>Teste Morning Call</button>
                        <button onClick={simularMensagemWhatsApp} style={{fontSize:'10px', cursor:'pointer', border:'1px solid #25D366', color:'#25D366', background:'white', borderRadius:'4px', display:'flex', alignItems:'center', gap:'4px'}}>
                            <IconWhatsapp /> Simular Msg WhatsApp
                        </button>
                    </div>
                </div>
                <div className="score-box">
                    <span className="score-value" style={{color: score > 70 ? '#16a34a' : '#dc2626'}}>{score}%</span>
                    <span className="score-label">Saúde Operacional</span>
                </div>
            </div>

            {alertaOntem && (
                <div className="morning-alert">
                    <IconAlert /> <strong>{alertaOntem}</strong>
                </div>
            )}

            <div className="kpi-grid">
                {Object.keys(statsHoje).length === 0 ? (
                    <div className="empty-kpi">Ainda não há registros hoje.</div>
                ) : (
                    Object.entries(statsHoje).map(([cat, dados]) => (
                        <div className="kpi-card" key={cat}>
                            <div className="kpi-indicator" style={{background: dados.erros > 0 ? '#dc2626' : '#16a34a'}}></div>
                            <h3>{cat}</h3>
                            <span className="kpi-value">
                                {dados.erros > 0 ? dados.erros : <IconCheck style={{color:'#16a34a'}}/>} 
                                <span style={{fontSize:'12px', fontWeight:'400', color:'#888', marginLeft:'5px'}}>
                                    {dados.erros === 1 ? 'Erro' : 'Erros'}
                                </span>
                            </span>
                        </div>
                    ))
                )}
            </div>

            <div className="main-grid">
                <div className="smart-input-container">
                    <div className="smart-header">
                        <h3><IconCheck/> Registro Rápido</h3>
                    </div>
                    <textarea 
                        className="main-textarea"
                        placeholder="Descreva o fato... (Ex: Faltou colaborador na expedição...)"
                        value={inputTexto}
                        onChange={(e) => setInputTexto(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), registrarNovo())}
                    />
                    
                    {/* --- BOTÕES DE SELEÇÃO RÁPIDA --- */}
                    <div className="quick-tags">
                        <div 
                            className={`tag-chip ${tipoManual === 'Melhoria / Oportunidade' ? 'active-ideia' : ''}`} 
                            onClick={() => toggleTipoManual('Melhoria / Oportunidade')}
                        >
                            <IconLightbulb /> Ideia / Melhoria
                        </div>
                        <div 
                            className={`tag-chip ${tipoManual === 'Erro / Falha operacional' ? 'active-erro' : ''}`} 
                            onClick={() => toggleTipoManual('Erro / Falha operacional')}
                        >
                            <IconAlert /> Erro / Falha
                        </div>
                        <div 
                            className={`tag-chip ${tipoManual === null ? 'active-normal' : ''}`} 
                            onClick={() => setTipoManual(null)}
                        >
                            🤖 Auto (IA)
                        </div>
                    </div>
                    {/* ---------------------------------- */}

                    <button className="btn-magic" onClick={registrarNovo}>Registrar Ocorrência</button>
                    <div style={{fontSize:'11px', color:'#9ca3af', marginTop:'10px', textAlign:'center'}}>
                        {tipoManual ? `Tipo fixado: ${tipoManual}` : "A IA detecta a Categoria e o Tipo automaticamente."}
                    </div>
                </div>

                <div className="intelligence-card">
                    <div className="intelligence-header"><IconBrain /> <span>Inteligência do Dia</span></div>
                    {temErroHoje ? (
                        <div className="alert-box alert-critical">
                            <strong>⚠️ Padrão Crítico Detectado</strong>
                            <p>Identificamos erros hoje. O score caiu.</p>
                            <button className="btn-pdca-auto" onClick={() => abrirModalPDCA('auto')}>
                                <IconBolt /> Gerar PDCA Automático
                            </button>
                        </div>
                    ) : (
                        <div className="alert-box alert-clean">
                            <strong>✅ Operação Estável</strong>
                            <p>Nenhum erro crítico registrado hoje.</p>
                        </div>
                    )}
                    <div className="history-stat">Total Histórico: {logs.length} registros</div>
                </div>
            </div>

            <div className="timeline-card">
                <div className="timeline-header">
                    <h3 style={{margin:0}}>Timeline & Histórico</h3>
                    <div className="timeline-actions">
                        <button className="btn-new-pdca" onClick={() => abrirModalPDCA('manual')}>
                            <IconPlus/> Novo PDCA
                        </button>
                        <button onClick={() => {if(window.confirm('Limpar histórico vitalício?')) setLogs([])}} style={{background:'none', border:'none', fontSize:'11px', color:'#999', cursor:'pointer'}}>Limpar</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr><th style={{width:'140px'}}>Data/Hora</th><th>Cat.</th><th>Tipo</th><th>Descrição</th><th style={{width:'120px'}}>Ações</th></tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td><div style={{fontWeight:'bold'}}>{log.data}</div><div style={{fontSize:'11px', color:'#888'}}>{log.hora}</div></td>
                                <td>{log.categoria}</td>
                                <td><span className={`badge ${getBadgeClass(log.tipo)}`}>{log.tipo}</span></td>
                                <td><b>{log.cliente}:</b> {log.textoOriginal}</td>
                                <td>
                                    <div className="actions">
                                        {/* Botão de Ação PDCA na Linha */}
                                        <button className="icon-btn btn-row-pdca" title="Gerar PDCA com IA" onClick={() => abrirModalPDCA(log)}>
                                            <IconBolt width="14" height="14" />
                                        </button>
                                        <button className="icon-btn icon-edit" title="Editar" onClick={() => abrirModalEdicao(log)}><IconEdit /></button>
                                        <button className="icon-btn icon-del" title="Excluir" onClick={() => excluirLog(log.id)}><IconTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL EDIÇÃO */}
            {showEditModal && (
                <div className="modal-overlay">
                    <section className="modal-card">
                        <div className="card-header-styled"><h2>Editar Registro</h2><button onClick={() => setShowEditModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><IconX/></button></div>
                        <div className="card-content">
                            <div><label className="modal-label">Descrição</label><textarea className="modal-textarea" rows="3" value={editForm.textoOriginal} onChange={(e) => setEditForm({...editForm, textoOriginal: e.target.value})} /></div>
                            <div>
                                <label className="modal-label">Classificação</label>
                                <select className="type-selector" value={editForm.tipo} onChange={(e) => setEditForm({...editForm, tipo: e.target.value})}>
                                    {TIPOS_OCORRENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="section-actions"><button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button><button className="btn-primary" onClick={salvarEdicao}>Salvar</button></div>
                        </div>
                    </section>
                </div>
            )}

            {/* MODAL PDCA COM IA PREENCHIDA E CAMPOS EXTRAS */}
            {showPdcaModal && (
                <div className="modal-overlay">
                    <section className="modal-card plan-card">
                        <div className="card-header-styled">
                            <h2><IconBrain color="#6366f1"/> Novo PDCA <span className="ai-badge">IA Auto-fill</span></h2>
                            <button onClick={() => setShowPdcaModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><IconX/></button>
                        </div>
                        <div className="card-content">
                            <div>
                                <label className="modal-label">Problema (Fato)</label>
                                <textarea className="modal-textarea" rows="2" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({...pdcaForm, descricao: e.target.value})} />
                            </div>
                            
                            {/* NOVOS CAMPOS: Tipo e Descrição do Objeto */}
                            <div className="form-grid-2">
                                <div>
                                    <label className="modal-label">Tipo Objeto (IA)</label>
                                    <input className="modal-textarea" style={{minHeight:'40px'}} value={pdcaForm.tipoObjeto} onChange={(e) => setPdcaForm({...pdcaForm, tipoObjeto: e.target.value})} />
                                </div>
                                <div>
                                    <label className="modal-label">Desc. Objeto (IA)</label>
                                    <input className="modal-textarea" style={{minHeight:'40px'}} value={pdcaForm.descricaoObjeto} onChange={(e) => setPdcaForm({...pdcaForm, descricaoObjeto: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="modal-label">Causas (Sugestão IA)</label>
                                <textarea className="modal-textarea" rows="3" style={{background: '#fcfaff', borderColor: '#e0e7ff'}} value={pdcaForm.causas} onChange={(e) => setPdcaForm({...pdcaForm, causas: e.target.value})} />
                            </div>
                            <div className="form-grid-2">
                                <div><label className="modal-label">Indicador Antes</label><input className="modal-textarea" style={{minHeight:'40px'}} value={pdcaForm.indicadorAntes} onChange={(e) => setPdcaForm({...pdcaForm, indicadorAntes: e.target.value})} /></div>
                                <div><label className="modal-label">Indicador Meta</label><input className="modal-textarea" style={{minHeight:'40px'}} value={pdcaForm.indicadorMeta} onChange={(e) => setPdcaForm({...pdcaForm, indicadorMeta: e.target.value})} /></div>
                            </div>
                            <div><label className="modal-label">Meta (Descritiva)</label><input className="modal-textarea" style={{minHeight:'40px'}} value={pdcaForm.metaDescritiva} onChange={(e) => setPdcaForm({...pdcaForm, metaDescritiva: e.target.value})} /></div>
                            <div>
                                <label className="modal-label">Plano de Ação (Sugestão IA)</label>
                                <textarea className="modal-textarea" rows="4" style={{background: '#fcfaff', borderColor: '#e0e7ff'}} value={pdcaForm.planoAcao} onChange={(e) => setPdcaForm({...pdcaForm, planoAcao: e.target.value})} />
                            </div>
                            <div className="section-actions">
                                <button className="btn-secondary" onClick={() => setShowPdcaModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={confirmarSalvarPDCA}>Criar PDCA</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}