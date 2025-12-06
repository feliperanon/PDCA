import React, { useState, useEffect } from 'react';

// Mudei o nome aqui de 'OperationsDashboard' para 'OperationsLogPage' para corrigir o erro
export function OperationsLogPage() {
    
    // --- 1. ESTILOS EMBUTIDOS (CSS) ---
    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1000px; margin: 0 auto; padding: 20px; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .score-circle { width: 90px; height: 90px; border-radius: 50%; border: 4px solid #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; }
        
        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
        .kpi-card { background: var(--surface); padding: 20px; border-radius: 10px; border-left: 5px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative; }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; position: absolute; top: 20px; right: 20px; }
        
        /* Layout Principal */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .card { background: var(--surface); padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        
        /* Inputs e Botões */
        input, select, textarea { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
        .btn { width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn:hover { opacity: 0.9; }
        .btn-danger { background: var(--danger); }
        
        /* Alertas */
        .alert-box { padding: 15px; border-radius: 8px; margin-bottom: 10px; font-size: 13px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        
        /* Tabela */
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th { text-align: left; padding: 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .badge { padding: 4px 8px; border-radius: 99px; color: white; font-size: 11px; font-weight: bold; }
        
        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
        .modal-content { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 500px; animation: slideIn 0.3s; }
        @keyframes slideIn { from {transform: translateY(-20px); opacity: 0;} to {transform: translateY(0); opacity: 1;} }
        
        /* Mobile */
        @media (max-width: 768px) {
            .main-grid { grid-template-columns: 1fr; }
        }
    `;

    // --- 2. LÓGICA E ESTADO ---
    
    const getHojeISO = () => new Date().toISOString().split('T')[0];
    const getHoraAtual = () => new Date().toLocaleTimeString();
    const getHojeFormatado = () => new Date().toLocaleDateString();

    const [registros, setRegistros] = useState(() => {
        try {
            const salvo = localStorage.getItem('diario_full');
            return salvo ? JSON.parse(salvo) : [];
        } catch (e) { return []; }
    });

    const [form, setForm] = useState({ categoria: 'Operacional', tipo: 'Regra', cliente: '', mensagem: '' });
    
    // Estado da Saúde do Dia
    const [saude, setSaude] = useState({ score: 100, label: 'Excelente', cor: '#16a34a' });
    
    // Estado do Modal PDCA
    const [modalAberto, setModalAberto] = useState(false);
    const [pdca, setPdca] = useState({ problema: '', causa: '', acao: '' });

    // --- 3. EFEITOS ---
    
    useEffect(() => {
        localStorage.setItem('diario_full', JSON.stringify(registros));
        calcularSaude();
    }, [registros]);

    const calcularSaude = () => {
        const hojeISO = getHojeISO();
        const ocorrenciasHoje = registros.filter(r => r.dataISO === hojeISO);

        let pontos = 100;
        ocorrenciasHoje.forEach(r => {
            if (r.tipo === 'Erro') pontos -= 20;
            if (r.tipo === 'Alerta') pontos -= 10;
        });
        if (pontos < 0) pontos = 0;

        let cor = '#16a34a';
        let label = 'Excelente';
        
        if (pontos < 80) { cor = '#eab308'; label = 'Atenção'; }
        if (pontos < 60) { cor = '#dc2626'; label = 'Crítico'; }

        setSaude({ score: pontos, label, cor });
    };

    const contarErrosHoje = (cat) => {
        const hojeISO = getHojeISO();
        return registros.filter(r => r.dataISO === hojeISO && r.categoria === cat && r.tipo === 'Erro').length;
    };

    // --- 4. AÇÕES ---

    const salvarRegistro = () => {
        if (!form.cliente || !form.mensagem) return alert("Preencha cliente e descrição!");

        const novo = {
            id: Date.now(),
            dataISO: getHojeISO(),
            dataVisivel: getHojeFormatado(),
            hora: getHoraAtual(),
            ...form
        };

        setRegistros([novo, ...registros]);
        setForm({ ...form, cliente: '', mensagem: '' });
    };

    const abrirPDCA = () => {
        const hojeISO = getHojeISO();
        const erroHoje = registros.find(r => r.dataISO === hojeISO && r.tipo === 'Erro');
        
        setPdca({
            problema: erroHoje ? `Recorrência: ${erroHoje.mensagem} (${erroHoje.cliente})` : '',
            causa: '',
            acao: ''
        });
        setModalAberto(true);
    };

    const resetar = () => {
        if(window.confirm("Apagar todo o histórico?")) {
            setRegistros([]);
            localStorage.removeItem('diario_full');
        }
    };

    const temErroHoje = registros.some(r => r.dataISO === getHojeISO() && r.tipo === 'Erro');

    return (
        <div className="app-root">
            <style>{styles}</style>

            {/* HEADER */}
            <div className="header">
                <div>
                    <h1 style={{margin:0, color: '#1f2937'}}>Painel Operacional</h1>
                    <p style={{margin:0, color: '#6b7280'}}>Visão do Dia: {getHojeFormatado()}</p>
                    <button onClick={resetar} style={{background:'none', border:'none', textDecoration:'underline', cursor:'pointer', fontSize:'11px', color:'#888', marginTop: '5px'}}>Resetar Sistema</button>
                </div>
                <div className="score-circle" style={{borderColor: saude.cor, color: saude.cor}}>
                    <span style={{fontSize:'10px', color:'#888'}}>SAÚDE</span>
                    <span style={{fontSize:'24px'}}>{saude.score}</span>
                    <span style={{fontSize:'10px'}}>{saude.label}</span>
                </div>
            </div>

            {/* KPIS */}
            <div className="kpi-grid">
                {['Operacional', 'RH', 'Frota', 'Qualidade'].map(cat => {
                    const erros = contarErrosHoje(cat);
                    return (
                        <div className="kpi-card" key={cat} style={{borderLeftColor: erros > 0 ? '#dc2626' : '#16a34a'}}>
                            <h3 style={{margin:'0 0 5px 0', fontSize:'12px', color:'#666'}}>{cat.toUpperCase()}</h3>
                            <span style={{fontSize:'20px', fontWeight:'bold'}}>{erros} Erros Hoje</span>
                            <div className="status-dot" style={{background: erros > 0 ? '#dc2626' : '#16a34a'}}></div>
                        </div>
                    )
                })}
            </div>

            <div className="main-grid">
                {/* FORMULÁRIO */}
                <div className="card">
                    <h2 style={{marginTop:0}}>Novo Registro</h2>
                    <div style={{display:'flex', gap:'10px'}}>
                        <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                            <option value="Operacional">Operacional</option>
                            <option value="RH">RH</option>
                            <option value="Frota">Frota</option>
                            <option value="Qualidade">Qualidade</option>
                        </select>
                        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                            <option value="Regra">📝 Regra / Info</option>
                            <option value="Erro">🚨 Erro / Incidente</option>
                            <option value="Alerta">⚠️ Alerta</option>
                        </select>
                    </div>
                    <input placeholder="Cliente / Setor" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
                    <textarea rows="3" placeholder="O que aconteceu?" value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} />
                    <button className="btn" onClick={salvarRegistro}>Salvar Registro</button>
                </div>

                {/* INSIGHTS */}
                <div className="card">
                    <h3 style={{marginTop:0}}>🤖 Inteligência</h3>
                    {temErroHoje ? (
                        <div className="alert-box alert-critical">
                            <strong>⚠️ Padrão Crítico Detectado</strong>
                            <p>Identificamos erros hoje. O score caiu.</p>
                            <button className="btn btn-danger" style={{fontSize:'12px', padding:'8px'}} onClick={abrirPDCA}>
                                Gerar PDCA Automático
                            </button>
                        </div>
                    ) : (
                        <div className="alert-box alert-clean">
                            <strong>✅ Operação Estável</strong>
                            <p>Nenhum incidente crítico hoje.</p>
                        </div>
                    )}
                    <div style={{fontSize:'12px', color:'#888', marginTop:'10px'}}>
                        Total Histórico: {registros.length} registros
                    </div>
                </div>
            </div>

            {/* TIMELINE */}
            <div className="card" style={{marginTop: '20px', overflowX: 'auto'}}>
                <h3 style={{marginTop:0}}>Timeline</h3>
                <table>
                    <thead>
                        <tr><th>Hora</th><th>Cat.</th><th>Tipo</th><th>Descrição</th></tr>
                    </thead>
                    <tbody>
                        {registros.map(r => (
                            <tr key={r.id}>
                                <td>{r.dataVisivel} {r.hora}</td>
                                <td>{r.categoria}</td>
                                <td>
                                    <span className="badge" style={{background: r.tipo === 'Erro' ? '#dc2626' : r.tipo === 'Alerta' ? '#eab308' : '#2563eb'}}>
                                        {r.tipo}
                                    </span>
                                </td>
                                <td><b>{r.cliente}:</b> {r.mensagem}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr><td colSpan="4" style={{textAlign:'center', color:'#999'}}>