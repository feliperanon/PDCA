import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

// --- ÍCONES ---
const IconTrophy = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 21"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 21"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconTrend = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;

export function AnalyticsDashboard() {
    
    // --- ESTILOS CSS IN-LINE (Para facilitar a cópia) ---
    const styles = `
        .dashboard-container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; color: #1f2937; }
        .dash-header { margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
        .dash-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 10px; }
        
        .grid-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .chart-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .chart-title { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; }
        
        .full-width { grid-column: span 2; }
        
        .search-container { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .search-input-wrapper { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 15px; color: #9ca3af; }
        .search-input { width: 100%; padding: 12px 12px 12px 45px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; transition: border 0.2s; }
        .search-input:focus { border-color: #2563eb; }
        
        .results-list { margin-top: 15px; max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .result-item { padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #ccc; font-size: 14px; }
        .result-highlight { background: #fffbeb; color: #b45309; font-weight: bold; padding: 0 4px; border-radius: 2px; }
        
        .gamification-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .medal-card { background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; position: relative; overflow: hidden; }
        .medal-icon { background: #fef3c7; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
        .medal-value { font-size: 28px; font-weight: 800; color: #111827; }
        .medal-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        
        @media (max-width: 768px) { .grid-charts, .gamification-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }
    `;

    // --- ESTADO & DADOS ---
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            // Puxa os dados do mesmo local que o Diário Operacional
            const data = JSON.parse(localStorage.getItem('ops_logs_vitalicio')) || [];
            setLogs(data);
        } catch (e) {
            console.error("Erro ao carregar logs", e);
        }
    }, []);

    // --- CÁLCULOS PARA GRÁFICOS ---
    
    // 1. Pareto: Quais categorias dão mais erro?
    const dadosPareto = Object.entries(logs.reduce((acc, curr) => {
        if(curr.tipo.includes('Erro') || curr.tipo.includes('Falha') || curr.tipo.includes('Quebra') || curr.tipo.includes('Ruptura')) {
            acc[curr.categoria] = (acc[curr.categoria] || 0) + 1;
        }
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // 2. Tendência Semanal (Agrupado por Data)
    const dadosTendencia = Object.entries(logs.reduce((acc, curr) => {
        // Pega apenas dd/mm para simplificar
        const dataSimples = curr.data.split('/').slice(0, 2).join('/'); 
        acc[dataSimples] = (acc[dataSimples] || 0) + 1;
        return acc;
    }, {})).map(([date, count]) => ({ date, count })).slice(-7); // Últimos 7 dias

    // 3. Mapa de Calor (Dia da Semana)
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dadosDiaSemana = logs.reduce((acc, curr) => {
        const parts = curr.data.split('/');
        // Ajuste simples para converter string pt-BR em data
        const dt = new Date(parts[2], parts[1]-1, parts[0]);
        if(!isNaN(dt)) {
            const dia = diasSemana[dt.getDay()];
            const existing = acc.find(d => d.name === dia);
            if (existing) {
                if(curr.tipo.includes('Erro')) existing.erros += 1;
                else if(curr.tipo.includes('Melhoria')) existing.melhorias += 1;
            } else {
                acc.push({ 
                    name: dia, 
                    erros: curr.tipo.includes('Erro') ? 1 : 0, 
                    melhorias: curr.tipo.includes('Melhoria') ? 1 : 0 
                });
            }
        }
        return acc;
    }, []);

    // --- GAMIFICAÇÃO ---
    const totalMelhorias = logs.filter(l => l.tipo.includes('Melhoria')).length;
    // O último do Pareto tem menos erros (é o mais seguro)
    const setorCampeao = dadosPareto.length > 0 ? dadosPareto[dadosPareto.length - 1].name : '-'; 
    // O primeiro do Pareto é o ofensor
    const maiorProblema = dadosPareto.length > 0 ? dadosPareto[0].name : '-';

    // --- BUSCA SEMÂNTICA ---
    const resultadosBusca = logs.filter(log => {
        if (!searchTerm) return false;
        return log.textoOriginal.toLowerCase().includes(searchTerm.toLowerCase()) ||
               log.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="dashboard-container">
            <style>{styles}</style>
            
            <div className="dash-header">
                <h1 className="dash-title"><IconTrend /> Central de Inteligência</h1>
                <p style={{color:'#6b7280', margin:'5px 0 0 0'}}>Visualização estratégica, gamificação e base de conhecimento.</p>
            </div>

            {/* 1. GAMIFICAÇÃO */}
            <h3 style={{marginBottom:'15px', color:'#4b5563'}}>🏆 Gamificação da Equipe</h3>
            <div className="gamification-grid">
                <div className="medal-card">
                    <div className="medal-icon"><IconTrophy /></div>
                    <div className="medal-value">{totalMelhorias}</div>
                    <div className="medal-label">Ideias de Melhoria</div>
                </div>
                <div className="medal-card" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', borderColor:'#bbf7d0'}}>
                    <div className="medal-icon" style={{background:'#dcfce7', color:'#16a34a'}}>🛡️</div>
                    <div className="medal-value" style={{fontSize:'20px', marginTop:'8px'}}>{setorCampeao}</div>
                    <div className="medal-label">Setor + Seguro (Menos Erros)</div>
                </div>
                <div className="medal-card" style={{background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', borderColor:'#fecaca'}}>
                    <div className="medal-icon" style={{background:'#fee2e2'}}>⚠️</div>
                    <div className="medal-value" style={{fontSize:'20px', marginTop:'8px'}}>{maiorProblema}</div>
                    <div className="medal-label">Maior Ofensor (Pareto)</div>
                </div>
            </div>

            {/* 2. GRÁFICOS GERENCIAIS */}
            <div className="grid-charts">
                {/* PARETO */}
                <div className="chart-card">
                    <div className="chart-title"><span>Princípio de Pareto (80/20)</span> <small>Onde focar?</small></div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={dadosPareto} layout="vertical" margin={{left:20}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={80} style={{fontSize:'12px'}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]}>
                                    {dadosPareto.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : '#2563eb'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TENDÊNCIA */}
                <div className="chart-card">
                    <div className="chart-title"><span>Tendência de Registros</span> <small>Volume diário</small></div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={dadosTendencia}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} dot={{r:4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. BUSCA INTELIGENTE */}
            <div className="search-container">
                <div className="dash-title" style={{fontSize:'18px', marginBottom:'15px'}}>
                    <IconSearch /> Base de Conhecimento
                </div>
                <div className="search-input-wrapper">
                    <span className="search-icon"><IconSearch /></span>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Pergunte ao histórico: 'Caminhão quebrou', 'Falta de luz', 'Verdemar'..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {searchTerm && (
                    <div className="results-list">
                        {resultadosBusca.length === 0 ? (
                            <div style={{padding:'20px', textAlign:'center', color:'#999'}}>Nenhum registro histórico encontrado.</div>
                        ) : (
                            resultadosBusca.map(log => (
                                <div key={log.id} className="result-item" style={{borderLeftColor: log.tipo.includes('Erro') ? '#dc2626' : '#2563eb'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                        <strong>{log.data} - {log.categoria}</strong>
                                        <span style={{fontSize:'11px', color:'#666'}}>{log.tipo}</span>
                                    </div>
                                    <div>
                                        {/* Destaque do termo buscado */}
                                        {log.textoOriginal.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                            part.toLowerCase() === searchTerm.toLowerCase() 
                                                ? <span key={i} className="result-highlight">{part}</span> 
                                                : part
                                        )}
                                    </div>
                                    <div style={{marginTop:'8px', fontSize:'12px', color:'#16a34a', fontWeight:'600'}}>
                                        💡 Solução Sugerida: Verificar PDCA desta data.
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