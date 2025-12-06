import React, { useState, useEffect } from 'react';
// Importamos funções de Tempo Real do Firebase
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, updateDoc, doc } from "firebase/firestore"; 
import { db } from "../firebase"; 

// --- ÍCONES SVG (Mantidos iguais) ---
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
    return hoje.toISOString().split('T')[0];
}

export function OperationsLogPage() {

    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; }
        .app-root { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; }
        
        /* ALERTAS */
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .alert-box { padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        /* HEADER & KPI */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; color: #888; }
        
        .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; }
        .kpi-card { flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }

        /* INPUT AREA */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; outline: none; min-height: 100px; margin-top:10px; }
        .main-textarea:focus { border-color: var(--primary); }
        
        .quick-tags { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .tag-chip { border: 1px solid #e5e7eb; background: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .tag-chip.active-erro { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .tag-chip.active-ideia { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
        .tag-chip.active-normal { background: #eff6ff; color: #2563eb; border-color: #93c5fd; }
        
        .btn-magic { background: #111827; color: white; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; }
        
        .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .btn-pdca-auto { background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; }

        /* TABLE */
        .timeline-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
        .timeline-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        
        .badge { padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 10px; color: white; display: inline-block; }
        .badge-Erro { background: var(--danger); } 
        .badge-Alerta { background: var(--warning); } 
        .badge-Melhoria { background: var(--success); }
        .badge-Quebra { background: #7c3aed; }
        .badge-Ruptura { background: #db2777; }
        .badge-WhatsApp { background: #25D366; }
        .badge-Outros { background: #9ca3af; }

        .actions { display: flex; gap: 6px; }
        .icon-btn { border: none; background: none; cursor: pointer; padding: 5px; color: #9ca3af; }
        .btn-row-pdca { color: var(--primary); background: #eff6ff; border-radius: 4px; padding: 4px; }
        .btn-new-pdca { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 5px; }

        /* MODAL */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-card { background: white; width: 95%; max-width: 650px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.1); display: flex; flex-direction: column; max-height: 90vh; }
        .card-header-styled { background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .card-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .modal-label { font-size: 12px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px; }
        .modal-textarea { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-primary { background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } }
    `;

    // --- ESTADOS ---
    const [logs, setLogs] = useState([]);
    const [inputTexto, setInputTexto] = useState('');
    const [tipoManual, setTipoManual] = useState(null); 
    const [alertaOntem, setAlertaOntem] = useState(null);
    
    // Modais
    const [showPdcaModal, setShowPdcaModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Forms
    const [pdcaForm, setPdcaForm] = useState({ 
        logId: null, descricao: '', causas: '', indicadorAntes: '', indicadorMeta: '', 
        metaDescritiva: '', planoAcao: '', tipo: '', tipoObjeto: '', descricaoObjeto: '' 
    });
    const [editForm, setEditForm] = useState({ id: null, textoOriginal: '', tipo: '' });

    // --- FIREBASE LISTENER (TEMPO REAL) ---
    useEffect(() => {
        // Conecta ao Firestore e fica ouvindo mudanças na coleção "logs_operacionais"
        const q = query(collection(db, "logs_operacionais"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setLogs(logsData);
            verificarOntem(logsData);
        });
        return () => unsubscribe();
    }, []);

    const verificarOntem = (dadosLogs) => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString('pt-BR'); 

        const errosOntem = dadosLogs.filter(l => l.data === dataOntem && l.tipo.includes('Erro'));
        if (errosOntem.length > 0) {
            setAlertaOntem(`Morning Call: Ontem tivemos ${errosOntem.length} ocorrências críticas.`);
        } else {
            setAlertaOntem(null);
        }
    };

    // --- INTELIGÊNCIA ---
    const analisarTexto = (texto) => {
        const t = texto.toLowerCase();
        let cat = 'Operacional'; 
        let tipo = 'Planejamento / Decisão do dia'; 
        let cliente = 'Geral';

        if (t.includes('rh') || t.includes('falt') || t.includes('atestad')) cat = 'RH';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('pneu')) cat = 'Frota';
        else if (t.includes('qualidade') || t.includes('avaria') || t.includes('cliente')) cat = 'Qualidade';
        else if (t.includes('logistica') || t.includes('expedicao') || t.includes('estoque')) cat = 'Logística';
        else if (t.includes('manutencao') || t.includes('obra')) cat = 'Manutenção';
        else if (t.includes('ti') || t.includes('sistema') || t.includes('net')) cat = 'TI';

        if (t.includes('melhoria') || t.includes('ideia')) tipo = 'Melhoria / Oportunidade';
        else if (t.includes('erro') || t.includes('falha')) tipo = 'Erro / Falha operacional';
        else if (t.includes('alerta') || t.includes('risco')) tipo = 'Alerta / Risco';
        else if (t.includes('quebra') || t.includes('dano')) tipo = 'Quebra / Perda';
        else if (t.includes('falta') || t.includes('acabou')) tipo = 'Ruptura / Disponibilidade';
        
        if (t.includes('verdemar')) cliente = 'Verdemar';
        else if (t.includes('carrefour')) cliente = 'Carrefour';

        return { categoria: cat, tipoSugerido: tipo, cliente: cliente };
    };

    const registrarNovo = async () => {
        if (!inputTexto.trim()) return;
        const analise = analisarTexto(inputTexto);
        const tipoFinal = tipoManual ? tipoManual : analise.tipoSugerido;

        try {
            await addDoc(collection(db, "logs_operacionais"), {
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR'),
                timestamp: new Date(),
                textoOriginal: inputTexto,
                categoria: analise.categoria, 
                cliente: analise.cliente,
                tipo: tipoFinal
            });
            setInputTexto('');
            setTipoManual(null);
        } catch (e) {
            console.error("Erro ao adicionar:", e);
            alert("Erro ao salvar no banco de dados.");
        }
    };

    const toggleTipoManual = (tipo) => {
        if (tipoManual === tipo) setTipoManual(null);
        else setTipoManual(tipo);
    };

    // --- EDIÇÃO / EXCLUSÃO ---
    const abrirModalEdicao = (log) => {
        setEditForm({ id: log.id, textoOriginal: log.textoOriginal, tipo: log.tipo });
        setShowEditModal(true);
    };

    const salvarEdicao = async () => {
        const analise = analisarTexto(editForm.textoOriginal);
        try {
            await updateDoc(doc(db, "logs_operacionais", editForm.id), {
                textoOriginal: editForm.textoOriginal,
                tipo: editForm.tipo,
                categoria: analise.categoria,
                cliente: analise.cliente
            });
            setShowEditModal(false);
        } catch (e) { alert("Erro ao editar."); }
    };

    const excluirLog = async (id) => {
        if(window.confirm('Excluir este registro permanentemente?')) {
            try {
                await deleteDoc(doc(db, "logs_operacionais", id));
            } catch (e) { alert("Erro ao excluir."); }
        }
    };

    // --- PDCA ---
    const gerarSugestaoPDCA = (texto, tipo) => {
        const t = texto ? texto.toLowerCase() : "";
        let sugestao = { 
            causas: "1. Causa raiz não identificada.", 
            plano: "1. Investigar ocorrência.",
            tipoObjeto: "Processo", 
            descObjeto: "Processo Geral" 
        };

        // Objeto
        if (t.includes('caminhao') || t.includes('veiculo')) {
            sugestao.tipoObjeto = "Veículo / Frota";
            sugestao.descObjeto = "Veículo da Ocorrência";
        } else if (t.includes('sistema') || t.includes('internet')) {
            sugestao.tipoObjeto = "TI / Sistema";
            sugestao.descObjeto = "Sistema ou Rede";
        } else if (t.includes('colaborador') || t.includes('falt')) {
            sugestao.tipoObjeto = "RH / Pessoas";
            sugestao.descObjeto = "Colaborador";
        }

        // Planos
        if (t.includes('manutencao') || t.includes('quebra')) {
            sugestao.causas = "1. Desgaste de peças.\n2. Falta de preventiva.";
            sugestao.plano = "1. Enviar para manutenção.\n2. Revisar checklist.";
        } else if (t.includes('falta') || t.includes('rh')) {
            sugestao.causas = "1. Ausência não programada.";
            sugestao.plano = "1. Realocar equipe.\n2. Aplicar feedback.";
        }

        return sugestao;
    };

    const abrirModalPDCA = (origem) => {
        let textoBase = '', tipoBase = '', idOrigem = null;

        if (typeof origem === 'object' && origem !== null && origem.textoOriginal) {
            textoBase = origem.textoOriginal; tipoBase = origem.tipo; idOrigem = origem.id;
        } else if (origem === 'auto') {
            const erroHoje = logs.find(l => l.data === new Date().toLocaleDateString('pt-BR') && l.tipo.includes('Erro'));
            textoBase = erroHoje ? erroHoje.textoOriginal : 'Erro crítico do dia.';
            tipoBase = erroHoje ? erroHoje.tipo : 'Erro Operacional';
        }

        const sugestoes = gerarSugestaoPDCA(textoBase, tipoBase);

        setPdcaForm({
            logId: idOrigem,
            descricao: textoBase,
            causas: sugestoes.causas,
            indicadorAntes: '', indicadorMeta: '', metaDescritiva: '', 
            planoAcao: sugestoes.plano,
            tipo: tipoBase,
            tipoObjeto: sugestoes.tipoObjeto,
            descricaoObjeto: sugestoes.descObjeto
        });
        setShowPdcaModal(true);
    };

    const confirmarSalvarPDCA = async () => {
        try {
            let prioridadeSugerida = "Média";
            const tipo = pdcaForm.tipo || "";
            if (tipo.includes("Erro") || tipo.includes("Quebra")) prioridadeSugerida = "Alta";
            if (pdcaForm.descricao.toLowerCase().includes("urgente")) prioridadeSugerida = "Crítica";

            const dataCalculada = calcularDataAlvo(prioridadeSugerida);

            await addDoc(collection(db, "pdcas"), {
                codigo: "OP-" + Math.floor(Math.random() * 10000),
                titulo: pdcaForm.descricao ? `PDCA: ${pdcaForm.descricao.substring(0, 30)}...` : "Novo PDCA",
                status: "Planejando",
                situacao: "ativo",
                criadoEm: new Date().toISOString(),
                plan: {
                    area: "Operações",
                    prioridade: prioridadeSugerida,
                    dataAlvo: dataCalculada,
                    problema: pdcaForm.descricao,
                    causas: pdcaForm.causas,
                    indicadorAntes: pdcaForm.indicadorAntes,
                    indicadorMeta: pdcaForm.indicadorMeta,
                    meta: pdcaForm.metaDescritiva,
                    planoAcao: pdcaForm.planoAcao,
                    tipoObjeto: pdcaForm.tipoObjeto,
                    descricaoObjeto: pdcaForm.descricaoObjeto
                }
            });
            setShowPdcaModal(false);
            alert("PDCA criado com sucesso no Banco de Dados!");
        } catch (error) {
            console.error("Erro:", error);
            alert("Erro ao salvar PDCA.");
        }
    };

    // --- KPI ---
    const hojeData = new Date().toLocaleDateString('pt-BR');
    const logsHoje = logs.filter(l => l.data === hojeData);
    const statsHoje = logsHoje.reduce((acc, log) => {
        if (!acc[log.categoria]) acc[log.categoria] = { total: 0, erros: 0 };
        acc[log.categoria].total += 1;
        if (log.tipo.includes('Erro') || log.tipo.includes('Falha')) acc[log.categoria].erros += 1;
        return acc;
    }, {});
    const temErroHoje = logsHoje.some(l => l.tipo.includes('Erro'));
    let score = 100;
    logsHoje.forEach(l => { if (l.tipo.includes('Erro')) score -= 20; if (l.tipo.includes('Alerta')) score -= 10; });
    if (score < 0) score = 0;

    const getBadgeClass = (tipo) => {
        if(!tipo) return 'badge-Outros';
        if(tipo.includes('Erro')) return 'badge-Erro';
        if(tipo.includes('Alerta')) return 'badge-Alerta';
        if(tipo.includes('Melhoria')) return 'badge-Melhoria';
        if(tipo.includes('Quebra')) return 'badge-Quebra';
        if(tipo.includes('WhatsApp')) return 'badge-WhatsApp';
        return 'badge-Outros';
    };

    return (
        <div className="app-root">
            <style>{styles}</style>

            <div className="header">
                <div>
                    <h1 style={{margin:0, fontSize:'20px'}}>Diário de Operações (Conectado)</h1>
                    <span style={{color:'#666', fontSize:'13px'}}>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="score-box">
                    <span className="score-value" style={{color: score > 70 ? '#16a34a' : '#dc2626'}}>{score}%</span>
                    <span className="score-label">Saúde Operacional</span>
                </div>
            </div>

            {alertaOntem && <div className="morning-alert"><IconAlert /> <strong>{alertaOntem}</strong></div>}

            <div className="kpi-grid">
                {Object.keys(statsHoje).length === 0 ? (
                    <div className="empty-kpi">Aguardando registros hoje...</div>
                ) : (
                    Object.entries(statsHoje).map(([cat, dados]) => (
                        <div className="kpi-card" key={cat}>
                            <div className="kpi-indicator" style={{background: dados.erros > 0 ? '#dc2626' : '#16a34a'}}></div>
                            <h3>{cat}</h3>
                            <span className="kpi-value">{dados.erros > 0 ? dados.erros : <IconCheck style={{color:'#16a34a'}}/>}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="main-grid">
                <div className="smart-input-container">
                    <div className="smart-header"><h3><IconCheck/> Registro Rápido</h3></div>
                    <textarea 
                        className="main-textarea"
                        placeholder="Descreva o fato..."
                        value={inputTexto}
                        onChange={(e) => setInputTexto(e.target.value)}
                    />
                    <div className="quick-tags">
                        <div className={`tag-chip ${tipoManual === 'Melhoria / Oportunidade' ? 'active-ideia' : ''}`} onClick={() => toggleTipoManual('Melhoria / Oportunidade')}><IconLightbulb /> Ideia</div>
                        <div className={`tag-chip ${tipoManual === 'Erro / Falha operacional' ? 'active-erro' : ''}`} onClick={() => toggleTipoManual('Erro / Falha operacional')}><IconAlert /> Erro</div>
                        <div className={`tag-chip ${tipoManual === null ? 'active-normal' : ''}`} onClick={() => setTipoManual(null)}>🤖 Auto</div>
                    </div>
                    <button className="btn-magic" onClick={registrarNovo}>Registrar (Salvar na Nuvem)</button>
                </div>

                <div className="intelligence-card">
                    <div className="intelligence-header"><IconBrain /> <span>Inteligência</span></div>
                    {temErroHoje ? (
                        <div className="alert-box alert-critical">
                            <strong>⚠️ Atenção</strong><p>Identificamos erros hoje.</p>
                            <button className="btn-pdca-auto" onClick={() => abrirModalPDCA('auto')}><IconBolt /> Gerar PDCA</button>
                        </div>
                    ) : (
                        <div className="alert-box alert-clean"><strong>✅ Tudo Certo</strong><p>Sem erros críticos.</p></div>
                    )}
                    <div className="history-stat">Total: {logs.length} registros</div>
                </div>
            </div>

            <div className="timeline-card">
                <div className="timeline-header">
                    <h3 style={{margin:0}}>Linha do Tempo (Tempo Real)</h3>
                    <div className="timeline-actions">
                        <button className="btn-new-pdca" onClick={() => abrirModalPDCA('manual')}><IconPlus/> Novo PDCA</button>
                    </div>
                </div>
                <table>
                    <thead><tr><th style={{width:'120px'}}>Data</th><th>Cat.</th><th>Tipo</th><th>Descrição</th><th style={{width:'100px'}}>Ações</th></tr></thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td><b>{log.data}</b><br/><span style={{fontSize:'11px', color:'#888'}}>{log.hora}</span></td>
                                <td>{log.categoria}</td>
                                <td><span className={`badge ${getBadgeClass(log.tipo)}`}>{log.tipo}</span></td>
                                <td>{log.textoOriginal}</td>
                                <td>
                                    <div className="actions">
                                        <button className="icon-btn btn-row-pdca" onClick={() => abrirModalPDCA(log)}><IconBolt width="14"/></button>
                                        <button className="icon-btn icon-edit" onClick={() => abrirModalEdicao(log)}><IconEdit /></button>
                                        <button className="icon-btn icon-del" onClick={() => excluirLog(log.id)}><IconTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL PDCA */}
            {showPdcaModal && (
                <div className="modal-overlay">
                    <section className="modal-card plan-card">
                        <div className="card-header-styled"><h2>Novo PDCA (IA)</h2><button onClick={() => setShowPdcaModal(false)} style={{border:'none', background:'none'}}><IconX/></button></div>
                        <div className="card-content">
                            <label className="modal-label">Problema</label><textarea className="modal-textarea" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({...pdcaForm, descricao: e.target.value})} />
                            <div className="form-grid-2">
                                <div><label className="modal-label">Tipo Objeto</label><input className="modal-textarea" value={pdcaForm.tipoObjeto} onChange={(e) => setPdcaForm({...pdcaForm, tipoObjeto: e.target.value})} /></div>
                                <div><label className="modal-label">Desc. Objeto</label><input className="modal-textarea" value={pdcaForm.descricaoObjeto} onChange={(e) => setPdcaForm({...pdcaForm, descricaoObjeto: e.target.value})} /></div>
                            </div>
                            <label className="modal-label">Causas</label><textarea className="modal-textarea" value={pdcaForm.causas} onChange={(e) => setPdcaForm({...pdcaForm, causas: e.target.value})} />
                            <label className="modal-label">Plano de Ação</label><textarea className="modal-textarea" value={pdcaForm.planoAcao} onChange={(e) => setPdcaForm({...pdcaForm, planoAcao: e.target.value})} />
                            <div className="section-actions"><button className="btn-primary" onClick={confirmarSalvarPDCA}>Criar</button></div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}