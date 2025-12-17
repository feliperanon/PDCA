import React, { useState, useEffect } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
    BarChart, Bar, Legend
} from 'recharts';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

// --- CONFIG ---
const SECTORS_CONFIG = [
    { key: 'recebimento', label: 'Recebimento', meta: 3 },
    { key: 'expedicao', label: 'Expedição', meta: 18 },
    { key: 'camara_fria', label: 'Câmara Fria', meta: 3 },
    { key: 'selecao', label: 'Seleção', meta: 12 },
    { key: 'blocado', label: 'Blocado', meta: 2 },
    { key: 'embandejamento', label: 'Embandejamento', meta: 0 },
    { key: 'contagem', label: 'Estoque/Cont.', meta: 0 }
];

// --- MOTOR MATEMÁTICO ---
const META_HORA = 9.0;
const FRONTEIRA_CAPACIDADE_TC = 1.35; // Ton/Colaborador estimado como limite para 09:00

const calcularMetricas = (t, c, h, totalMeta) => {
    const produtividade = c > 0 ? t / c : 0; // Carga por Colaborador
    const deficit = totalMeta > 0 ? ((totalMeta - c) / totalMeta) * 100 : 0;

    // Classificação de Risco
    let status = '';
    let cor = '';
    let descricao = '';

    if (h <= META_HORA + 0.1) { // Tolerância 6 min
        if (produtividade > FRONTEIRA_CAPACIDADE_TC) {
            status = 'ALTA PERFORMANCE';
            cor = '#16a34a'; // Green
            descricao = 'Sistema absorveu alta pressão e entregou na meta. Mérito Operacional.';
        } else {
            status = 'CONFORTÁVEL';
            cor = '#22c55e'; // Light Green
            descricao = 'Carga compatível com a equipe. Resultado esperado.';
        }
    } else {
        // Atrasou
        if (produtividade > FRONTEIRA_CAPACIDADE_TC) {
            status = 'ESTRUTURALMENTE INVIÁVEL';
            cor = '#dc2626'; // Red
            descricao = `Carga T/C (${produtividade.toFixed(2)}) excedeu fronteira física. Atraso era matematicamente previsto.`;
        } else if (produtividade < 0.8) {
            if (deficit > 20) {
                status = 'COLAPSO DE PRESENÇA';
                cor = '#ef4444';
                descricao = `Absenteísmo crítico (${deficit.toFixed(0)}%) impediu fluxo, mesmo com carga baixa.`
            } else {
                status = 'INEFICIÊNCIA / RUÍDO';
                cor = '#f97316'; // Orange
                descricao = 'Recursos sobraram, mas meta não foi batida. Falha grave de processo ou gestão.';
            }
        } else {
            status = 'RISCO MODERADO';
            cor = '#eab308'; // Yellow
            descricao = 'Operação no limite. Pequenos ruídos causaram o atraso.';
        }
    }

    return { produtividade, deficit, status, cor, descricao };
};

