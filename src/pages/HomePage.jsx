import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Adicionamos auth aqui
import { onAuthStateChanged } from 'firebase/auth'; // Adicionamos o listener de auth
import { gerarPdcaComIA } from '../services/aiService'; // Importamos o serviço de IA

// --- FUNÇÕES UTILITÁRIAS (Do seu código original) ---

// Descobre em que etapa o PDCA está a partir do status
function getStageFromStatus(status) {
  switch (status) {
    case "Planejando": return "Plan";
    case "Executando": return "Do";
    case "Checando": return "Check";
    case "Padronizado": return "Act";
    default: return "Plan";
  }
}

// Converte string de data (ISO) para Date
function firestoreStringDateToDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function HomePage() {
  // --- ESTADOS DO SEU DASHBOARD ---
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NOVOS ESTADOS PARA A IA ---
  const [relatoProblema, setRelatoProblema] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [userName, setUserName] = useState(''); // Precisamos saber quem é o usuário para salvar o PDCA

  const navigate = useNavigate();

  // --- EFEITO (CARREGAMENTO E AUTH) ---
  useEffect(() => {
    // Listener de Autenticação (para pegar o nome do usuário e garantir login)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.email.split('@')[0]);
        loadPdcas(); // Carrega os dados apenas se estiver logado
      } else {
        // Opcional: Redirecionar se não estiver logado, ou deixar o AuthContext lidar
        // navigate('/login'); 
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadPdcas() {
    setLoading(true);
    try {
      const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
      const snap = await getDocs(q);
      const docs = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const situacao = data.situacao || "ativo";
        docs.push({
          id: docSnap.id,
          codigo: data.codigo || docSnap.id,
          titulo: data.titulo || "",
          status: data.status || "Planejando",
          situacao,
          criadoEm: data.criadoEm || null,
          concluidoEm: data.concluidoEm || null,
          canceladoEm: data.canceladoEm || null,
          plan: data.plan || {},
        });
      });

      setPdcas(docs);
    } catch (e) {
      console.error("Erro ao carregar PDCAs na Home:", e);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DA IA (NOVA) ---
  const handleAnaliseIA = async () => {
    if (!relatoProblema.trim()) {
      alert("Por favor, descreva o problema antes de usar a IA.");
      return;
    }

    setAnalisando(true);

    try {
      // 1. Chamar nosso serviço de IA
      const dadosSugeridos = await gerarPdcaComIA(relatoProblema);

      // 2. Preparar o objeto NO PADRÃO DO SEU SISTEMA
      const novoPdca = {
        titulo: dadosSugeridos.titulo_sugerido,
        // Gera um código aleatório simples se não tiver lógica de contador
        codigo: `PDCA-${Math.floor(Math.random() * 10000)}`, 
        area: "A Definir",
        responsavel: userName,
        criadoEm: new Date().toISOString(), // Usando seu padrão 'criadoEm'
        status: "Planejando",
        situacao: "ativo",
        
        // Dados do PLAN preenchidos pela IA
        descricaoProblema: relatoProblema,
        categoria: dadosSugeridos.categoria,
        prioridade: dadosSugeridos.prioridade,
        causas: dadosSugeridos.causas,
        meta: dadosSugeridos.meta,
        planoAcao: dadosSugeridos.planoAcao,

        // Campos vazios das outras etapas
        execucao: "",
        resultados: "",
        licoesAprendidas: ""
      };

      // 3. Salvar no Firestore
      const docRef = await addDoc(collection(db, "pdcas"), novoPdca);

      // 4. Redirecionar para a página de detalhes
      navigate(`/pdca/${docRef.id}`);

    } catch (error) {
      console.error("Erro no fluxo da IA:", error);
      alert("Erro ao criar com IA. Verifique o console.");
    } finally {
      setAnalisando(false);
    }
  };

  // --- PREPARAÇÃO DAS LISTAS (SEU CÓDIGO ORIGINAL) ---
  const ativos = pdcas.filter((p) => (p.situacao || "ativo") === "ativo");
  const concluidos = pdcas.filter((p) => (p.situacao || "ativo") === "concluido");
  const cancelados = pdcas.filter((p) => (p.situacao || "ativo") === "cancelado");

  // Filtros por etapa (Plan, Do, Check, Act)
  const planList = ativos.filter((p) => getStageFromStatus(p.status) === "Plan").slice(0, 5);
  const doList = ativos.filter((p) => getStageFromStatus(p.status) === "Do").slice(0, 5);
  const checkList = ativos.filter((p) => getStageFromStatus(p.status) === "Check").slice(0, 5);
  const actList = ativos.filter((p) => getStageFromStatus(p.status) === "Act").slice(0, 5);

  const concluidosList = concluidos.slice(0, 5);
  const canceladosList = cancelados.slice(0, 5);

  // Métricas
  const total = pdcas.length;
  const totalPlan = ativos.filter((p) => getStageFromStatus(p.status) === "Plan").length;
  const totalDo = ativos.filter((p) => getStageFromStatus(p.status) === "Do").length;
  const totalCheck = ativos.filter((p) => getStageFromStatus(p.status) === "Check").length;
  const totalAct = ativos.filter((p) => getStageFromStatus(p.status) === "Act").length;
  const totalAtivos = ativos.length;
  const totalConcluidos = concluidos.length;
  const totalCancelados = cancelados.length;

  function renderList(list) {
    if (loading) return <p className="home-card-list-empty">Carregando...</p>;
    if (list.length === 0) return <p className="home-card-list-empty">Nenhum PDCA nessa etapa ainda.</p>;

    return (
      <ul className="home-card-list">
        {list.map((p) => {
          const dt = firestoreStringDateToDate(p.concluidoEm || p.canceladoEm || p.criadoEm);
          const label = dt ? dt.toLocaleString("pt-BR") : "Sem data";
          return (
            <li key={p.id}>
              <Link to={`/pdca/${p.id}`}>
                <strong>{p.codigo}</strong>
                <span>{p.titulo}</span>
                <small>{label}</small>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  // --- RENDERIZAÇÃO DA PÁGINA ---
  return (
    <div className="page">
      <h1 className="page-title">PDCA NL – Mapa do Ciclo</h1>
      <p className="page-subtitle">
        Quatro fases, um fluxo só: enxergue desde o problema até o padrão consolidado.
      </p>

      {/* --- INÍCIO DA INTEGRAÇÃO DA IA (NOVO BLOCO) --- */}
      <div style={styles.iaContainer}>
        <div style={styles.iaHeader}>
          <h2 style={{margin: 0, fontSize: '1.2rem', color: '#4a0072'}}>✨ Copiloto IA (Novo)</h2>
          <span style={{fontSize: '0.9rem', color: '#666'}}>Relate um problema e deixe a IA montar o Plano.</span>
        </div>
        
        <textarea
          style={styles.textarea}
          placeholder="Ex: 'Atraso na liberação de carga de domingo por falta de alinhamento com a portaria...'"
          value={relatoProblema}
          onChange={(e) => setRelatoProblema(e.target.value)}
          disabled={analisando}
        />
        
        <div style={{textAlign: 'right'}}>
          <button 
            className="btn-primary" 
            onClick={handleAnaliseIA}
            disabled={analisando}
            style={analisando ? {...styles.btnIa, opacity: 0.7} : styles.btnIa}
          >
            {analisando ? "🤖 Analisando..." : "Gerar PDCA com IA"}
          </button>
        </div>
      </div>
      {/* --- FIM DA INTEGRAÇÃO DA IA --- */}

      <div className="home-layout">
        {/* LINHA 0 – CARD DE DASHBOARD GERAL */}
        <div className="home-row">
          <div className="home-card home-card-dashboard">
            <header>
              <h2>Dashboard geral</h2>
              <p>Visão rápida da operação: PDCAs ativos e histórico.</p>
            </header>

            <div className="home-dashboard-metrics">
              <div><span className="metric-label">Total</span><span className="metric-value">{total}</span></div>
              <div><span className="metric-label">Ativos</span><span className="metric-value">{totalAtivos}</span></div>
              <div><span className="metric-label">Concluídos</span><span className="metric-value">{totalConcluidos}</span></div>
              <div><span className="metric-label">Cancelados</span><span className="metric-value">{totalCancelados}</span></div>
              <div><span className="metric-label">Plan</span><span className="metric-value">{totalPlan}</span></div>
              <div><span className="metric-label">Do</span><span className="metric-value">{totalDo}</span></div>
              <div><span className="metric-label">Check</span><span className="metric-value">{totalCheck}</span></div>
              <div><span className="metric-label">Act</span><span className="metric-value">{totalAct}</span></div>
            </div>
          </div>
        </div>

        {/* LINHA 1 – PLAN | DO */}
        <div className="home-row home-row-2">
          <div className="home-card">
            <header>
              <h2>Plan</h2>
              <p>Entender o <strong>porquê</strong>, definir meta e prazo.</p>
            </header>
            {renderList(planList)}
            <footer>
              <Link to="/criar" className="btn-primary">Criar novo PDCA (Manual)</Link>
            </footer>
          </div>

          <div className="home-card">
            <header>
              <h2>Do</h2>
              <p>Execução: <strong>o que foi feito</strong>.</p>
            </header>
            {renderList(doList)}
          </div>
        </div>

        {/* LINHA 2 – CHECK | ACT */}
        <div className="home-row home-row-2">
          <div className="home-card">
            <header>
              <h2>Check</h2>
              <p>Medir o resultado e aprender.</p>
            </header>
            {renderList(checkList)}
          </div>

          <div className="home-card">
            <header>
              <h2>Act</h2>
              <p>Padronização e novos ciclos.</p>
            </header>
            {renderList(actList)}
          </div>
        </div>

        {/* LINHA 3 – CONCLUÍDOS | CANCELADOS */}
        <div className="home-row home-row-2">
          <div className="home-card">
            <header><h2>Concluídos</h2></header>
            {renderList(concluidosList)}
          </div>

          <div className="home-card">
            <header><h2>Cancelados</h2></header>
            {renderList(canceladosList)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Estilos específicos para o bloco da IA (para não quebrar seu CSS original)
const styles = {
  iaContainer: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    background: 'linear-gradient(to right, #ffffff, #f9f7ff)' // Um toque sutil de roxo
  },
  iaHeader: {
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: '10px',
    resize: 'vertical'
  },
  btnIa: {
    backgroundColor: '#6b46c1', // Roxo
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background 0.2s'
  }
};

export default HomePage;