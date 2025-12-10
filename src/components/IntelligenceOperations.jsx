import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Target, Activity
} from 'lucide-react';

export function IntelligenceOperations({ logs, mirrorData }) {
    // --- 1. PROCESSAMENTO DE DADOS ---
    const { healthScore, trendData, insights } = useMemo(() => {
        const hoje = new Date().toISOString().split('T')[0];
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);

        // Filtra logs dos últimos 7 dias
        const logsRecentes = logs.filter(l => {
            if (!l.data) return false;
            const partes = l.data.split('/');
            if (partes.length !== 3) return false;
            const dataLog = `${partes[2]}-${partes[1]}-${partes[0]}`;
            return dataLog >= seteDiasAtras.toISOString().split('T')[0];
        });

        // Agrupa por dia para o gráfico
        const dadosGrafico = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dataStr = d.toLocaleDateString('pt-BR'); // dd/mm/aaaa
            const errosDia = logsRecentes.filter(l => l.data === dataStr && (l.tipo || "").includes('Erro')).length;
            const totalDia = logsRecentes.filter(l => l.data === dataStr).length;
            dadosGrafico.push({ name: dataStr.slice(0, 5), erros: errosDia, total: totalDia });
        }

        // Score de Saúde (Prioridade: Dados do Espelho > Logs)
        let score = 100;
        let mirrorInsights = [];

        // Definições globais
        const logsHoje = logs.filter(l => l.data === new Date().toLocaleDateString('pt-BR'));
        const errosHoje = logsHoje.filter(l => (l.tipo || "").includes('Erro')).length;

        if (mirrorData) {
            // Se tiver avaliação do líder, usa (cada estrela = 20 pts)
            if (mirrorData.rating > 0) {
                score = mirrorData.rating * 20;
            } else {
                // Se não tiver rating, calcula baseado em gaps de staff
                const staff = mirrorData.staff_real || {};
                let gaps = 0;
                // Exemplo simplificado: Conta quantos setores tem gap
                // (Para lógica real precisaria comparar com targets)
                score = 100; // Placeholder até ter lógica de targets aqui
            }
        } else {
            // Fallback para logs
            score = Math.max(0, 100 - (errosHoje * 15));
        }

        // Insights Básicos
        const insightsList = [];
        if (!mirrorData) {
            if (errosHoje === 0 && logsHoje.length > 0) insightsList.push({ type: 'good', text: "Operação impecável hoje! Nenhum erro registrado." });
            if (errosHoje > 2) insightsList.push({ type: 'bad', text: "Atenção: Alto índice de falhas hoje. Considere uma reunião relâmpago." });
        } else {
            if (score === 100) insightsList.push({ type: 'good', text: "Líder avaliou o turno como perfeito!" });
            if (score <= 60) insightsList.push({ type: 'bad', text: "Turno com problemas. Verifique os relatos." });
        }

        // Categoria mais frequente (Check de Gargalo)
        const catCount = {};
        logsRecentes.forEach(l => { catCount[l.categoria] = (catCount[l.categoria] || 0) + 1; });
        const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
        if (topCat) insightsList.push({ type: 'neutral', text: `Foco recente em: ${topCat[0]} (${topCat[1]} registros).` });

        return {
            healthScore: score,
            trendData: dadosGrafico,
            insights: insightsList,
            topCategory: topCat ? topCat[0] : 'N/A',
            streak: errosHoje === 0 ? 'Protegido' : 'Em Risco'
        };
    }, [logs]);

    // --- STYLES (Inline para isolamento) ---
    const containerStyle = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        marginBottom: '25px',
        position: 'relative',
        overflow: 'hidden'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    };

    const gradeStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
    };

    const scoreColor = healthScore > 80 ? '#22c55e' : healthScore > 50 ? '#eab308' : '#ef4444';

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                        <Brain size={24} color="#2563eb" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Intelligence Ops</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Análise em tempo real da operação</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block' }}>TEMPO REAL</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e', fontSize: '12px' }}>
                        <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                        Monitorando
                    </div>
                </div>
            </div>

            <div style={gradeStyle}>
                {/* KPI 1: SAÚDE OPERACIONAL */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>SAÚDE OPERACIONAL</span>
                        <Activity size={16} color={scoreColor} />
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: scoreColor, marginBottom: '5px' }}>
                        {healthScore}%
                    </div>
                    <div style={{ height: '6px', width: '100%', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${healthScore}%`, background: scoreColor, transition: 'width 0.5s ease' }}></div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                        {mirrorData ? (
                            mirrorData.rating ? `Baseado na avaliação do líder (${mirrorData.rating} estrelas).` : "Monitorando dados do turno ao vivo..."
                        ) : (
                            healthScore === 100 ? 'Performance perfeita hoje.' : 'Impactada por falhas recentes.'
                        )}
                    </p>
                </div>

                {/* KPI 2: TENDÊNCIA DE FALHAS */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>TENDÊNCIA (7 DIAS)</span>
                        <TrendingUp size={16} color="#64748b" />
                    </div>
                    <div style={{ height: '80px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorErros" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#64748b', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="erros" stroke="#ef4444" fillOpacity={1} fill="url(#colorErros)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI 3: INSIGHTS & AI */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>INSIGHTS DA IA</span>
                        <Zap size={16} color="#f59e0b" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {insights.length > 0 ? insights.map((insight, idx) => (
                            <div key={idx} style={{
                                padding: '8px',
                                background: insight.type === 'good' ? '#f0fdf4' : insight.type === 'bad' ? '#fef2f2' : '#f8fafc',
                                borderRadius: '6px',
                                borderLeft: `3px solid ${insight.type === 'good' ? '#22c55e' : insight.type === 'bad' ? '#ef4444' : '#cbd5e1'}`,
                                fontSize: '12px',
                                color: '#334155'
                            }}>
                                {insight.text}
                            </div>
                        )) : (
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Aguardando mais dados...</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse-dot {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .pulse-dot { animation: pulse-dot 2s infinite; }
      `}</style>
        </div>
    );
}
