import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell 
} from 'recharts';

// --- ÍCONES ---
const IconTrophy = () => <span>🏆</span>;
const IconShield = () => <span>🛡️</span>;
const IconWarning = () => <span>⚠️</span>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

export function AnalyticsDashboard() {
    
    // --- ESTILOS CSS ---
    const styles = `
        .dash-container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; color: #1f2937; }
        .dash-header { margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
        .dash-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .dash-subtitle { color: #6b7280; font-size: 14px; margin-top: 5px; }
        
        .gamification-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .medal-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: transform 0.2s; }
        .medal-card:hover { transform: translateY(-2px); }
        .medal-icon { font-size: 30px; margin-bottom: 10px; display: block; }
        .medal-value { font-size: 28px; font-weight: 800; color: #111827; display: block; }
        .medal-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .chart-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .chart-header { margin-bottom: 20px; font-weight: 600; color: #374151; display: flex; justify-content: space-between; font-size: 14px; }
        
        .search-section { background: white; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .search-box { position: relative; display: flex; align-items: center; margin-bottom: 20px; }
        .search-input { width: 100%; padding: 12px 15px 12px 45px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; transition: border 0.2s; }
        .search-input:focus { border-color: #2563eb; }
        .search-icon-pos { position: absolute; left: 15px; color: #9ca3af; }
        
        .results-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .result-item { padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #ccc; }
        .result-highlight { background: #fffbeb; color: #b45309; font-weight: bold; padding: 0 2px; }
        .result-meta { font-size: 11px; color: #666; display: flex; justify-content: space-between; margin-bottom: 5px; }
        .result-text { font-size: 14px; color: #333; line-height: 1.4; }
        .result-suggestion { margin-top: 8px; font-size: 12px; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 5px; }

        @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
    `;

    // --- LÓGICA DE DADOS ---
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            // Lê os dados salvos no navegador pelo Diário de Operações
            const data = JSON.parse(localStorage.getItem('ops_logs_vitalicio')) || [];
            setLogs(data);
        } catch (e) { console.error(e); }
    }, []);

    // 1. Dados para Pareto (Contagem de Erros por Categoria)
    const dadosPareto = Object.entries(logs.reduce((acc, curr) => {
        // Conta apenas se for algo negativo
        if(curr.tipo.includes('Erro') || curr.tipo.includes('Falha') || curr.tipo.includes('Risco') || curr.tipo.includes('Quebra')) {
            acc[curr.categoria] = (acc[curr.categoria] || 0) + 1;
        }
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5); // Pega o Top 5

    // 2. Dados para Tendência (Volume por dia - Últimos 7 dias)
    const dadosTendencia = Object.entries(logs.reduce((acc, curr) => {
        const dataKey = curr.data.substring(0, 5); // Pega apenas DD/MM
        acc[dataKey] = (acc[dataKey] || 0) + 1;
        return acc;
    }, {})).map(([date, count]) => ({ date, count })).slice(-7);

    // 3. Métricas de Gamificação
    const totalMelhorias = logs.filter(l => l.tipo.includes('Melhoria')).length;
    const categoriaProblematica = dadosPareto.length > 0 ? dadosPareto[0].name : "Nenhuma"; // O campeão de erros
    const totalRegistros = logs.length;

    // 4. Lógica de Busca (Filtra pelo texto ou categoria)
    const resultados = logs.filter(l => searchTerm && (l.textoOriginal.toLowerCase().includes(searchTerm.toLowerCase()) || l.categoria.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="dash-container">
            <style>{styles}</style>
            
            <div className="dash-header">
                <h1 className="dash-title">📊 Central de Inteligência</h1>
                <p className="dash-subtitle">Visualização estratégica e base de conhecimento operacional.</p>
            </div>

            {/* SEÇÃO 1: GAMIFICAÇÃO */}
            <div className="gamification-grid">
                <div className="medal-card" style={{borderColor:'#fcd34d'}}>
                    <span className="medal-icon"><IconTrophy /></span>
                    <span className="medal-value">{totalMelhorias}</span>
                    <span className="medal-label">Ideias de Melhoria</span>
                </div>
                <div className="medal-card" style={{borderColor:'#fecaca'}}>
                    <span className="medal-icon"><IconWarning /></span>
                    <span className="medal-value">{categoriaProblematica}</span>
                    <span className="medal-label">Maior Ofensor (Foco)</span>
                </div>
                <div className="medal-card" style={{borderColor:'#e5e7eb'}}>
                    <span className="medal-icon"><IconShield /></span>
                    <span className="medal-value">{totalRegistros}</span>
                    <span className="medal-label">Total de Registros</span>
                </div>
            </div>

            {/* SEÇÃO 2: GRÁFICOS */}
            <div className="charts-grid">
                {/* Gráfico de Pareto */}
                <div className="chart-card">
                    <div className="chart-header">
                        <span>TOP 5 PROBLEMAS (PARETO)</span>
                        <small style={{color:'#dc2626'}}>Onde estamos falhando?</small>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={dadosPareto} layout="vertical" margin={{left:10}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} style={{fontSize:12}} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2563eb" radius={[0,4,4,0]}>
                                    {dadosPareto.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : '#2563eb'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Tendência */}
                <div className="chart-card">
                    <div className="chart-header">
                        <span>VOLUME DIÁRIO</span>
                        <small style={{color:'#2563eb'}}>Tendência da semana</small>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={dadosTendencia}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" style={{fontSize:12}} />
                                <YAxis style={{fontSize:12}} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 3: BUSCA INTELIGENTE */}
            <div className="search-section">
                <div className="chart-header">
                    <span>🧠 BASE DE CONHECIMENTO</span>
                    <small>Não reinvente a roda. Pesquise soluções anteriores.</small>
                </div>
                <div className="search-box">
                    <span className="search-icon-pos"><IconSearch /></span>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Digite o problema (ex: 'caminhão', 'internet', 'falta de luz')..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {searchTerm && (
                    <div className="results-list">
                        {resultados.length === 0 ? (
                            <div style={{textAlign:'center', color:'#999', padding:20}}>Nenhum registro encontrado.</div>
                        ) : (
                            resultados.map(log => (
                                <div key={log.id} className="result-item" style={{borderLeftColor: log.tipo.includes('Erro') ? '#dc2626' : '#16a34a'}}>
                                    <div className="result-meta">
                                        <strong>{log.data} - {log.hora}</strong>
                                        <span>{log.categoria}</span>
                                    </div>
                                    <div className="result-text">
                                        {/* Destaque da palavra pesquisada (Highlight) */}
                                        {log.textoOriginal.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                            part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="result-highlight">{part}</span> : part
                                        )}
                                    </div>
                                    <div className="result-suggestion">
                                        💡 Dica: Verifique se foi criado um PDCA nesta data para resolver a causa raiz.
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}