import React, { useState, useEffect } from 'react';
import '../style.css'; // Certifique-se de que o CSS abaixo está neste arquivo

export function OperationsDashboard() {
    // Estado inicial com alguns dados para exemplo visual
    const [registros, setRegistros] = useState([
        { id: 1, dataHora: '05/12/2024 08:00', categoria: 'RH', tipo: 'Info', cliente: 'Interno', mensagem: 'Equipe completa no turno da manhã.' },
        { id: 2, dataHora: '05/12/2024 09:15', categoria: 'Frota', tipo: 'Erro', cliente: 'Logística', mensagem: 'Caminhão 02 saiu com 15 min de atraso.' }
    ]);

    const [formulario, setFormulario] = useState({
        cliente: '',
        categoria: 'Operacional',
        tipo: 'Regra',
        mensagem: ''
    });

    // Estado para "Saúde do Dia"
    const [saudeOperacional, setSaudeOperacional] = useState({
        score: 100,
        status: 'Excelente',
        cor: '#2ecc71' // Verde
    });

    // Efeito: Toda vez que 'registros' muda, recalculamos a saúde do dia
    useEffect(() => {
        calcularSaudeDoDia();
    }, [registros]);

    const calcularSaudeDoDia = () => {
        // Lógica simples: Cada erro tira 20 pontos. Cada alerta tira 10.
        let pontuacao = 100;
        registros.forEach(reg => {
            if (reg.tipo === 'Erro') pontuacao -= 20;
            if (reg.tipo === 'Alerta') pontuacao -= 10;
        });

        if (pontuacao < 0) pontuacao = 0;

        let status = 'Excelente';
        let cor = '#2ecc71'; // Verde

        if (pontuacao < 80) { status = 'Regular'; cor = '#f1c40f'; } // Amarelo
        if (pontuacao < 50) { status = 'Crítico'; cor = '#e74c3c'; } // Vermelho

        setSaudeOperacional({ score: pontuacao, status, cor });
    };

    const adicionarRegistro = () => {
        if (formulario.cliente === "" || formulario.mensagem === "") {
            alert("Preencha todos os campos obrigatórios.");
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

    // Função auxiliar para contar ocorrências por categoria
    const contarPorCategoria = (cat) => registros.filter(r => r.categoria === cat && r.tipo === 'Erro').length;

    return (
        <div className="container-page">
            <header className="dashboard-header">
                <div>
                    <h1 className="page-title">Painel de Comando Operacional</h1>
                    <p className="subtitle">Visão em tempo real do dia {new Date().toLocaleDateString()}</p>
                </div>
                
                {/* Score do Dia (Item 5 da sua lista) */}
                <div className="daily-score" style={{ borderColor: saudeOperacional.cor }}>
                    <span className="score-label">Saúde do Dia</span>
                    <h2 style={{ color: saudeOperacional.cor }}>{saudeOperacional.status}</h2>
                    <span className="score-number">{saudeOperacional.score}%</span>
                </div>
            </header>

            {/* Painel de Saúde (Item 4 da sua lista) */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3>👥 RH / Mão de Obra</h3>
                    <p>{contarPorCategoria('RH')} incidentes hoje</p>
                    <div className={`status-dot ${contarPorCategoria('RH') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>🚚 Frota / Entregas</h3>
                    <p>{contarPorCategoria('Frota')} atrasos/erros</p>
                    <div className={`status-dot ${contarPorCategoria('Frota') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>⭐ Qualidade / Cliente</h3>
                    <p>{contarPorCategoria('Qualidade')} reclamações</p>
                    <div className={`status-dot ${contarPorCategoria('Qualidade') > 0 ? 'dot-red' : 'dot-green'}`}></div>
                </div>
                <div className="kpi-card">
                    <h3>⚙️ Processos</h3>
                    <p>{contarPorCategoria('Operacional')} falhas</p>
                    <div className={`status-dot ${contarPorCategoria('Operacional') > 0 ? 'dot-red' : 'dot-green'}`}></div>
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

                        <button onClick={adicionarRegistro} className="btn-save">Registrar no Diário</button>
                    </div>
                </div>

                {/* Lado Direito: Inteligência / Alertas (Item 2 e 3 da sua lista) */}
                <div className="insights-section">
                    <h3>🤖 Insights & Alertas Automáticos</h3>
                    <div className="insights-list">
                        {registros.filter(r => r.tipo === 'Erro').length > 0 ? (
                            <div className="alert-box critical">
                                <strong>⚠️ Padrão Detectado</strong>
                                <p>Detectamos incidentes operacionais hoje.</p>
                                <button className="btn-pdca">Gerar PDCA Automático</button>
                            </div>
                        ) : (
                            <div className="alert-box clean">
                                <strong>✅ Operação Estável</strong>
                                <p>Nenhum padrão crítico detectado até o momento.</p>
                            </div>
                        )}

                        {/* Exemplo de previsão estática baseada no texto (simulação) */}
                        <div className="alert-box info">
                            <strong>📊 Previsão (IA)</strong>
                            <p>Baseado no histórico, sextas-feiras têm 30% mais risco de atraso na frota.</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="divider" />

            {/* Timeline Histórica */}
            <h3>Timeline do Dia</h3>
            <table className="log-table">
                <thead>
                    <tr>
                        <th>Hora</th>
                        <th>Cat.</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Mensagem</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.map((item) => (
                        <tr key={item.id}>
                            <td>{item.dataHora.split(' ')[1]}</td> {/* Só a hora */}
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
                </tbody>
            </table>
        </div>
    );
}