const formatHour = (decimal) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export function AnalyticsDashboard() {
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGlobalData = async () => {
            try {
                // 1. Fetch Real Data from Firestore
                const q = query(collection(db, "pdcas"), orderBy("opDate", "desc"), limit(50));
                const querySnapshot = await getDocs(q);

                const realData = [];
                const totalIdealMeta = SECTORS_CONFIG.reduce((acc, s) => acc + s.meta, 0);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const dDaily = data.originalData?.snapshot?.dailyData || {};

                    // Extract T
                    const rawTon = data.tonelagem;
                    // Ensure ton is number. If string "1.000", remove points. Ideally data is saved as Number or consistent string.
                    // Assuming rawTon matches what OperationsDatabasePage uses.
                    const t = Number(rawTon) || 0;

                    // Extract C (Staff Real from sectors or total sum)
                    const staffMap = dDaily.staff_real || dDaily.staff_effective || {};
                    const c = Object.values(staffMap).reduce((acc, v) => acc + (Number(v) || 0), 0);

                    // Extract H (Exit Time)
                    let hDecimal = 0;
                    if (dDaily.hora_saida) {
                        const [hh, mm] = dDaily.hora_saida.split(':').map(Number);
                        hDecimal = hh + (mm / 60);
                    }

                    if (t > 0 && c > 0 && hDecimal > 0) {
                        realData.push({
                            id: doc.id,
                            t, c, h: hDecimal,
                            day: new Date(data.opDate).toLocaleDateString('pt-BR', { weekday: 'long' }),
                            date: data.opDate,
                            source: 'REAL',
                            ...calcularMetricas(t, c, hDecimal, totalIdealMeta)
                        });
                    }
                });

                // Merge: ONLY Real data
                // Sort by Productivity to see the "Curve"
                const combined = [...realData].sort((a, b) => a.h - b.h);

                setDataset(combined);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGlobalData();
    }, []);

    // --- CHART DATA PREP ---
    const scatterData = dataset.map(d => ({
        x: Number(d.produtividade.toFixed(2)),
        y: Number(d.h.toFixed(2)),
        z: 100, // Bubble size
        data: d
    }));

    if (loading) return <div className="p-10 text-center text-slate-500">Carregando Modelo Matemático...</div>;

    if (dataset.length === 0) return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <h2>Aguardando Dados Reais</h2>
            <p>Complete e encerre turnos no <a href="#/diario">Diário Operacional</a> para alimentar a inteligência.</p>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '40px', background: 'var(--color-body-bg)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

            <header className="animate-slide-up" style={{ marginBottom: '40px', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-1px', marginBottom: '8px' }}>
                    Central de Inteligência
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-md)', maxWidth: '600px', lineHeight: '1.5' }}>
                    Análise preditiva de risco e capacidade operacional. O objetivo é manter o sistema abaixo da temperatura crítica de <strong style={{ color: 'var(--color-text)' }}>09:00</strong>.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px' }}>

                {/* ESQUERDA: FRONTEIRA */}
                <div className="animate-scale-in delay-100" style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-medium)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                            Fronteira de Capacidade
                        </h3>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-body-bg)', padding: '4px 10px', borderRadius: '20px' }}>
                            MODELO MATEMÁTICO V1.0
                        </span>
                    </div>

                    <div style={{ width: '100%', height: 420 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" opacity={0.5} />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="Carga/Colab"
                                    unit=" T/p"
                                    domain={[0, 'auto']}
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'var(--color-border-strong)' }}
                                    label={{ value: 'Pressão (Ton/Pessoa)', position: 'bottom', offset: 0, fill: 'var(--color-text-muted)', fontSize: 12 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Horário"
                                    domain={[6, 16]}
                                    tickFormatter={formatHour}
                                    tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'var(--color-border-strong)' }}
                                    label={{ value: 'Horário Saída', angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload.data;
                                            const prod = typeof d.produtividade === 'number' ? d.produtividade.toFixed(2) : '0.00';
                                            const deficit = typeof d.deficit === 'number' ? d.deficit.toFixed(0) : '0';

                                            return (
                                                <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', fontSize: '13px', backdropFilter: 'blur(4px)' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{d.date} • {d.day}</div>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px', marginBottom: '8px' }}>{prod} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>Ton/Pessoa</span></div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                                        <div>
                                                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>Carga</div>
                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{d.t}t <span style={{ color: '#cbd5e1' }}>/</span> {d.c}p</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>Saída</div>
                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{formatHour(d.h)}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ color: d.cor, fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>{d.status}</span>
                                                        {Number(deficit) > 0 && <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px' }}>-{deficit}% Equipe</span>}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={9} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ value: "META 09:00", fill: "#ef4444", fontSize: 11, fontWeight: 700, position: 'insideTopRight' }} />
                                <ReferenceLine x={FRONTEIRA_CAPACIDADE_TC} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "LIMITE ESTRUTURAL", fill: "#f59e0b", fontSize: 11, fontWeight: 700, position: 'insideBottomRight', angle: -90 }} />
                                <Scatter name="Operações" data={scatterData} fill="#8884d8">
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.data.cor} stroke="white" strokeWidth={2} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DIREITA: INSIGHTS */}
                <div className="animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* KPI CARD */}
                    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '30px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-medium)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <h4 style={{ fontSize: '12px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                Confiabilidade (Meta 09:00)
                            </h4>
                            <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1 }}>
                                {dataset.length > 0 ? ((dataset.filter(d => d.h <= 9.1).length / dataset.length) * 100).toFixed(0) : 0}%
                            </div>
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>Média de Pressão</div>
                                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                    {dataset.length > 0 ? (dataset.reduce((a, b) => a + b.produtividade, 0) / dataset.length).toFixed(2) : 0} <span style={{ opacity: 0.5 }}>Ton/Colab</span>
                                </div>
                            </div>
                        </div>
                        {/* Abstract Decor */}
                        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                    </div>

                    {/* LISTA DE OBSERVAÇÕES */}
                    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-soft)', flex: 1, border: '1px solid var(--color-border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-subtle)', fontWeight: '700', fontSize: '14px', color: 'var(--color-text)' }}>
                            Diagnóstico Recente
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
                            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '10px', color: '#64748b' }}>Data</th>
                                        <th style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>T/C</th>
                                        <th style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>Saída</th>
                                        <th style={{ textAlign: 'left', padding: '10px', color: '#64748b' }}>Diagnóstico</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...dataset].sort((a, b) => new Date(b.date) - new Date(a.date)).map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', color: '#334155' }}>
                                                {row.date === 'Simulação' ? `Simulação (${row.day})` : new Date(row.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{row.produtividade.toFixed(2)}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', color: row.h > 9.1 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                                                {formatHour(row.h)}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: row.cor,
                                                    color: 'white',
                                                    fontSize: '9px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
