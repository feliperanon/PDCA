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