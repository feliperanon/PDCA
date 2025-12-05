// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { gerarPdcaComIA } from '../services/aiService'; 

// --- FUNÇÕES UTILITÁRIAS ---
function getStageFromStatus(status) {
  switch (status) {
    case "Planejando": return "Plan";
    case "Executando": return "Do";
    case "Checando": return "Check";
    case "Padronizado": return "Act";
    default: return "Plan";
  }
}

function firestoreStringDateToDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function HomePage() {
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);

  // IA States
  const [relatoProblema, setRelatoProblema] = useState('');
  const [analisando, setAnalisando] = useState(false);
  const [userName, setUserName] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.email.split('@')[0]);
        loadPdcas(); 
      } else {
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
      console.error("Erro ao carregar:", e);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DA IA (ATUALIZADA) ---
  const handleAnaliseIA = async () => {
    if (!relatoProblema.trim()) {
      alert("Por favor, descreva o problema.");
      return;
    }

    setAnalisando(true);

    try {
      // 1. A IA agora retorna mais campos (tipo_objeto, area, turno, etc.)
      const dadosSugeridos = await gerarPdcaComIA(relatoProblema);

      // 2. Mapear para o formato do Firebase
      const novoPdca = {
        titulo: dadosSugeridos.titulo_sugerido,
        codigo: `PDCA-${Math.floor(Math.random() * 10000)}`, 
        
        // Campos Raiz (importantes para filtros rápidos)
        area: dadosSugeridos.area_sugerida || "A Definir",
        responsavel: userName,
        
        criadoEm: new Date().toISOString(),
        status: "Planejando",
        situacao: "ativo",
        
        // DADOS DO PLAN (Aqui que estava o problema, agora preenchemos tudo)
        plan: {
          descricaoProblema: relatoProblema, // Texto original do usuário
          categoria: dadosSugeridos.categoria,
          prioridade: dadosSugeridos.prioridade,
          
          area: dadosSugeridos.area_sugerida,
          turno: dadosSugeridos.turno_sugerido || "",
          
          // Novos campos mapeados corretamente
          tipoObjeto: dadosSugeridos.tipo_objeto || "",
          descricaoObjeto: dadosSugeridos.descricao_objeto || "",
          
          causas: dadosSugeridos.causas,
          meta: dadosSugeridos.meta,
          planoAcao: dadosSugeridos.planoAcao,
          
          dataAlvo: "", // Data alvo a IA não adivinha bem, deixamos vazio para o usuário por
          indicadorReferencia: "",
          indicadorDesejado: ""
        },

        do: null,
        check: null,
        act: null
      };

      const docRef = await addDoc(collection(db, "pdcas"), novoPdca);
      navigate(`/pdca/${docRef.id}`);

    } catch (error) {
      console.error("Erro IA:", error);
      alert("Erro ao criar com IA.");
    } finally {
      setAnalisando(false);
    }
  };

  // --- LAYOUT E LISTAS (Mantido igual) ---
  const ativos = pdcas.filter((p) => (p.situacao || "ativo") === "ativo");
  const concluidos = pdcas.filter((p) => (p.situacao || "ativo") === "concluido");
  const cancelados = pdcas.filter((p) => (p.situacao || "ativo") === "cancelado");

  const planList = ativos.filter((p) => getStageFromStatus(p.status) === "Plan").slice(0, 5);
  const doList = ativos.filter((p) => getStageFromStatus(p.status) === "Do").slice(0, 5);
  const checkList = ativos.filter((p) => getStageFromStatus(p.status) === "Check").slice(0, 5);
  const actList = ativos.filter((p) => getStageFromStatus(p.status) === "Act").slice(0, 5);
  const concluidosList = concluidos.slice(0, 5);
  const canceladosList = cancelados.slice(0, 5);

  const total = pdcas.length;
  const totalAtivos = ativos.length;
  const totalConcluidos = concluidos.length;
  const totalCancelados = cancelados.length;
  const totalPlan = ativos.filter((p) => getStageFromStatus(p.status) === "Plan").length;
  const totalDo = ativos.filter((p) => getStageFromStatus(p.status) === "Do").length;
  const totalCheck = ativos.filter((p) => getStageFromStatus(p.status) === "Check").length;
  const totalAct = ativos.filter((p) => getStageFromStatus(p.status) === "Act").length;

  function renderList(list) {
    if (loading) return <p className="home-card-list-empty">Carregando...</p>;
    if (list.length === 0) return <p className="home-card-list-empty">Nenhum PDCA.</p>;
    return (
      <ul className="home-card-list">
        {list.map((p) => {
          const dt = firestoreStringDateToDate(p.criadoEm);
          const label = dt ? dt.toLocaleDateString("pt-BR") : "-";
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

  return (
    <div className="page">
      <h1 className="page-title">PDCA NL – Mapa do Ciclo</h1>
      
      {/* --- IA SECTION --- */}
      <div style={styles.iaContainer}>
        <div style={styles.iaHeader}>
          <h2 style={{margin: 0, fontSize: '1.2rem', color: '#4a0072'}}>✨ Copiloto IA</h2>
          <span style={{fontSize: '0.9rem', color: '#666'}}>Descreva o problema e a IA preenche o Plan.</span>
        </div>
        <textarea
          style={styles.textarea}
          placeholder="Ex: A empilhadeira bateu na prateleira da expedição por falta de espaço..."
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
      {/* ------------------ */}

      <div className="home-layout">
        <div className="home-row">
          <div className="home-card home-card-dashboard">
            <header>
              <h2>Visão Geral</h2>
              <p>Métricas rápidas da operação.</p>
            </header>
            <div className="home-dashboard-metrics">
              <div><span className="metric-label">Total</span><span className="metric-value">{total}</span></div>
              <div><span className="metric-label">Ativos</span><span className="metric-value">{totalAtivos}</span></div>
              <div><span className="metric-label">Concluídos</span><span className="metric-value">{totalConcluidos}</span></div>
              <div><span className="metric-label">Plan</span><span className="metric-value">{totalPlan}</span></div>
              <div><span className="metric-label">Do</span><span className="metric-value">{totalDo}</span></div>
              <div><span className="metric-label">Check</span><span className="metric-value">{totalCheck}</span></div>
              <div><span className="metric-label">Act</span><span className="metric-value">{totalAct}</span></div>
            </div>
          </div>
        </div>

        <div className="home-row home-row-2">
          <div className="home-card">
            <header><h2>Plan</h2></header>
            {renderList(planList)}
            <footer><Link to="/criar" className="btn-primary">Criar Manualmente</Link></footer>
          </div>
          <div className="home-card">
            <header><h2>Do</h2></header>
            {renderList(doList)}
          </div>
        </div>

        <div className="home-row home-row-2">
          <div className="home-card">
            <header><h2>Check</h2></header>
            {renderList(checkList)}
          </div>
          <div className="home-card">
            <header><h2>Act</h2></header>
            {renderList(actList)}
          </div>
        </div>

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

const styles = {
  iaContainer: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    background: 'linear-gradient(to right, #ffffff, #f9f7ff)'
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
    backgroundColor: '#6b46c1',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default HomePage;