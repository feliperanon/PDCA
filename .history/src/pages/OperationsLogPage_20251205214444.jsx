import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertTriangle, CheckCircle, Save, X } from 'lucide-react'; // Ícones modernos

export function OperationsLogPage() {

    // --- 1. CSS INTEGRO (Design Moderno + PDCA Layout) ---
    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1000px; margin: 0 auto; padding: 20px; }
        
        /* Alerta de Ontem (Morning Call) */
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.5s; }
        
        /* Header e Score */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-box { text-align: center; }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
        .kpi-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; }
        .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }

        /* Input Inteligente */
        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 25px; border: 1px solid var(--border); position: relative; }
        .smart-input-container::before { content: "✨ IA Ativa"; position: absolute; top: -10px; right: 20px; background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; font-size: 10px; padding: 4px 8px; border-radius: 10px; font-weight: bold; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 80px; }
        .main-textarea:focus { border-color: var(--primary); }
        .btn-magic { background: #111827; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .btn-magic:hover { background: #000; }

        /* Tabela Timeline */
        .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:hover { background: #f9fafb; }
        
        .badge { padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; color: white; display: inline-block; }
        .badge-RH { background: #8b5cf6; } .badge-Frota { background: #f59e0b; } .badge-Qualidade { background: #ec4899; } .badge-Operacional { background: #3b82f6; }
        .actions { display: flex; gap: 8px; }
        .icon-btn { border: none; background: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #6b7280; }
        .icon-btn:hover { background: #f3f4f6; color: #111827; }
        .icon-del:hover { color: var(--danger); background: #fef2f2; }

        /* --- LAYOUT ESPECÍFICO DO MODAL PDCA --- */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
        .plan-card { background: white; width: 95%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s; }
        .card-header-styled { background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .card-header-styled h2 { margin: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
        .card-content { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        
        .card-content label { font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px; }
        .card-content textarea, .card-content input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; color: #1e293b; background: #f8fafc; }
        .card-content textarea:focus, .card-content input:focus { background: white; border-color: var(--primary); outline: none; }
        
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        .section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary { background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary:hover { background: #1d4ed8; }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;

    // --- 2. ESTADOS DO SISTEMA ---
    const [logs, setLogs] = useState(() => {
        const saved = localStorage.getItem('ops_logs_vitalicio');
        return saved ? JSON.parse(saved) : [];
    });

    const [pdcas, setPdcas] = useState(() => {
        const saved = localStorage.getItem('ops_pdcas');
        return saved ? JSON.parse(saved) : [];
    });

    const [inputTexto, setInputTexto] = useState('');
    const [alertaOntem, setAlertaOntem] = useState(null);
    
    // Controle do Modal
    const [showModal, setShowModal] = useState(false);
    const [pdcaForm, setPdcaForm] = useState({
        logId: null,
        descricao: '',
        causas: '',
        indicadorAntes: '',
        indicadorMeta: '',
        metaDescritiva: '',
        planoAcao: ''
    });

    // --- 3. EFEITOS E "MORNING CALL" ---
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

        // Filtra erros de ontem
        const errosOntem = logs.filter(l => l.data === dataOntem && l.tipo === 'Erro');
        
        if (errosOntem.length > 0) {
            const resumo = errosOntem.map(e => e.categoria).join(', ');
            setAlertaOntem(`Atenção: Ontem tivemos ${errosOntem.length} problemas (${resumo}). Foco na prevenção hoje!`);
        }
    };

    // --- 4. INTELIGÊNCIA ARTIFICIAL SIMULADA ---
    const analisarTexto = (texto) => {
        const t = texto.toLowerCase();
        let cat = 'Operacional';
        let tipo = 'Info';
        let cliente = 'Geral';

        // Detecção de Categoria
        if (t.includes('rh') || t.includes('faltou') || t.includes('falta') || t.includes('colaborador') || t.includes('atestado') || t.includes('ferias')) cat = 'RH';
        else if (t.includes('frota') || t.includes('caminhao') || t.includes('pneu') || t.includes('motorista') || t.includes('multa') || t.includes('combustivel')) cat = 'Frota';
        else if (t.includes('qualidade') || t.includes('reclamacao') || t.includes('cliente') || t.includes('devolucao') || t.includes('avaria')) cat = 'Qualidade';

        // Detecção de Tipo
        if (t.includes('erro') || t.includes('quebrou') || t.includes('batida') || t.includes('acidente') || t.includes('parou') || t.includes('falta')) tipo = 'Erro';
        else if (t.includes('alerta') || t.includes('atraso') || t.includes('risco') || t.includes('quase')) tipo = 'Alerta';
        else if (t.includes('regra') || t.includes('aviso') || t.includes('mudanca')) tipo = 'Regra';

        // Tentativa de Extrair Cliente (Simples)
        if (t.includes('verdemar')) cliente = 'Verdemar';
        if (t.includes('rena')) cliente = 'Rena';
        if (t.includes('carrefour')) cliente = 'Carrefour';
        if (t.includes('epa')) cliente = 'EPA';
        if (t.includes('expedicao')) cliente = 'Expedição';
        if (t.includes('recebimento')) cliente = 'Recebimento';

        return { categoria: cat, tipo: tipo, cliente: cliente };
    };

    const registrarAutomaticamente = () => {
        if (!inputTexto.trim()) return;

        const analise = analisarTexto(inputTexto);
        
        const novoLog = {
            id: Date.now(),
            data: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            timestamp: new Date(), // para ordenação
            textoOriginal: inputTexto,
            ...analise
        };

        setLogs([novoLog, ...logs]);
        setInputTexto(''); // Limpa o campo
    };

    // --- 5. FUNÇÕES DE TIMELINE ---
    const excluirLog = (id) => {
        if(window.confirm('Tem certeza que deseja excluir este registro?')) {
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    const abrirModalPDCA = (log) => {
        setPdcaForm({
            logId: log.id,
            descricao: log.textoOriginal, // Já puxa o problema
            causas: '',
            indicadorAntes: '',
            indicadorMeta: '',
            metaDescritiva: 'Resolver causa raiz e evitar recorrência.',
            planoAcao: ''
        });
        setShowModal(true);
    };

    const salvarPDCA = () => {
        const novoPDCA = { ...pdcaForm, id: Date.now(), status: 'Planejado' };
        setPdcas([...pdcas, novoPDCA]);
        setShowModal(false);
        alert('PDCA Salvo e Vinculado ao Histórico!');
    };

    // --- 6. CÁLCULOS DE KPI (HOJE) ---
    const hoje = new Date().toLocaleDateString();
    const logsHoje = logs.filter(l => l.data === hoje);
    
    const countErro = (cat) => logsHoje.filter(l => l.categoria === cat && l.tipo === 'Erro').length;
    
    let score = 100;
    logsHoje.forEach(l => {
        if (l.tipo === 'Erro') score -= 20;
        if (l.tipo === 'Alerta') score -= 10;
    });
    if (score < 0) score = 0;

    return (
        <div className="app-root">
            <style>{styles}</style>

            {/* ALERTA PREVENTIVO (MORNING CALL) */}
            {alertaOntem && (
                <div className="morning-alert">
                    <AlertTriangle size={20} />
                    <strong>Morning Call:</strong> {alertaOntem}
                </div>
            )}

            {/* HEADER */}
            <div className="header">
                <div>
                    <h1 style={{margin:0, fontSize:'20px'}}>Painel de Controle</h1>
                    <span style={{color:'#666', fontSize:'13px'}}>{new Date().toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</span>
                </div>
                <div className="score-box">
                    <span className="score-value" style={{color: score > 70 ? '#16a34a' : '#dc2626'}}>{score}%</span>
                    <span className="score-label">Saúde Operacional</span>
                </div>
            </div>

            {/* KPIs AUTOMÁTICOS */}
            <div className="kpi-grid">
                {['Operacional', 'RH', 'Frota', 'Qualidade'].map(cat => (
                    <div className="kpi-card" key={cat}>
                        <div className="kpi-indicator" style={{background: countErro(cat) > 0 ? '#dc2626' : '#16a34a'}}></div>
                        <h3>{cat}</h3>
                        <span className="kpi-value">{countErro(cat)} <span style={{fontSize:'12px', fontWeight:'400', color:'#888'}}>Erros Hoje</span></span>
                    </div>
                ))}
            </div>

            {/* INPUT INTELIGENTE (IA) */}
            <div className="smart-input-container">
                <textarea 
                    className="main-textarea"
                    placeholder="O que aconteceu? (Ex: Faltou colaborador na expedição, Caminhão quebrou...)"
                    value={inputTexto}
                    onChange={(e) => setInputTexto(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), registrarAutomaticamente())}
                />
                <button className="btn-magic" onClick={registrarAutomaticamente}>
                    <CheckCircle size={16} /> Registrar Ocorrência
                </button>
            </div>

            {/* TIMELINE VITALÍCIA */}
            <div className="timeline-card">
                <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                    <h3 style={{margin:0}}>Timeline & Histórico</h3>
                    <button onClick={() => {if(window.confirm('Limpar histórico vitalício?')) setLogs([])}} style={{background:'none', border:'none', fontSize:'11px', color:'#999', cursor:'pointer'}}>Limpar Tudo</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{width:'140px'}}>Data/Hora</th>
                            <th>Categoria</th>
                            <th>Status</th>
                            <th>Descrição (Cliente/Setor: Ocorrência)</th>
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
                                <td><span className={`badge badge-${log.categoria}`}>{log.categoria}</span></td>
                                <td>
                                    <span className="badge" style={{
                                        background: log.tipo === 'Erro' ? '#dc2626' : log.tipo === 'Alerta' ? '#eab308' : '#2563eb'
                                    }}>
                                        {log.tipo}
                                    </span>
                                </td>
                                <td>
                                    <b>{log.cliente}:</b> {log.textoOriginal}
                                </td>
                                <td>
                                    <div className="actions">
                                        {log.tipo === 'Erro' && (
                                            <button className="icon-btn" title="Gerar PDCA" onClick={() => abrirModalPDCA(log)}>
                                                <AlertTriangle size={16} color="#dc2626" />
                                            </button>
                                        )}
                                        <button className="icon-btn icon-del" title="Excluir" onClick={() => excluirLog(log.id)}>
                                            <Trash2 size={16} />
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

            {/* MODAL PDCA (Layout Solicitado) */}
            {showModal && (
                <div className="modal-overlay">
                    <section className="form-section detail-card plan-card">
                        <div className="card-header-styled">
                            <h2>Plan – Análise e Ação</h2>
                            <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
                        </div>
                        <div className="card-content">
                            <label>
                                Descrição do Problema
                                <textarea rows="3" value={pdcaForm.descricao} onChange={(e) => setPdcaForm({...pdcaForm, descricao: e.target.value})} />
                            </label>
                            
                            <label>
                                Causas (Hipóteses - 5 Porquês)
                                <textarea rows="3" placeholder="1. Por que? 2. Por que?..." value={pdcaForm.causas} onChange={(e) => setPdcaForm({...pdcaForm, causas: e.target.value})} />
                            </label>

                            <div className="form-grid-2">
                                <label>
                                    Indicador Antes
                                    <input placeholder="Ex: 5 erros/dia" value={pdcaForm.indicadorAntes} onChange={(e) => setPdcaForm({...pdcaForm, indicadorAntes: e.target.value})} />
                                </label>
                                <label>
                                    Indicador Meta
                                    <input placeholder="Ex: 0 erros" value={pdcaForm.indicadorMeta} onChange={(e) => setPdcaForm({...pdcaForm, indicadorMeta: e.target.value})} />
                                </label>
                            </div>

                            <label>
                                Meta (Descritiva)
                                <input value={pdcaForm.metaDescritiva} onChange={(e) => setPdcaForm({...pdcaForm, metaDescritiva: e.target.value})} />
                            </label>

                            <label>
                                Plano de Ação (O que será feito?)
                                <textarea rows="4" placeholder="Descreva a ação corretiva..." value={pdcaForm.planoAcao} onChange={(e) => setPdcaForm({...pdcaForm, planoAcao: e.target.value})} />
                            </label>

                            <div className="section-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="button" className="btn-primary" onClick={salvarPDCA}>
                                    <Save size={14} style={{marginRight:'5px'}}/> Salvar Plan
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}