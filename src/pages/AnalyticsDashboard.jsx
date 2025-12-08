import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// --- ÍCONES ---
const IconTrophy = () => <span>🏆</span>;
const IconShield = () => <span>🛡️</span>;
const IconWarning = () => <span>⚠️</span>;
const IconAnalyze = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

// --- LÓGICA DE MINERAÇÃO DE TEXTO ---
const STOPWORDS = new Set([
    'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'uma', 'com', 'na', 'no', 'eh', 'e', 'as', 'os', 'para', 'nao', 'foi', 'pelo', 'pela', 'tem', 'ser', 'estava'
]);

function extrairPadroesCronicos(logs) {
    const falhasPorCategoria = {};
    logs.forEach(log => {
        if ((log.tipo || "").includes('Erro') || (log.tipo || "").includes('Falha')) {
            const cat = log.categoria || "Geral";
            if (!falhasPorCategoria[cat]) falhasPorCategoria[cat] = [];
            falhasPorCategoria[cat].push(log);
        }
    });

    const padroes = [];
    Object.keys(falhasPorCategoria).forEach(cat => {
        const logsCat = falhasPorCategoria[cat];
        const termoContagem = {};

        logsCat.forEach(log => {
            const palavras = (log.textoOriginal || "").toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
            palavras.forEach(p => {
                const raiz = p.length > 4 ? p.substring(0, 4) : p;
                if (p.length > 3 && !STOPWORDS.has(p)) {
                    if (!termoContagem[raiz]) termoContagem[raiz] = { termo: p, count: 0, logs: [] };
                    termoContagem[raiz].count++;
                    termoContagem[raiz].logs.push(log);
                }
            });
        });

        Object.values(termoContagem).forEach(item => {
            if (item.count >= 2) {
                padroes.push({ categoria: cat, termo: item.termo.charAt(0).toUpperCase() + item.termo.slice(1), count: item.count, exemplos: item.logs });
            }
        });
    });

    return padroes.sort((a, b) => b.count - a.count);
}

