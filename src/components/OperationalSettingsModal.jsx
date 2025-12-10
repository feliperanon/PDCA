import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const SECTORS = [
    { key: 'recebimento', label: 'Recebimento (RM)' },
    { key: 'expedicao', label: 'Expedição' },
    { key: 'camara_fria', label: 'Câmara Fria' },
    { key: 'selecao', label: 'Seleção' },
    { key: 'blocado', label: 'Blocado' },
    { key: 'embandejamento', label: 'Embandejamento' },
    { key: 'contagem', label: 'Contagem de Estoque' }
];

const SHIFTS = [
    { key: 'manha', label: 'Manhã' },
    { key: 'tarde', label: 'Tarde' },
    { key: 'noite', label: 'Noite' }
];

export function OperationalSettingsModal({ onClose, onSave }) {
    const [loading, setLoading] = useState(true);
    const [currentShift, setCurrentShift] = useState('manha');
    // Armazena estrutura completa: { manha: {}, tarde: {}, noite: {} }
    const [allTargets, setAllTargets] = useState({
        manha: {}, tarde: {}, noite: {}
    });

    const defaultTargets = {
        recebimento: 0, expedicao: 0, camara_fria: 0, selecao: 0, blocado: 0, embandejamento: 0, contagem: 0,
        meta_saida: '00:00', meta_chegada: '00:00'
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "operational_targets");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Se já estiver no formato novo (com chaves de turno), usa. Senão, migra o flat para 'manha'.
                    if (data.manha || data.tarde || data.noite) {
                        setAllTargets({
                            manha: { ...defaultTargets, ...data.manha },
                            tarde: { ...defaultTargets, ...data.tarde },
                            noite: { ...defaultTargets, ...data.noite }
                        });
                    } else {
                        // Migração de legado (flat) para manhã
                        setAllTargets({
                            manha: { ...defaultTargets, ...data },
                            tarde: { ...defaultTargets },
                            noite: { ...defaultTargets }
                        });
                    }
                } else {
                    setAllTargets({
                        manha: { ...defaultTargets },
                        tarde: { ...defaultTargets },
                        noite: { ...defaultTargets }
                    });
                }
            } catch (error) {
                console.error("Erro ao carregar settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            await setDoc(doc(db, "settings", "operational_targets"), allTargets);
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar settings:", error);
            alert("Erro ao salvar configurações.");
        }
    };

    const handleChange = (field, value) => {
        setAllTargets(prev => ({
            ...prev,
            [currentShift]: {
                ...prev[currentShift],
                [field]: value
            }
        }));
    };

    const targets = allTargets[currentShift] || defaultTargets;

    if (loading) return <div className="p-4 text-center">Carregando configurações...</div>;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', width: '90%', maxWidth: '500px',
                borderRadius: '16px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>⚙️ Configurar Metas</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>

                {/* SHIFT TABS */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', padding: '4px', background: '#f1f5f9', borderRadius: '8px' }}>
                    {SHIFTS.map(shift => (
                        <button
                            key={shift.key}
                            onClick={() => setCurrentShift(shift.key)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                                background: currentShift === shift.key ? 'white' : 'transparent',
                                color: currentShift === shift.key ? '#2563eb' : '#64748b',
                                fontWeight: 700, cursor: 'pointer', boxShadow: currentShift === shift.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {shift.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>

                    {/* SEÇÃO STAFF */}
                    <div>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                            HC Ideal (Pessoas) - {SHIFTS.find(s => s.key === currentShift).label}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            {SECTORS.map(sec => (
                                <div key={sec.key}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                        {sec.label}
                                    </label>
                                    <input
                                        type="number"
                                        value={targets[sec.key]}
                                        onChange={(e) => handleChange(sec.key, parseInt(e.target.value) || 0)}
                                        style={{
                                            width: '100%', padding: '8px', borderRadius: '6px',
                                            border: '1px solid #cbd5e1', fontSize: '14px'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEÇÃO HORÁRIOS */}
                    <div>
                        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                            Horários Alvo - {SHIFTS.find(s => s.key === currentShift).label}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Chegada Mercadoria
                                </label>
                                <input
                                    type="time"
                                    value={targets.meta_chegada}
                                    onChange={(e) => handleChange('meta_chegada', e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Saída Caminhões
                                </label>
                                <input
                                    type="time"
                                    value={targets.meta_saida}
                                    onChange={(e) => handleChange('meta_saida', e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 2, padding: '10px', borderRadius: '8px', border: 'none',
                                background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Salvar Tudo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
