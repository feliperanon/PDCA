import React, { useState, useEffect } from 'react';
import '../style.css'; 

export function OperationsDashboard() {
    // 1. CARREGAR DADOS: Ao iniciar, tentamos ler do LocalStorage. 
    // Se não houver nada, iniciamos com uma lista vazia.
    const [registros, setRegistros] = useState(() => {
        const dadosSalvos = localStorage.getItem('diario_operacoes');
        if (dadosSalvos) {
            return JSON.parse(dadosSalvos);
        } else {
            return []; // Começa vazio se for a primeira vez
        }
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

    // 2. SALVAR DADOS: Sempre que 'registros' mudar, salvamos no navegador.
    useEffect(() => {
        localStorage.setItem('diario_operacoes', JSON.stringify(registros));
        calcularSaudeDoDia();
    }, [registros]);

    // Função para pegar a data de hoje formatada (ex: 05/12/2024)
    const getDataHoje = () => new Date().toLocaleDateString();

    const calcularSaudeDoDia = () => {
        const hoje = getDataHoje();
        
        // Filtramos apenas o que aconteceu HOJE para o cálculo do Score
        const ocorrenciasHoje = registros.filter(r => r.dataHora.includes(hoje));

        let pontuacao = 100;
        
        ocorrenciasHoje.forEach(reg => {
            if (reg.tipo === 'Erro') pontuacao -= 20;   // Erros pesam mais
            if (reg.tipo === 'Alerta') pontuacao -= 10; // Alertas pesam menos
        });

        if (pontuacao < 0) pontuacao = 0;

        let status = 'Excelente';
        let cor = '#2ecc71';

        if (pontuacao < 80) { status = 'Atenção'; cor = '#f1c40f'; }
        if (pontuacao < 60) { status = 'Crítico'; cor = '#e74c3c'; }

        setSaudeOperacional({ score: pontuacao, status, cor });
    };

    const adicionarRegistro = () => {
        if (formulario.cliente === "" || formulario.mensagem === "") {
            alert("Preencha o cliente e a descrição.");
            return;
        }

        const novoRegistro = {
            id: Date.now(),
            // Guardamos a data e hora completas
            dataHora: new Date().toLocaleString(),
            dataSimples: getDataHoje(), // Útil para filtros futuros
            ...formulario
        };

        // Adicionamos o novo no topo da lista
        setRegistros([novoRegistro, ...registros]);
        setFormulario({ ...formulario, cliente: '', mensagem: '' });
    };

    // Função para limpar tudo (útil para testes)
    const resetarSistema = () => {
        if(window.confirm("Tem certeza? Isso apagará todo o histórico.")){
            setRegistros([]);
        }
    };

    // Contar ocorrências SÓ DE HOJE para os cards
    const contarHoje = (cat) => {
        const hoje = getDataHoje();
        return registros.filter(r => r.categoria === cat && r.tipo === 'Erro' && r.dataHora.includes(hoje)).length;
    };

    return (
        <div className="container-page">
            <header className="dashboard-header">
                <div>
                    <h1 className="page-title">Painel de Comando Operacional</h1>
                    <p className="subtitle">Visão do dia: {getDataHoje()}</p>
                    <button onClick={resetarSistema} style={{fontSize: '10px', color: '#999', background: 'none', border:'none', cursor:'pointer', textDecoration:'underline'}}>
                        Resetar Sistema
                    </button>
                </div>
                
                <div className="daily-score" style={{ borderColor: saudeOperacional.cor }}>
                    <span className="score-label">Saúde do Dia</span>
                    <h2 style={{ color: saudeOperacional.cor }}>{saudeOperacional.status}</h2>
                    <span className="score-number">{saudeOperacional.score}%</span>
                </div>
            </header>

            {/* KPIs - Agora mostram apenas dados de HOJE */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3>👥 RH / Mão de Obra</h3>
                    <p>{contarHoje('RH')} incidentes</p>
                    <div className={`status-dot ${contarHoje('RH') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>🚚 Frota / Entregas</h3>
                    <p>{contarHoje('Frota')} incidentes</p>
                    <div className={`status-dot ${contarHoje('Frota') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>⭐ Qualidade</h3>
                    <p>{contarHoje('Qualidade')} reclamações</p>
                    <div className={`status-dot ${contarHoje('Qualidade') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>⚙️ Processos</h3>
                    <p>{contarHoje('Operacional')} falhas</p>
                    <div className={`status-dot ${contarHoje('Operacional') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
            </div>

            <div className="main-grid">
                {/* Lado Esquerdo: Formulário */}
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
                                placeholder="O que aconteceu?"
                                value={formulario.mensagem}
                                onChange={(e) => setFormulario({...formulario, mensagem: e.target.value})}
                            />
                        </div>

                        <button onClick={adicionarRegistro} className="btn-save">Registrar</button>
                    </div>
                </div>

                {/* Lado Direito: Inteligência */}
                <div className="insights-section">
                    <h3>🤖 Insights & Alertas</h3>
                    <div className="insights-list">
                        
                        {/* Lógica de Alerta: Verifica se hoje tem erros */}
                        {registros.filter(r => r.tipo === 'Erro' && r.dataHora.includes(getDataHoje())).length > 0 ? (
                            <div className="alert-box critical">
                                <strong>⚠️ Atenção Operacional</strong>
                                <p>Ocorrências críticas registadas hoje. O score caiu.</p>
                                <button className="btn-pdca">Gerar PDCA</button>
                            </div>
                        ) : (
                            <div className="alert-box clean">
                                <strong>✅ Operação Estável</strong>
                                <p>Nenhum erro crítico hoje. Continue assim!</p>
                            </div>
                        )}

                        {/* Histórico Geral */}
                        <div className="alert-box info">
                            <strong>📚 Memória do Sistema</strong>
                            <p>Total de registos no histórico: {registros.length}</p>
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
                            <th>Data/Hora</th>
                            <th>Categoria</th>
                            <th>Cliente</th>
                            <th>Status</th>
                            <th>Mensagem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((item) => (
                            <tr key={item.id}>
                                <td style={{fontSize: '11px'}}>{item.dataHora}</td>
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
                                <td colSpan="5" style={{textAlign:'center', color:'#999', padding:'20px'}}>
                                    Ainda não há dados. Comece a registrar!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}