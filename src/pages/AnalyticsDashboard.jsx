import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// --- ÍCONES ---
const IconTrophy = () => <span>🏆</span>;
const IconShield = () => <span>🛡️</span>;
const IconWarning = () => <span>⚠️</span>;
const IconAnalyze = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconFilter = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconIdea = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.9.09-1.46-.26-2.03-3-4.9-8.66-1.57-8.83 3.66 0 .58-.42 2.37.58 2.37H15.09z" /><path d="M12 2A7 7 0 0 0 5 9c0 4 3 7 3 7h8s3-3 3-7a7 7 0 0 0-7-7z" /></svg>;


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

// --- INTELLIGENCE CORE: K-MEANS CLUSTERING ---
function runKMeans(points, k = 3) {
    if (points.length < k) return null;

    // 1. Init Centroids (Random)
    let centroids = points.slice(0, k).map(p => ({ x: p.x, y: p.y }));
    let assignments = new Array(points.length).fill(0);

    for (let iter = 0; iter < 10; iter++) {
        // Assign
        assignments = points.map(p => {
            let minDist = Infinity;
            let cIdx = 0;
            centroids.forEach((c, idx) => {
                const dist = Math.sqrt(Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2));
                if (dist < minDist) { minDist = dist; cIdx = idx; }
            });
            return cIdx;
        });

        // Update
        const sums = Array(k).fill(0).map(() => ({ x: 0, y: 0, count: 0 }));
        points.forEach((p, idx) => {
            const c = assignments[idx];
            sums[c].x += p.x;
            sums[c].y += p.y;
            sums[c].count++;
        });
        centroids = sums.map((s, i) => s.count === 0 ? centroids[i] : { x: s.x / s.count, y: s.y / s.count });
    }

    return { centroids, assignments };
}