export function AnalyticsDashboard() {

    // --- ESTILOS CSS REFORMULADOS ---
    const styles = `
        :root { --primary: #4f46e5; --bg: #f1f5f9; --text-main: #1e293b; --text-sec: #64748b; --surface: #ffffff; --border: #e2e8f0; }
        .dash-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', sans-serif; color: var(--text-main); }
        
        .dash-header { margin-bottom: 30px; }
        .dash-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
        .dash-subtitle { color: var(--text-sec); font-size: 15px; margin-top: 5px; }
        
        /* KPI GRID */
        .gamification-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 30px; }
        .medal-card { 
            background: var(--surface); padding: 25px; border-radius: 16px; border: 1px solid var(--border); text-align: center; 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; position: relative; overflow: hidden; 
        }
        .medal-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .medal-icon { font-size: 32px; margin-bottom: 10px; display: block; filter: grayscale(0.2); opacity: 0.9; }
        .medal-value { font-size: 32px; font-weight: 800; color: #0f172a; display: block; line-height: 1.2; }
        .medal-label { font-size: 12px; color: var(--text-sec); text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; }
        
        /* PATTERNS SECTION (DARK MODE STYLE) */
        .patterns-section { 
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 20px; padding: 30px; 
            margin-bottom: 30px; color: white; box-shadow: 0 20px 25px -5px rgba(49, 46, 129, 0.4); 
        }
        .patterns-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
        .patterns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .pattern-card { 
            background: rgba(255,255,255,0.07); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); 
            padding: 16px 20px; border-radius: 14px; cursor: pointer; transition: all 0.2s; 
        }
        .pattern-card:hover { background: rgba(255,255,255,0.15); transform: scale(1.02); }
        .pattern-cat { font-size: 11px; text-transform: uppercase; color: #a5b4fc; font-weight: 700; display: block; margin-bottom: 4px; }
        .pattern-term { font-size: 18px; font-weight: 700; color: #fff; display: flex; justify-content: space-between; align-items: center; }
        .pattern-count { background: #ef4444; color: white; font-size: 12px; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
        
        /* GRÁFICOS */
        .charts-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-bottom: 30px; }
        .chart-card { background: var(--surface); border-radius: 16px; padding: 25px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .chart-header { margin-bottom: 25px; font-weight: 700; color: #334155; font-size: 15px; display: flex; justify-content: space-between; align-items: center; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* SEARCH */
        .search-section { background: var(--surface); padding: 30px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .search-box { position: relative; margin-bottom: 20px; }
        .search-input { 
            width: 100%; padding: 16px 20px 16px 50px; border: 2px solid var(--border); border-radius: 12px; 
            font-size: 16px; outline: none; transition: border 0.2s; background: #f8fafc; color: var(--text-main);
        }
        .search-input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .search-icon-pos { position: absolute; left: 20px; top: 18px; color: var(--text-sec); }
        
        .results-list { max-height: 400px; overflow-y: auto; display: grid; gap: 10px; }
        .result-item { padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border); transition: transform 0.1s; border-left: 4px solid #cbd5e1; }
        .result-item:hover { background: #fff; border-color: #cbd5e1; transform: translateX(2px); }
        .result-meta { font-size: 12px; color: var(--text-sec); font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 6px; }
        .result-text { font-size: 14px; color: var(--text-main); line-height: 1.5; }
        
        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; justify-content: center; align-items: center; z-index: 50; backdrop-filter: blur(4px); }
        .modal-body { background: white; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; border-radius: 16px; padding: 25px; animation: popIn 0.3s; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border); }
        
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @media (max-width: 900px) { .gamification-grid, .charts-grid, .patterns-grid { grid-template-columns: 1fr; } }
    `;

    // --- ESTADOS ---
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [padroesCronicos, setPadroesCronicos] = useState([]);
    const [modalPadrao, setModalPadrao] = useState(null);

    // --- FIRESTORE ---
    useEffect(() => {
        const q = query(collection(db, "operation_logs"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLogs(logsData);
            setPadroesCronicos(extrairPadroesCronicos(logsData));
        });
        return () => unsubscribe();
    }, []);

    // KPIs e Gráficos
    const dadosPareto = Object.entries(logs.reduce((acc, curr) => {
        if ((curr.tipo || "").includes('Erro') || (curr.tipo || "").includes('Falha') || (curr.tipo || "").includes('Risco')) {
            const cat = curr.categoria || "Geral";
            acc[cat] = (acc[cat] || 0) + 1;
        }
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const dadosTendencia = Object.entries(logs.reduce((acc, curr) => {
        if (curr.data) {
            const dataKey = curr.data.substring(0, 5);
            acc[dataKey] = (acc[dataKey] || 0) + 1;
        }
        return acc;
    }, {})).map(([date, count]) => ({ date, count })).slice(-7);

    const totalMelhorias = logs.filter(l => (l.tipo || "").includes('Melhoria')).length;
    const campeaoErros = dadosPareto.length > 0 ? dadosPareto[0].name : "Excelente";

    const resultados = logs.filter(l => searchTerm && (
        (l.textoOriginal || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.categoria || "").toLowerCase().includes(searchTerm.toLowerCase())
    ));

    return (
        <div className="dash-container">
            <style>{styles}</style>

            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Central de Inteligência</h1>
                    <p className="dash-subtitle">Visão estratégica e análise preditiva da operação.</p>
                </div>
            </div>

            {/* SEÇÃO IMPORTANTE: DETECTOR DE PADRÕES */}
            <div className="patterns-section">
                <div className="patterns-header">
                    <IconAnalyze />
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Detector de Padrões Recorrentes</h2>
                        <span style={{ fontSize: '13px', opacity: 0.85 }}>Inteligência artificial analisou {logs.length} registros em busca de problemas crônicos.</span>
                    </div>
                </div>

                <div className="patterns-grid">
                    {padroesCronicos.length === 0 ? (
                        <div style={{ fontStyle: 'italic', opacity: 0.7 }}>Nenhum padrão crônico detectado. Operação saudável.</div>
                    ) : (
                        padroesCronicos.slice(0, 6).map((padrao, idx) => (
                            <div className="pattern-card" key={idx} onClick={() => setModalPadrao(padrao)}>
                                <span className="pattern-cat">{padrao.categoria}</span>
                                <div className="pattern-term">
                                    "{padrao.termo}"
                                    <span className="pattern-count">{padrao.count}x</span>
                                </div>
                                <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>Clique para ver detalhes</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* KPI GRID */}
            <div className="gamification-grid">
                <div className="medal-card">
                    <span className="medal-icon"><IconWarning /></span>
                    <span className="medal-value" style={{ color: '#ef4444' }}>{campeaoErros}</span>
                    <span className="medal-label">Principal Ofensor</span>
                </div>
                <div className="medal-card">
                    <span className="medal-icon"><IconTrophy /></span>
                    <span className="medal-value" style={{ color: '#eab308' }}>{totalMelhorias}</span>
                    <span className="medal-label">Ideias Geradas</span>
                </div>
                <div className="medal-card">
                    <span className="medal-icon"><IconShield /></span>
                    <span className="medal-value" style={{ color: '#4f46e5' }}>{logs.length}</span>
                    <span className="medal-label">Logs Totais</span>
                </div>
            </div>

            {/* GRÁFICOS */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <span>TOP 5 OFENSORES (PARETO)</span>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={dadosPareto} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 11, fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                                    {dadosPareto.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#4f46e5'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <span>VOLUME DIÁRIO</span>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={dadosTendencia}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" style={{ fontSize: 11 }} />
                                <YAxis style={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* BUSCA */}
            <div className="search-section">
                <div className="chart-header" style={{ marginBottom: '15px' }}>
                    <span>Pesquisa na Base de Conhecimento</span>
                </div>
                <div className="search-box">
                    <span className="search-icon-pos"><IconSearch /></span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Busque por termos (ex: esteira, falta de luz, atraso)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="results-list">
                    {resultados.map(log => (
                        <div key={log.id} className="result-item" style={{ borderLeftColor: (log.tipo || "").includes('Erro') ? '#ef4444' : '#10b981' }}>
                            <div className="result-meta">
                                <span>{log.data} - {log.hora}</span>
                                <span>{log.categoria}</span>
                            </div>
                            <div className="result-text">{log.textoOriginal}</div>
                        </div>
                    ))}
                    {searchTerm && resultados.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Nenhum resultado encontrado.</div>}
                </div>
            </div>

            {/* MODAL PADRÃO */}
            {modalPadrao && (
                <div className="modal-overlay" onClick={() => setModalPadrao(null)}>
                    <div className="modal-body" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <h3>Padrão: "{modalPadrao.termo}"</h3>
                                <span>{modalPadrao.count} ocorrências em {modalPadrao.categoria}</span>
                            </div>
                            <button onClick={() => setModalPadrao(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><IconX /></button>
                        </div>
                        <div className="results-list">
                            {modalPadrao.exemplos.map(log => (
                                <div key={log.id} className="result-item" style={{ borderLeftColor: '#ef4444' }}>
                                    <div className="result-meta">
                                        <span>{log.data}</span>
                                        <b style={{ color: '#ef4444' }}>{log.tipo}</b>
                                    </div>
                                    <div className="result-text">{log.textoOriginal}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}