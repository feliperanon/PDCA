import React, { useState, useEffect } from 'react';

// --- ÍCONES SVG ---
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;

// --- LISTA DE TIPOS ---
const TIPOS_OCORRENCIA = [
    "Erro / Falha operacional",
    "Melhoria / Oportunidade",
    "Alerta / Risco",
    "Quebra / Perda",
    "Ruptura / Disponibilidade",
    "Cliente / Reclamação",
    "Treinamento / Capacitação",
    "Indicador positivo / Resultado",
    "Planejamento / Decisão do dia",
    "Evento externo / Fator externo"
];

export function OperationsLogPage() {

    // --- CSS ---
    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1100px; margin: 0 auto; padding: 20px; }
        
        /* Morning Call */
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.5s; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-box { text-align: center; }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

        /* KPIs Dinâmicos */
        .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; }
        .kpi-card { flex: 1; min-width: 150px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; animation: slideIn 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }
        .empty-kpi { width: 100%; text-align: center; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; color: #999; font-size: 13px; }

        /* Grid Principal */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }

        /* Input Inteligente (Limpo) */
        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); position: relative; display: flex; flex-direction: column; height: 100%; }
        .smart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .smart-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 100px; flex-grow: 1; }
        .main-textarea:focus { border-color: var(--primary); }
        
        .btn-magic { background: #111827; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .btn-magic:hover { background: #000; }

        /* Painel Inteligência */
        .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .intelligence-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: #374151; font-weight: 600; }
        .alert-box { padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .btn-pdca-auto { background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2); }
        .history-stat { margin-top: auto; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; }

        /* Timeline */
        .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:hover { background: #f9fafb; }
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
        
        .actions { display: flex; gap: 8px; }
        .icon-btn { border: none; background: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #9ca3af; transition: all 0.2s; }
        .icon-btn:hover { background: #f3f4f6; color: #111827; }
        .icon-edit:hover { color: var(--primary); background: #eff6ff; }
        .icon-del:hover { color: var(--danger); background: #fef2f2; }

        /* Modais (PDCA e Edição) */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
        .modal-card { background: white; width: 95%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s; display: flex; flex-direction: column; max-height: 90vh; }
        
        .card-header-styled { background: #f8fafc; padding: 15px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h2 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
        .card-content { padding: 25px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; }
        .card-content label { font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px; }
        .card-content textarea, .card-content input, .card-content select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1e293b; background: #f8fafc; }
        
        .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } .kpi-grid { flex-direction: column; } }
    `;

    // --- ESTADOS ---
    const [logs, setLogs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ops_logs_vitalicio')) || []; } catch { return []; }
    });
    const [pdcas, setPdcas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ops_pdcas')) || []; } catch { return []; }
    });

    const [inputTexto, setInputTexto] = useState('');
    const [alertaOntem, setAlertaOntem] = useState(null);
    
    // Controle de Modais
    const [showPdcaModal, setShowPdcaModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Formulários
    const [pdcaForm, setPdcaForm] = useState({ logId: null, descricao: '', causas: '', indicadorAntes: '', indicadorMeta: '', metaDescritiva: '', planoAcao: '' });
    const [editForm, setEditForm] = useState({ id: null, textoOriginal: '', tipo: '' });

    // --- EFEITOS ---
    useEffect(() => {
        localStorage.setItem('ops_logs_vitalicio', JSON.stringify(logs));
        localStorage.setItem('ops_pdcas', JSON.stringify(pdcas));
        verificarOntem();
    }, [logs, pdcas]);

    const verificarOntem = () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString(); 

        const errosOntem = logs.filter(l => l.data === dataOntem && l.tipo.includes('Erro'));
        
        if (errosOntem.length > 0) {
            setAlertaOntem(`Morning Call: Ontem tivemos ${errosOntem.length} ocorrências críticas.`);
        }
    };

    // --- INTELIGÊNCIA ---
    const analisarTexto = (texto) => {
        const t = texto.toLowerCase();
        let cat = 'Operacional'; // Default
        let tipo = 'Erro / Falha operacional'; // Default
        let cliente = 'Geral';

        // Categorias
        if (t.includes('rh') || t.includes('falt') || t.includes('atestad') || t.includes('ferias')) cat = 'RH';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('veiculo') || t.includes('pneu') || t.includes('motorista')) cat = 'Frota';
        else if (t.includes('qualidade') || t.includes('avaria') || t.includes('devolucao') || t.includes('cliente')) cat = 'Qualidade';
        else if (t.includes('juridico') || t.includes('processo')) cat = 'Jurídico';
        else if (t.includes('logistica') || t.includes('expedicao') || t.includes('recebimento') || t.includes('estoque')) cat = 'Logística';
        else if (t.includes('manutencao') || t.includes('obra')) cat = 'Manutenção';
        else if (t.includes('ti') || t.includes('sistema') || t.includes('net')) cat = 'TI';

        // Tipos
        if (t.includes('melhoria') || t.includes('ideia')) tipo = 'Melhoria / Oportunidade';
        else if (t.includes('alerta') || t.includes('risco') || t.includes('atraso')) tipo = 'Alerta / Risco';
        else if (t.includes('quebra') || t.includes('dano') || t.includes('perda')) tipo = 'Quebra / Perda';
        else if (t.includes('ruptura') || t.includes('indisponivel') || t.includes('falta')) tipo = 'Ruptura / Disponibilidade';
        else if (t.includes('cliente') || t.includes('reclamacao')) tipo = 'Cliente / Reclamação';
        else if (t.includes('treinamento') || t.includes('curso')) tipo = 'Treinamento / Capacitação';
        else if (t.includes('resultado') || t.includes('recorde') || t.includes('meta')) tipo = 'Indicador positivo / Resultado';
        else if (t.includes('planejamento') || t.includes('decisao')) tipo = 'Planejamento / Decisão do dia';
        else if (t.includes('chuva') || t.includes('transito') || t.includes('greve')) tipo = 'Evento externo / Fator externo';
        
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
        
        const novoLog = {
            id: Date.now(),
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            timestamp: new Date(),
            textoOriginal: inputTexto,
            categoria: analise.categoria,
            cliente: analise.cliente,
            tipo: analise.tipoSugerido
        };

        setLogs([novoLog, ...logs]);
        setInputTexto('');
    };

    // --- EDIÇÃO (AGORA EM MODAL) ---
    const abrirModalEdicao = (log) => {
        setEditForm({
            id: log.id,
            textoOriginal: log.textoOriginal,
            tipo: log.tipo
        });
        setShowEditModal(true);
    };

    const salvarEdicao = () => {
        // Reanalisa a categoria/cliente baseado no novo texto, mas mantém o tipo escolhido
        const analise = analisarTexto(editForm.textoOriginal);
        
        setLogs(logs.map(log => 
            log.id === editForm.id 
            ? { ...log, textoOriginal: editForm.textoOriginal, tipo: editForm.tipo, categoria: analise.categoria, cliente: analise.cliente } 
            : log
        ));
        
        setShowEditModal(false);
        alert("Registro atualizado com sucesso!");
    };

    const excluirLog = (id) => {
        if(window.confirm('Excluir este registro permanentemente?')) {
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    // --- PDCA ---
    const gerarSugestaoPDCA = (texto, tipo) => {
        const t = texto.toLowerCase();
        let sugestao = { causas: '', plano: '' };

        if (tipo.includes('Ruptura') || t.includes('falta')) {
            sugestao.causas = "1. Erro de previsão.\n2. Atraso do fornecedor.";
            sugestao.plano = "Solicitar entrega emergencial.";
        } else if (tipo.includes('Quebra') || t.includes('danific')) {
            sugestao.causas = "1. Manuseio incorreto.\n2. Embalagem frágil.";
            sugestao.plano = "Treinar equipe de movimentação.";
        } else if (t.includes('rh')) {
            sugestao.causas = "1. Ausência não programada.\n2. Falta de backup.";
            sugestao.plano = "Acionar banco de horas/extras.";
        } else {
            sugestao.causas = "1. Procedimento não seguido.\n2. Falha de comunicação.";
            sugestao.plano = "Revisar processo.";
        }
        return sugestao;
    };

    const abrirModalPDCA = (origem) => {
        let textoBase = '';
        let tipoBase = '';

        if (origem === 'auto') {
            const erroHoje = logs.find(l => l.data === new Date().toLocaleDateString() && l.tipo.includes('Erro'));
            textoBase = erroHoje ? erroHoje.textoOriginal : '';
            tipoBase = erroHoje ? erroHoje.tipo : '';
        } else {
            textoBase = origem.textoOriginal;
            tipoBase = origem.tipo;
        }

        const sugestoes = gerarSugestaoPDCA(textoBase, tipoBase);

        setPdcaForm({
            logId: origem.id || null,
            descricao: textoBase,
            causas: sugestoes.causas, 
            indicadorAntes: '',
            indicadorMeta: '',
            metaDescritiva: 'Eliminar causa raiz.',
            planoAcao: sugestoes.plano 
        });
        setShowPdcaModal(true);
    };

    const confirmarSalvarPDCA = () => {
        const novoPDCA = { ...pdcaForm, id: Date.now(), dataCriacao: new Date().toLocaleDateString() };
        setPdcas([...pdcas, novoPDCA]);
        setShowPdcaModal(false);
        alert('Plano de Ação salvo!');
    };

    const gerarDadosOntem = () => {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString();
        const logsTeste = [{ id: 999, data: dataOntem, hora: '14:30:00', tipo: 'Erro / Falha operacional', categoria: 'RH', cliente: 'Geral', textoOriginal: 'Falta de pessoal' }];
        setLogs([...logs, ...logsTeste]);
        alert("Dados de ontem gerados! O Morning Call deve aparecer.");
    };

    // --- CÁLCULOS ---
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
        if(tipo.includes('Erro') || tipo.includes('Falha')) return 'badge-Erro';
        if(tipo.includes('Alerta') || tipo.includes('Risco')) return 'badge-Alerta';
        if(tipo.includes('Melhoria')) return 'badge-Melhoria';
        if(tipo.includes('Quebra') || tipo.includes('Perda')) return 'badge-Quebra';
        if(tipo.includes('Ruptura')) return 'badge-Ruptura';
        if(tipo.includes('Cliente')) return 'badge-Cliente';
        if(tipo.includes('Treinamento')) return 'badge-Treinamento';
        if(tipo.includes('Planejamento')) return 'badge-Planejamento';
        if(tipo.includes('Evento')) return 'badge-Evento';
        return 'badge-Outros';
    };

    return (
        <div className="app-root">
            <style>{styles}</style>

            {/* HEADER & MORNING CALL */}
            <div className="header">
                <div>
                    <h1 style={{margin:0, fontSize:'20px'}}>Diário de Operações</h1>
                    <span style={{color:'#666', fontSize:'13px'}}>{new Date().toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}</span>
                    <button onClick={gerarDadosOntem} style={{marginLeft:'10px', fontSize:'10px', cursor:'pointer', border:'1px dashed #ccc', background:'none'}}>Teste Morning Call</button>
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

            {/* KPIs DINÂMICOS */}
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
                {/* LADO ESQUERDO: INPUT (Sem botões de editar) */}
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
                    <button className="btn-magic" onClick={registrarNovo}>
                        Registrar Ocorrência
                    </button>
                    <div style={{fontSize:'11px', color:'#9ca3af', marginTop:'10px', textAlign:'center'}}>
                        A IA detecta a Categoria e o Tipo automaticamente.
                    </div>
                </div>

                {/* LADO DIREITO: INTELIGÊNCIA */}
                <div className="intelligence-card">
                    <div className="intelligence-header">
                        <IconBrain /> <span>Inteligência do Dia</span>
                    </div>
                    {temErroHoje ? (
                        <div className="alert-box alert-critical">
                            <strong>⚠️ Padrão Crítico Detectado</strong>
                            <p>Identificamos erros hoje. O score caiu.</p>
                            <button className="btn-pdca-auto" onClick={() => abrirModalPDCA('auto')}>
                                <IconAlert /> Gerar PDCA Automático
                            </button>
                        </div>
                    ) : (
                        <div className="alert-box alert-clean">
                            <strong>✅ Operação Estável</strong>
                            <p>Nenhum erro crítico registrado hoje.</p>
                        </div>
                    )}
                    <div className="history-stat">
                        Total Histórico: {logs.length} registros | {pdcas.length} PDCAs
                    </div>
                </div>
            </div>

            {/* TIMELINE */}
            <div className="timeline-card">
                <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                    <h3 style={{margin:0}}>Timeline & Histórico</h3>
                    <button onClick={() => {if(window.confirm('Limpar histórico vitalício?')) setLogs([])}} style={{background:'none', border:'none', fontSize:'11px', color:'#999', cursor:'pointer'}}>Limpar Tudo</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{width:'140px'}}>Data/Hora</th>
                            <th>Cat.</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th style={{width:'80px'}}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>
                                    <div style={{fontWeight:'bold'}}>{log.data}</div>
                                    <div style={{fontSize:'11px', color:'#888'}}>{log.hora}</div>
                                </td>
                                <td>{log.categoria}</td>
                                <td><span className={`badge ${getBadgeClass(log.tipo)}`}>{log.tipo}</span></td>
                                <td><b>{log.cliente}:</b> {log.textoOriginal}</td>
                                <td>
                                    <div className="actions">
                                        <button className="icon-btn icon-edit" title="Editar" onClick={() => abrirModalEdicao(log)}>
                                            <IconEdit />
                                        </button>
                                        <button className="icon-btn icon-del" title="Excluir" onClick={() => excluirLog(log.id)}>
                                            <IconTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE EDIÇÃO (NOVO) --- */}
            {showEditModal && (
                <div className="modal-overlay">
                    <section className="modal-card">
                        <div className="card-header-styled">
                            <h2>Editar Registro</h2>
                            <button onClick={() => setShowEditModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><IconX/></button>
                        </div>
                        <div className="card-content">
                            <label>Descrição do Fato</label>
                            <textarea 
                                rows="3" 
                                value={editForm.textoOriginal} 
                                onChange={(e) => setEditForm({...editForm, textoOriginal: e.target.value})} 
                            />
                            
                            <label>Classificação (Tipo)</label>
                            <select 
                                value={editForm.tipo} 
                                onChange={(e) => setEditForm({...editForm, tipo: e.target.value})}
                            >
                                {TIPOS_OCORRENCIA.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <div className="section-actions">
                                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={salvarEdicao}>Salvar Alterações</button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* --- MODAL PDCA --- */}
            {showPdcaModal && (
                <div className="modal-overlay">
                    <section className="modal-card plan-card">
                        <div className="card-header-styled">
                            <h2>Plan – Análise</h2>
                            <button onClick={() => setShowPdcaModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><IconX/></button>
                        </div>
                        <div className="card-content">
                            <label>Descrição do Problema</label>
                            <textarea rows="3" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({...pdcaForm, descricao: e.target.value})} />
                            <label>Causas (Sugestão IA)</label>
                            <textarea rows="3" value={pdcaForm.causas} onChange={(e) => setPdcaForm({...pdcaForm, causas: e.target.value})} />
                            <div className="form-grid-2