export function AnalyticsDashboard() {

    // --- ESTILOS CSS REFORMULADOS ---
    const styles = `
        :root { --primary: #4f46e5; --bg: #f1f5f9; --text-main: #1e293b; --text-sec: #64748b; --surface: #ffffff; --border: #e2e8f0; }
        .dash-container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', sans-serif; color: var(--text-main); }
        
        .dash-header { margin-bottom: 30px; }
        .dash-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
        .dash-subtitle { color: var(--text-sec); font-size: 15px; margin-top: 5px; }
        
        /* GRIDS LAYOUT */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 30px; }
        
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

    // --- FILTROS GLOBAIS ---
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedShift, setSelectedShift] = useState('all'); // all, manha, tarde, noite

    // Helper Filter Function
    const filterByRangeAndShift = (item, dateField = 'date', shiftField = 'shift') => {
        let passDate = true;
        let passShift = true;

        if (dateRange.start) passDate = passDate && item[dateField] >= dateRange.start;
        if (dateRange.end) passDate = passDate && item[dateField] <= dateRange.end;

        if (selectedShift !== 'all') {
            // Operações tem campo 'shift', Logs não tem campo shift direto (assumindo que logs não filtram por turno por enquanto, ou inferir pelo horário?)
            // Para logs, vamos ignorar turno por enquanto ou implementar lógica de hora.
            if (item[shiftField]) passShift = item[shiftField] === selectedShift;
        }

        return passDate && passShift;
    };

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

    // --- FIRESTORE DAILY OPERATIONS (REAL DATA) ---
    const [dailyOps, setDailyOps] = useState([]);
    useEffect(() => {
        const fetchOps = async () => {
            try {
                // Busca últimos 30 dias para análise
                const q = query(collection(db, "daily_operations"), orderBy("date", "asc"));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDailyOps(data);
            } catch (e) { console.error("Erro daily_operations:", e); }
        };
        fetchOps();
    }, []);

    // --- COMPONENT: INFO TIP ---
    const ChartInfoTip = ({ title, text }) => {
        const [visible, setVisible] = useState(false);
        return (
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}>
                <div
                    onMouseEnter={() => setVisible(true)}
                    onMouseLeave={() => setVisible(false)}
                    style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}
                >
                    <IconIdea />
                </div>
                {visible && (
                    <div style={{
                        position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                        background: '#fefce8', color: '#854d0e', padding: '12px', borderRadius: '8px',
                        border: '1px solid #fef08a', width: '250px', zIndex: 50, fontSize: '13px', lineHeight: '1.4',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '8px'
                    }}>
                        <strong>💡 {title}</strong>
                        <p style={{ margin: '5px 0 0 0' }}>{text}</p>
                        <div style={{ position: 'absolute', top: '100%', left: '50%', border: '6px solid transparent', borderTopColor: '#fef08a', transform: 'translateX(-50%)' }} />
                    </div>
                )}
            </div>
        );
    };

    // --- CÉREBRO DA IA (REGRESSÃO LINEAR & CORRELAÇÔES) ---
    const analysisResult = React.useMemo(() => {
        const filteredOps = dailyOps.filter(op => filterByRangeAndShift(op, 'date', 'shift'));

        // --- NEW: PRODUCTIVITY METRICS ---
        const productivitySeries = filteredOps.map(op => {
            // Somar staff total de todos os setores
            // Somar staff total de todos os setores
            let totalStaff = 0;
            // [NEW] Prioriza staff_effective (calculado no save). Fallback para staff_real (legado)
            const staffSource = op.staff_effective || op.staff_real;
            if (staffSource) {
                totalStaff = Object.values(staffSource).reduce((acc, val) => acc + (Number(val) || 0), 0);
            }
            // Tonelagem
            const ton = Number(op.tonelagem) || 0;

            // Produtividade (kg/pessoa)
            const prod = totalStaff > 0 ? Math.round(ton / totalStaff) : 0;

            return {
                date: new Date(op.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
                prod,
                ton,
                staff: totalStaff,
                fullDate: op.date
            };
        }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate)).slice(-7); // Last 7 ops

        // Preparar dados: X = Tonelagem, Y = Hr Saída (Decimal)
        const validPoints = filteredOps.map(op => {
            if (!op.tonelagem || !op.hora_saida) return null;
            const [h, m] = op.hora_saida.split(':').map(Number);
            const yTime = h + (m / 60);
            const xTon = Number(op.tonelagem) / 1000; // Em k

            // [NEW] Efficiency Score Calculation (Volume / (Staff * Time))
            // High Volume, Low Staff, Early Time -> High Score
            const staffRaw = op.staff_effective || op.staff_real || {};
            const totalStaff = Object.values(staffRaw).reduce((acc, val) => acc + (Number(val) || 0), 0);
            // Evitar divisão por zero. Se staff=0 ou Time=0, score=0.
            const efficiencyScore = (totalStaff > 0 && yTime > 0) ? (Number(op.tonelagem) / (totalStaff * yTime)) : 0;

            return { x: xTon, y: yTime, raw: op, efficiencyScore, totalStaff };
        }).filter(Boolean);

        if (validPoints.length < 3) return { slope: 0, correlation: 0, insights: [], points: [], productivitySeries, bestDays: [], worstDays: [] };

        // 1. Regressão Linear (Método dos Mínimos Quadrados)
        const n = validPoints.length;
        const sumX = validPoints.reduce((acc, p) => acc + p.x, 0);
        const sumY = validPoints.reduce((acc, p) => acc + p.y, 0);
        const sumXY = validPoints.reduce((acc, p) => acc + (p.x * p.y), 0);
        const sumXX = validPoints.reduce((acc, p) => acc + (p.x * p.x), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 2. Correlation (r)
        const meanX = sumX / n;
        const meanY = sumY / n;
        const numerator = validPoints.reduce((acc, p) => acc + ((p.x - meanX) * (p.y - meanY)), 0);
        const denominator = Math.sqrt(
            validPoints.reduce((acc, p) => acc + Math.pow(p.x - meanX, 2), 0) *
            validPoints.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0)
        );
        const correlation = numerator / (denominator || 1);

        // 3. Gerar Insights em Texto Natural
        const insights = [];
        const delayPer10k = slope * 10;
        const delayMinutes = Math.round(delayPer10k * 60);

        if (correlation > 0.5) insights.push(`Forte correlação: +10k toneladas geram +${delayMinutes}min de tempo na operação.`);
        else if (correlation > 0.3) insights.push(`Tendência leve: Cargas mais pesadas aumentam o tempo em ~${delayMinutes}min a cada 10k ton.`);
        else insights.push("Não há correlação clara entre peso e horário de saída ainda.");

        // 4. CLUSTERING (K-MEANS)
        let dataWithClusters = validPoints.map(p => ({ ...p, cluster: 0 }));
        let clusterInsights = "";

        if (validPoints.length >= 5) {
            const kResult = runKMeans(validPoints, 3);
            if (kResult) {
                const sortedCentroids = kResult.centroids.map((c, idx) => ({ ...c, originalIdx: idx })).sort((a, b) => a.y - b.y);
                const mapClusterType = {};
                sortedCentroids.forEach((c, rank) => {
                    if (rank === 0) mapClusterType[c.originalIdx] = { label: 'Fluido ⚡', color: '#10b981' };
                    if (rank === 1) mapClusterType[c.originalIdx] = { label: 'Normal 😐', color: '#f59e0b' };
                    if (rank === 2) mapClusterType[c.originalIdx] = { label: 'Crítico 🚨', color: '#ef4444' };
                });

                dataWithClusters = validPoints.map((p, idx) => ({ ...p, cluster: kResult.assignments[idx], clusterInfo: mapClusterType[kResult.assignments[idx]] }));
                const criticalCount = dataWithClusters.filter(p => p.clusterInfo.label.includes('Crítico')).length;

                if (criticalCount > 0) {
                    clusterInsights = `Identificados ${criticalCount} dias com padrão "Crítico" (Saída Tardia).`;

                    // [AI UPGRADE] Análise de Causa Raiz
                    const criticalDays = dataWithClusters.filter(p => p.clusterInfo.label.includes('Crítico'));
                    const avgTonCritical = criticalDays.reduce((a, b) => a + b.x, 0) / criticalCount;

                    // Verificar GAPS de Staff (Comparar Effective vs Target)
                    let staffIssueCount = 0;
                    criticalDays.forEach(d => {
                        const raw = d.raw || {};
                        const effective = raw.staff_effective || raw.staff_real || {}; // Fallback
                        const targets = raw.targets_snapshot || {};

                        // Foco na Expedição (Gargalo Comum)
                        const gapExp = (targets.expedicao || 0) - (effective.expedicao || 0);
                        if (gapExp > 0) staffIssueCount++;
                    });

                    if (avgTonCritical > 30) clusterInsights += " Provável causa: Volume excessivo (>30k ton).";
                    else if (staffIssueCount > 0) clusterInsights += ` Causa Provável: Equipe incompleta (Expedição) em ${staffIssueCount} dias.`;
                    else clusterInsights += " Volume normal. Investigar gargalos de processo (filas/quebra).";
                }
            }
        }

        // 5. TOP 5 MELHORES E PIORES DIAS (Baseado em Score de Eficiência)
        // Score = Kg por Homem-Hora
        const sortedByScore = [...validPoints].sort((a, b) => b.efficiencyScore - a.efficiencyScore); // Maior Score primeiro
        const bestDays = sortedByScore.slice(0, 5);
        const worstDays = sortedByScore.slice(-5).reverse(); // Piores Scores (Menor eficiencia)

        return { slope, intercept, correlation, insights, points: dataWithClusters, clusterInsights, productivitySeries, bestDays, worstDays };

    }, [dailyOps, dateRange, selectedShift]); // [FIX] Added filter dependencies

    const scatterData = analysisResult ? analysisResult.points : [];
    const prodSeries = analysisResult ? analysisResult.productivitySeries : [];
    const bestDays = (analysisResult && analysisResult.bestDays) || [];
    const worstDays = (analysisResult && analysisResult.worstDays) || [];

    // FILTRAGEM DE LOGS
    const filteredLogs = logs.filter(l => {
        // Compatibilidade com campo de data do log (pode ser 'data' ou 'timestamp' convertido)
        // O formato salvo no log é DD/MM/YYYY na propriedade 'data' ou 'timestamp' firestore.
        // Vamos assumir que 'data' string YYYY-MM-DD existe ou converter.
        // O código original extrai data do componente Log.js.
        // Vamos simplificar: se log.data estiver em YYYY-MM-DD (padrão input date) funciona.
        // Se estiver DD/MM/YYYY, precisa converter.
        // Assumindo formato ISO para simplificar filtro agora.
        return filterByRangeAndShift(l, 'data', 'shift_nulo');
    });

    const resultados = filteredLogs.filter(l => searchTerm && (
        (l.textoOriginal || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.categoria || "").toLowerCase().includes(searchTerm.toLowerCase())
    ));

    // RECALCULAR KPIS COM FILTRADOS
    const dadosPareto = Object.entries(filteredLogs.reduce((acc, curr) => {
        if ((curr.tipo || "").includes('Erro') || (curr.tipo || "").includes('Falha') || (curr.tipo || "").includes('Risco')) {
            const cat = curr.categoria || "Geral";
            acc[cat] = (acc[cat] || 0) + 1;
        }
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const dadosTendencia = Object.entries(filteredLogs.reduce((acc, curr) => {
        if (curr.data) {
            const dataKey = curr.data.substring(0, 5); // DD/MM
            acc[dataKey] = (acc[dataKey] || 0) + 1;
        }
        return acc;
    }, {})).map(([date, count]) => ({ date, count })).slice(-7);

    const totalMelhorias = filteredLogs.filter(l => (l.tipo || "").includes('Melhoria')).length;
    const campeaoErros = dadosPareto.length > 0 ? dadosPareto[0].name : "Excelente";

    return (
        <div className="dash-container">
            <style>{styles}</style>

            <div className="dash-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 className="dash-title">Central de Inteligência 2.0</h1>
                        <p className="dash-subtitle">Visão estratégica e análise preditiva da operação.</p>
                    </div>

                    {/* BARRA DE FILTROS */}
                    <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>DATA INÍCIO</label>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>DATA FIM</label>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '2px' }}>TURNO</label>
                            <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', background: 'white' }}>
                                <option value="all">Todos</option>
                                <option value="manha">Manhã</option>
                                <option value="tarde">Tarde</option>
                                <option value="noite">Noite</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                            <button onClick={() => { setDateRange({ start: '', end: '' }); setSelectedShift('all'); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#64748b' }} title="Limpar Filtros">
                                <IconFilter />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. SUPER INTELIGENCIA (AGORA NO TOPO) */}
            <div className="chart-card" style={{ marginBottom: '30px', borderLeft: '4px solid #7c3aed' }}>
                <div className="chart-header">
                    <span style={{ color: '#7c3aed' }}>🧠 SUPER INTELIGÊNCIA OPERACIONAL (BETA)</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* COLUNA ESQUERDA: GRÁFICO */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Correlação: Tonelagem vs Horário de Saída</h4>
                            <ChartInfoTip
                                title="Diagrama de Dispersão: Volume vs Capacidade"
                                text={
                                    <span>
                                        Cada ponto é um dia. O encerramento depende do equilíbrio entre <b>Volume</b> (Tonelagem) e <b>Capacidade</b> (Equipe).
                                        <br /><br />
                                        A capacidade vem de 3 pilares:
                                        <br />• <b>Seleção</b>: Ritmo inicial.
                                        <br />• <b>Expedição</b>: Conferência/Montagem.
                                        <br />• <b>Câmara Fria</b>: Sustentação do fluxo.
                                        <br /><br />
                                        <b>Pontos subindo:</b> Volume alto encontrando capacidade limitada/desigual.<br />
                                        <b>Pontos dispersos:</b> Gargalos internos (filas, reprocesso) independente do volume.
                                    </span>
                                }
                            />
                        </div>
                        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="x" name="Tonelagem" unit="k" domain={[10, 'dataMax + 2']} label={{ value: 'Tonelagem (k)', position: 'insideBottomRight', offset: -10 }} />
                                    <YAxis type="number" dataKey="y" name="Horário" unit="h" domain={[6, 20]} label={{ value: 'Hr Saída', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const formattedDate = data.raw?.date ? new Date(data.raw.date).toLocaleDateString() : 'N/A';
                                            const horaSaida = data.raw?.hora_saida || 'N/A';
                                            const peso = data.raw?.tonelagem ? Number(data.raw.tonelagem).toLocaleString() : '0';
                                            const staff = data.raw?.staff_effective || data.raw?.staff_real || {};

                                            return (
                                                <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>{formattedDate}</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x' }}>
                                                        <p style={{ margin: 0, fontSize: '12px' }}>⏱️ Saída: <b>{horaSaida}</b></p>
                                                        <p style={{ margin: 0, fontSize: '12px' }}>⚖️ Peso: <b>{peso} kg</b></p>
                                                    </div>

                                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Equipe (Trabalhando / Real)</p>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px' }}>
                                                            <span>📦 Exped: {staff.expedicao || '-'}</span>
                                                            <span>❄️ Cam: {staff.camara_fria || '-'}</span>
                                                            <span>🔍 Sel: {staff.selecao || '-'}</span>
                                                        </div>
                                                    </div>

                                                    {data.raw?.chegada_tardia && <p style={{ margin: '8px 0 0 0', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>⚠️ Chegada Tardia</p>}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Scatter name="Operação" data={scatterData} fill="#8884d8">
                                        {scatterData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.clusterInfo ? entry.clusterInfo.color : (entry.chegadaTardia ? '#ef4444' : '#10b981')}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: INSIGHTS + RANKING */}
                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* CARD IA */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Insights IA (Machine Learning)</h4>
                                <ChartInfoTip title="Inteligência Preditiva" text="A IA analisa os padrões históricos (peso, equipe, horários) para aprender o que causa atrasos. Se ela diz 'Crítico', ela encontrou um padrão (ex: peso alto + saída tarde) que se repete e alerta para você agir antes que vire rotina." />
                            </div>
                            {!analysisResult ? (
                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Coletando dados do Espelho Operacional... (Mínimo 3 registros necessários)</p>
                            ) : (
                                <ul style={{ fontSize: '13px', color: '#334155', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {analysisResult.insights.map((insight, idx) => (
                                        <li key={idx}><b>{insight}</b></li>
                                    ))}
                                    {analysisResult.clusterInsights && (
                                        <li style={{ color: '#7c3aed', fontWeight: 'bold' }}>🤖 {analysisResult.clusterInsights}</li>
                                    )}
                                    <li style={{ marginTop: '10px', fontStyle: 'italic', color: '#64748b' }}>
                                        Força da Correlação (R²): {analysisResult.correlation ? (analysisResult.correlation ** 2).toFixed(2) : '0.00'}
                                    </li>
                                </ul>
                            )}
                        </div>

                        {/* RANKING CARDS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            {/* MELHORES DIAS */}
                            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        🏆 Alta Eficiência
                                    </h4>
                                    <ChartInfoTip title="Índice de Eficiência (IE)" text="Cálculo: Tonelagem / (Equipe x Hora Saída). Recompensa alto volume com time enxuto e saída cedo." />
                                </div>
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    {bestDays.map((d, i) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                                            <span>{new Date(d.raw.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 'bold' }}>{d.raw.hora_saida}</span>
                                                <span style={{ display: 'block', fontSize: '9px', color: '#166534' }}>IE: {d.efficiencyScore.toFixed(1)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* PIORES DIAS */}
                            <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        🚨 Baixa Eficiência
                                    </h4>
                                    <ChartInfoTip title="Baixo Índice" text="Dias onde o volume entregue foi baixo proporcionalmente ao tamanho da equipe e horas trabalhadas." />
                                </div>
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    {worstDays.map((d, i) => (
                                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #fee2e2' }}>
                                            <span>{new Date(d.raw.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 'bold' }}>{d.raw.hora_saida}</span>
                                                <span style={{ display: 'block', fontSize: '9px', color: '#991b1b' }}>IE: {d.efficiencyScore.toFixed(1)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* 2. KPI GRID (ABAIXO DA IA) */}
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
            </div >

            {/* 3. GRID 2 COLUNAS: PADRÕES + SEARCH */}
            < div className="grid-2" >
                {/* A. DETECTOR DE PADRÕES */}
                < div className="patterns-section" >
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
                </div >

                {/* B. BUSCA (AGORA AQUI) */}
                < div className="search-section" >
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
                </div >
            </div >

            {/* 4. GRID 2 COLUNAS: NOVOS GRÁFICOS (OPERACIONAIS) */}
            < div className="grid-2" >

                {/* ESQUERDA: PARETO */}
                < div className="chart-card" >
                    <div className="chart-header">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>TOP 5 OFENSORES (PARETO)</span>
                            <ChartInfoTip title="Gráfico de Pareto (80/20)" text="Este gráfico mostra quais problemas causam a maior dor de cabeça. Geralmente, 20% das causas geram 80% dos problemas. Ataque o que está no topo e você resolverá a maior parte do caos dia." />
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
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
                </div >

                {/* DIREITA: PRODUTIVIDADE (KG/PESSOA) */}
                < div className="chart-card" >
                    <div className="chart-header">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>PRODUTIVIDADE REAL (KG/COLABORADOR)</span>
                            <ChartInfoTip title="Eficiência da Equipe" text="Imagina que a equipe é um motor. Este gráfico mostra 'quantos quilos cada pessoa carregou' em média. Se a barra sobe, a equipe foi mais eficiente. Se desce muito, ou tivemos pouca carga, ou gente demais para pouco serviço." />
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={prodSeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" style={{ fontSize: 11 }} />
                                <YAxis style={{ fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{label}</p>
                                                    <p style={{ margin: '5px 0 0 0', color: '#10b981', fontWeight: 600 }}>⚡ {data.prod} kg/pessoa</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Total: {data.ton}kg / {data.staff} pessoas</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="prod" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    {prodSeries.map((entry, index) => (
                                        <Cell key={`cell-prod-${index}`} fill={entry.prod > 4000 ? '#10b981' : entry.prod > 2500 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div >
            </div >

            {/* MODAL PADRÃO */}
            {
                modalPadrao && (
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
                )
            }
        </div >
    );
}