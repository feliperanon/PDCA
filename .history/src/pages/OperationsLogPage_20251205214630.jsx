import React, { useState, useEffect } from 'react';

// --- ÍCONES SVG (NÃO PRECISA INSTALAR NADA) ---
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;

export function OperationsLogPage() {

    // --- 1. CSS (Design Pro Restaurado) ---
    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1000px; margin: 0 auto; padding: 20px; }
        
        /* Morning Call */
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.5s; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-box { text-align: center; }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
        .kpi-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; transition: transform 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }

        /* Grid Principal */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }

        /* Input Inteligente (Esquerda) */
        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); position: relative; display: flex; flex-direction: column; height: 100%; }
        .smart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .smart-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 120px; flex-grow: 1; }
        .main-textarea:focus { border-color: var(--primary); }
        .btn-magic { background: #111827; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .btn-magic:hover { background: #000; }
        .editing-badge { background: #fef08a; color: #854d0e; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde047; }

        /* Painel Inteligência (Direita) - Restaurado */
        .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .intelligence-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: #374151; font-weight: 600; }
        .alert-box { padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .btn-pdca-auto { background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; }
        .btn-pdca-auto:hover { background: #b91c1c; }
        .history-stat { margin-top: auto; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; }

        /* Timeline */
        .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:hover { background: #f9fafb; }
        .badge { padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 10px; color: white; display: inline-block; text-transform: uppercase; }
        .badge-Erro { background: var(--danger); } .badge-Alerta { background: var(--warning); } .badge-Regra { background: var(--primary); }
        .actions { display: flex; gap: 8px; }
        .icon-btn { border: none; background: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #9ca3af; transition: all 0.2s; }
        .icon-btn:hover { background: #f3f4f6; color: #111827; }
        .icon-edit:hover { color: var(--primary); background: #eff6ff; }
        .icon-del:hover { color: var(--danger); background: #fef2f2; }

        /* Modal PDCA */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
        .plan-card { background: white; width: 95%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s; }
        .card-header-styled { background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h2 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
        .card-content { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .card-content label { font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px; }
        .card-content textarea, .card-content input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1e293b; background: #f8fafc; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        @media (max-width: 768px) { .main-grid, .kpi-grid { grid-template-columns: 1fr; } }
    `;

    // --- 2. ESTADOS ---
    const [logs, setLogs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ops_logs_vitalicio')) || []; } catch { return []; }
    });
    const [pdcas, setPdcas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ops_pdcas')) || []; } catch { return []; }
    });

    const [inputTexto, setInputTexto] = useState('');
    const [editandoId, setEditandoId] = useState(null); // ID do item sendo editado
    const [alertaOntem, setAlertaOntem] = useState(null);
    
    // Modal PDCA
    const [showModal, setShowModal] = useState(false);
    const [pdcaForm, setPdcaForm] = useState({ logId: null, descricao: '', causas: '', indicadorAntes: '', indicadorMeta: '', metaDescritiva: '', planoAcao: '' });

    // --- 3. EFEITOS ---
    useEffect(() => {
        localStorage.setItem('ops_logs_vitalicio', JSON.stringify(logs));
        localStorage.setItem('ops_pdcas', JSON.stringify(pdcas));
        verificarOntem();
    }, [logs, pdcas]);

    const verificarOntem = () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dataOntem = ontem.toLocaleDateString(); // Data formato local
        
        const errosOntem = logs.filter(l => l.data === dataOntem && l.tipo === 'Erro');
        
        if (errosOntem.length > 0) {
            setAlertaOntem(`Atenção: Ontem tivemos ${errosOntem.length} problemas registrados. Foco na prevenção!`);
        }
    };

    // --- 4. INTELIGÊNCIA (PARSER) ---
    const analisarTexto = (texto) => {
        const t = texto.toLowerCase();
        let cat = 'Operacional';
        let tipo = 'Info';
        let cliente = 'Geral';

        // Categorias Fixas para os KPIs
        if (t.includes('rh') || t.includes('falta') || t.includes('colaborador') || t.includes('atestado')) cat = 'RH';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('veiculo') || t.includes('pneu') || t.includes('motorista')) cat = 'Frota';
        else if (t.includes('qualidade') || t.includes('avaria') || t.includes('devolucao') || t.includes('cliente')) cat = 'Qualidade';
        else if (t.includes('juridico') || t.includes('processo')) cat = 'Jurídico';
        else if (t.includes('logistica') || t.includes('expedicao')) cat = 'Logística';

        // Tipos
        if (t.includes('erro') || t.includes('quebrou') || t.includes('falhou') || t.includes('parou') || t.includes('acidente')) tipo = 'Erro';
        else if (t.includes('alerta') || t.includes('atraso') || t.includes('risco')) tipo = 'Alerta';
        else if (t.includes('regra') || t.includes('norma')) tipo = 'Regra';

        // Clientes/Setores (Exemplos)
        if (t.includes('verdemar')) cliente = 'Verdemar';
        if (t.includes('rena')) cliente = 'Rena';

        return { categoria: cat, tipo: tipo, cliente: cliente };
    };

    const salvarRegistro = () => {
        if (!inputTexto.trim()) return;

        const analise = analisarTexto(inputTexto);
        
        // Se estiver editando
        if (editandoId) {
            setLogs(logs.map(log => 
                log.id === editandoId 
                ? { ...log, textoOriginal: inputTexto, ...analise } 
                : log
            ));
            setEditandoId(null);
            alert("Registro atualizado!");
        } else {
            // Novo registro
            const novoLog = {
                id: Date.now(),
                data: new Date().toLocaleDateString(),
                hora: new Date().toLocaleTimeString(),
                timestamp: new Date(),
                textoOriginal: inputTexto,
                ...analise
            };
            setLogs([novoLog, ...logs]);
        }
        setInputTexto('');
    };

    // --- 5. AÇÕES DE TIMELINE ---
    const editarLog = (log) => {
        setInputTexto(log.textoOriginal);
        setEditandoId(log.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe para o input
    };

    const excluirLog = (id) => {
        if(window.confirm('Excluir este registro?')) {
            setLogs(logs.filter(l => l.id !== id));
            // Se estava editando este, cancela edição
            if (editandoId === id) {
                setEditandoId(null);
                setInputTexto('');
            }
        }
    };

    // --- 6. PDCA ---
    const abrirModalPDCA = (origem) => {
        let descricaoInicial = '';
        if (origem === 'auto') {
            // Pega o erro mais recente de hoje
            const erroHoje = logs.find(l => l.data === new Date().toLocaleDateString() && l.tipo === 'Erro');
            descricaoInicial = erroHoje ? erroHoje.textoOriginal : '';
        } else {
            // Veio de um log específico
            descricaoInicial = origem.textoOriginal;
        }

        setPdcaForm({
            logId: origem.id || null,
            descricao: descricaoInicial,
            causas: '',
            indicadorAntes: '',
            indicadorMeta: '',
            metaDescritiva: 'Eliminar causa raiz.',
            planoAcao: ''
        });
        setShowModal(true);
    };

    const confirmarSalvarPDCA = () => {
        const novoPDCA = { ...pdcaForm, id: Date.now(), dataCriacao: new Date().toLocaleDateString() };
        setPdcas([...pdcas, novoPDCA]);
        setShowModal(false);
        alert('Plano de Ação salvo no histórico!');
    };

    // --- 7. CÁLCULOS HOJE ---
    const hojeData = new Date().toLocaleDateString();
    const logsHoje = logs.filter(l => l.data === hojeData);
    
    // Contagem de erros por categoria fixa (para os cartões)
    const countErro = (cat) => logsHoje.filter(l => l.categoria === cat && l.tipo === 'Erro').length;
    
    // Verifica se tem erro geral hoje
    const temErroHoje = logsHoje.some(l => l.tipo === 'Erro');

    // Score
    let score = 100;
    logsHoje.forEach(l => {
        if (l.tipo === 'Erro') score -= 20;
        if (l.tipo === 'Alerta') score -= 10;
    });
    if (score < 0) score = 0;

    return (
        <div className="app-root">
            <style>{styles}</style>

            {/* MORNING CALL (Ontem) */}
            {alertaOntem && (
                <div className="morning-alert">
                    <IconAlert /> <strong>Morning Call:</strong> {alertaOntem}
                </div>
            )}

            {/* HEADER */}
            <div className="header">
                <div>
                    <h1 style={{margin:0, fontSize:'20px'}}>Diário de Operações</h1>
                    <span style={{color:'#666', fontSize:'13px'}}>{new Date().toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}</span>
                </div>
                <div className="score-box">
                    <span className="score-value" style={{color: score > 70 ? '#16a34a' : '#dc2626'}}>{score}%</span>
                    <span className="score-label">Saúde Operacional</span>
                </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                {['Operacional', 'RH', 'Frota', 'Qualidade'].map(cat => (
                    <div className="kpi-card" key={cat}>
                        <div className="kpi-indicator" style={{background: countErro(cat) > 0 ? '#dc2626' : '#16a34a'}}></div>
                        <h3>{cat}</h3>
                        <span className="kpi-value">{countErro(cat)} <span style={{fontSize:'12px', fontWeight:'400', color:'#888'}}>Erros Hoje</span></span>
                    </div>
                ))}
            </div>

            <div className="main-grid">
                {/* LADO ESQUERDO: INPUT */}
                <div className="smart-input-container">
                    <div className="smart-header">
                        <h3><IconCheck/> Registro Rápido</h3>
                        {editandoId && <span className="editing-badge">✏️ Editando registro...</span>}
                    </div>
                    
                    <textarea 
                        className="main-textarea"
                        placeholder="O que aconteceu? (Ex: Faltou colaborador na expedição, Caminhão quebrou...)"
                        value={inputTexto}
                        onChange={(e) => setInputTexto(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), salvarRegistro())}
                    />
                    
                    <button className="btn-magic" onClick={salvarRegistro}>
                        {editandoId ? 'Atualizar Registro' : 'Registrar Ocorrência'}
                    </button>
                    <div style={{fontSize:'11px', color:'#9ca3af', marginTop:'10px', textAlign:'center'}}>
                        A IA classifica automaticamente a Categoria e o Tipo.
                    </div>
                </div>

                {/* LADO DIREITO: INTELIGÊNCIA (RESTAURADO) */}
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
                            <p>Nenhum erro crítico registrado hoje. Continue monitorando.</p>
                        </div>
                    )}
                    
                    <div className="history-stat">
                        Total Histórico: {logs.length} registros
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
                            <tr key={log.id} style={{background: editandoId === log.id ? '#fffbeb' : 'transparent'}}>
                                <td>
                                    <div style={{fontWeight:'bold'}}>{log.data}</div>
                                    <div style={{fontSize:'11px', color:'#888'}}>{log.hora}</div>
                                </td>
                                <td>{log.categoria}</td>
                                <td><span className={`badge badge-${log.tipo}`}>{log.tipo}</span></td>
                                <td><b>{log.cliente}:</b> {log.textoOriginal}</td>
                                <td>
                                    <div className="actions">
                                        <button className="icon-btn icon-edit" title="Editar" onClick={() => editarLog(log)}>
                                            <IconEdit />
                                        </button>
                                        <button className="icon-btn icon-del" title="Excluir" onClick={() => excluirLog(log.id)}>
                                            <IconTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#999'}}>Nenhum registro no histórico.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL PDCA (Layout Aprovado) */}
            {showModal && (
                <div className="modal-overlay">
                    <section className="detail-card plan-card">
                        <div className="card-header-styled">
                            <h2>Plan – Análise</h2>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><IconX/></button>
                        </div>
                        <div className="card-content">
                            <label>Descrição do Problema</label>
                            <textarea rows="3" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({...pdcaForm, descricao: e.target.value})} />
                            
                            <label>Causas (Hipóteses)</label>
                            <textarea rows="3" placeholder="1. Causa A&#10;2. Causa B" value={pdcaForm.causas} onChange={(e) => setPdcaForm({...pdcaForm, causas: e.target.value})} />

                            <div className="form-grid-2">
                                <div>
                                    <label>Indicador Antes</label>
                                    <input placeholder="Ref..." value={pdcaForm.indicadorAntes} onChange={(e) => setPdcaForm({...pdcaForm, indicadorAntes: e.target.value})} />
                                </div>
                                <div>
                                    <label>Indicador Meta</label>
                                    <input placeholder="Alvo..." value={pdcaForm.indicadorMeta} onChange={(e) => setPdcaForm({...pdcaForm, indicadorMeta: e.target.value})} />
                                </div>
                            </div>

                            <label>Meta (Descritiva)</label>
                            <input value={pdcaForm.metaDescritiva} onChange={(e) => setPdcaForm({...pdcaForm, metaDescritiva: e.target.value})} />

                            <label>Plano de Ação</label>
                            <textarea rows="4" placeholder="O que será feito?" value={pdcaForm.planoAcao} onChange={(e) => setPdcaForm({...pdcaForm, planoAcao: e.target.value})} />

                            <div className="section-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="button" className="btn-primary" onClick={confirmarSalvarPDCA}>
                                    Salvar Plan
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}