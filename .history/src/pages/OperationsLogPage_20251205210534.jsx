import React, { useState, useEffect } from 'react';
import '../style.css'; 

export function OperationsDashboard() {
    // --- 1. ESTADOS DO SISTEMA ---
    // Tenta carregar do LocalStorage ao iniciar
    const [registros, setRegistros] = useState(() => {
        const dadosSalvos = localStorage.getItem('diario_operacoes');
        return dadosSalvos ? JSON.parse(dadosSalvos) : [];
    });

    const [formulario, setFormulario] = useState({
        cliente: '', 
        categoria: 'Operacional', 
        tipo: 'Regra', 
        mensagem: ''
    });

    const [saudeOperacional, setSaudeOperacional] = useState({
        score: 100, status: 'Excelente', cor: '#2ecc71'
    });

    // Estados para controlar o Modal (Janela) do PDCA
    const [showModal, setShowModal] = useState(false);
    const [pdcaData, setPdcaData] = useState({ problema: '', causa: '', acao: '' });

    // --- 2. EFEITOS (Automação) ---
    // Salva no navegador sempre que a lista muda
    useEffect(() => {
        localStorage.setItem('diario_operacoes', JSON.stringify(registros));
        calcularSaudeDoDia();
    }, [registros]);

    // --- 3. FUNÇÕES AUXILIARES ---
    const getDataHoje = () => new Date().toLocaleDateString();

    const calcularSaudeDoDia = () => {
        const hoje = getDataHoje();
        const ocorrenciasHoje = registros.filter(r => r.dataHora.includes(hoje));
        
        let pontuacao = 100;
        
        ocorrenciasHoje.forEach(reg => {
            if (reg.tipo === 'Erro') pontuacao -= 20;
            if (reg.tipo === 'Alerta') pontuacao -= 10;
        });

        if (pontuacao < 0) pontuacao = 0;

        let status = 'Excelente';
        let cor = '#2ecc71'; // Verde

        if (pontuacao < 80) { status = 'Atenção'; cor = '#f1c40f'; } // Amarelo
        if (pontuacao < 60) { status = 'Crítico'; cor = '#e74c3c'; } // Vermelho

        setSaudeOperacional({ score: pontuacao, status, cor });
    };

    const contarHoje = (cat) => {
        const hoje = getDataHoje();
        return registros.filter(r => r.categoria === cat && r.tipo === 'Erro' && r.dataHora.includes(hoje)).length;
    };

    // --- 4. AÇÕES DO USUÁRIO ---
    const adicionarRegistro = () => {
        if (formulario.cliente === "" || formulario.mensagem === "") {
            alert("Por favor, preencha o Cliente e a Descrição.");
            return;
        }

        const novoRegistro = {
            id: Date.now(),
            dataHora: new Date().toLocaleString(),
            ...formulario
        };

        setRegistros([novoRegistro, ...registros]);
        setFormulario({ ...formulario, cliente: '', mensagem: '' });
    };

    const resetarSistema = () => {
        if(window.confirm("ATENÇÃO: Isso apagará todo o histórico. Deseja continuar?")){
            setRegistros([]);
            localStorage.removeItem('diario_operacoes');
        }
    };

    // --- 5. LÓGICA DO PDCA (MODAL) ---
    const abrirPDCA = () => {
        // Busca o erro mais recente de hoje para preencher automaticamente
        const hoje = getDataHoje();
        const ultimoErro = registros.find(r => r.tipo === 'Erro' && r.dataHora.includes(hoje));

        setPdcaData({
            problema: ultimoErro ? `Recorrência detectada: ${ultimoErro.mensagem} (${ultimoErro.cliente})` : '',
            causa: '',
            acao: ''
        });
        
        setShowModal(true); // Abre a janela
    };

    const salvarPDCA = () => {
        if(pdcaData.acao === "") {
            alert("Defina pelo menos uma ação.");
            return;
        }
        alert(`PDCA Salvo!\n\nProblema: ${pdcaData.problema}\nAção Definida: ${pdcaData.acao}`);
        // Futuramente aqui salvaremos numa lista de tarefas
        setShowModal(false); // Fecha a janela
    };

    return (
        <div className="container-page">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="page-title">Painel de Comando Operacional</h1>
                    <p className="subtitle">Visão do dia: {getDataHoje()}</p>
                    <button onClick={resetarSistema} className="btn-reset">
                        Resetar Sistema
                    </button>
                </div>
                
                <div className="daily-score" style={{ borderColor: saudeOperacional.cor }}>
                    <span className="score-label">Saúde do Dia</span>
                    <h2 style={{ color: saudeOperacional.cor }}>{saudeOperacional.status}</h2>
                    <span className="score-number">{saudeOperacional.score}%</span>
                </div>
            </header>

            {/* KPIs (Cards Coloridos) */}
            <div className="kpi-grid">
                {['RH', 'Frota', 'Qualidade', 'Operacional'].map(cat => (
                    <div className="kpi-card" key={cat}>
                        <h3>
                            {cat === 'RH' ? '👥' : cat === 'Frota' ? '🚚' : cat === 'Qualidade' ? '⭐' : '⚙️'} {cat}
                        </h3>
                        <p>{contarHoje(cat)} incidentes</p>
                        <div className={`status-dot ${contarHoje(cat) > 0 ? 'dot-red' : 'dot-green'}`}></div>
                    </div>
                ))}
            </div>

            <div className="main-grid">
                {/* Esquerda: Formulário */}
                <div className="form-section">
                    <h3>Nova Ocorrência</h3>
                    <div className="form-box">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Categoria:</label>
                                <select 
                                    value={formulario.categoria} 
                                    onChange={(e) => setFormulario({...formulario, categoria: e.target.value})}
                                >
                                    <option value="Operacional">⚙️ Operacional</option>
                                    <option value="RH">👥 RH / Pessoas</option>
                                    <option value="Frota">🚚 Frota / Logística</option>
                                    <option value="Qualidade">⭐ Qualidade</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tipo:</label>
                                <select 
                                    value={formulario.tipo} 
                                    onChange={(e) => setFormulario({...formulario, tipo: e.target.value})}
                                >
                                    <option value="Regra">📝 Regra / Info</option>
                                    <option value="Erro">🚨 Incidente / Erro</option>
                                    <option value="Alerta">⚠️ Alerta / Atraso</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Cliente / Setor:</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Verdemar, Expedição..."
                                value={formulario.cliente}
                                onChange={(e) => setFormulario({...formulario, cliente: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>Descrição:</label>
                            <textarea 
                                rows="2" 
                                placeholder="Descreva o que aconteceu..."
                                value={formulario.mensagem}
                                onChange={(e) => setFormulario({...formulario, mensagem: e.target.value})}
                            />
                        </div>

                        <button onClick={adicionarRegistro} className="btn-save">Registrar</button>
                    </div>
                </div>

                {/* Direita: Insights Inteligentes */}
                <div className="insights-section">
                    <h3>🤖 Insights & Ações</h3>
                    <div className="insights-list">
                        
                        {/* Lógica: Se houver erros HOJE, mostra botão de PDCA */}
                        {registros.filter(r => r.tipo === 'Erro' && r.dataHora.includes(getDataHoje())).length > 0 ? (
                            <div className="alert-box critical">
                                <strong>⚠️ Atenção Operacional</strong>
                                <p>Incidentes detectados hoje. O score baixou.</p>
                                <button className="btn-pdca" onClick={abrirPDCA}>
                                    Gerar PDCA Automático
                                </button>
                            </div>
                        ) : (
                            <div className="alert-box clean">
                                <strong>✅ Operação Estável</strong>
                                <p>Nenhum erro crítico registrado hoje.</p>
                            </div>
                        )}

                        <div className="alert-box info">
                            <strong>📊 Estatística</strong>
                            <p>{registros.length} registros no histórico total.</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="divider" />

            {/* Tabela de Histórico */}
            <h3>Timeline Completa</h3>
            <div style={{overflowX: 'auto'}}>
                <table className="log-table">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Categoria</th>
                            <th>Cliente</th>
                            <th>Status</th>
                            <th>Mensagem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((item) => (
                            <tr key={item.id}>
                                <td>{item.dataHora.split(' ')[1]}</td>
                                <td><span className="badge-cat">{item.categoria}</span></td>
                                <td>{item.cliente}</td>
                                <td>
                                    <span className={`badge-log tipo-${item.tipo.toLowerCase()}`}>
                                        {item.tipo}
                                    </span>
                                </td>
                                <td>{item.mensagem}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{textAlign:'center', padding:'20px', color:'#999'}}>
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL (JANELA) DE PDCA --- */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Plan - Do - Check - Act</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        
                        <div className="form-group">
                            <label>Problema Identificado (P):</label>
                            <input 
                                type="text" 
                                value={pdcaData.problema} 
                                onChange={(e) => setPdcaData({...pdcaData, problema: e.target.value})}
                                style={{backgroundColor: '#fff3cd', borderColor: '#ffeeba'}} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Causa Raiz (Por que aconteceu?):</label>
                            <textarea 
                                rows="2" 
                                placeholder="Utilize os 5 Porquês..."
                                value={pdcaData.causa}
                                onChange={(e) => setPdcaData({...pdcaData, causa: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>Plano de Ação (O que faremos?):</label>
                            <textarea 
                                rows="2" 
                                placeholder="Ação imediata para resolver..."
                                value={pdcaData.acao}
                                onChange={(e) => setPdcaData({...pdcaData, acao: e.target.value})}
                            />
                        </div>

                        <button className="btn-confirm" onClick={salvarPDCA}>Salvar Plano de Ação</button>
                    </div>
                </div>
            )}
        </div>
    );
}