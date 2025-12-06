import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js"; // Verifique se o caminho do firebase está correto

// ---------- HELPERS DE DATA / TEMPO ----------

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffDays(fromISO, toISO) {
  const from = toDate(fromISO);
  const to = toISO ? toDate(toISO) : new Date();
  if (!from || !to) return null;
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function diffLabel(fromISO, toISO) {
  const d = diffDays(fromISO, toISO);
  if (d === null) return "-";
  if (d === 0) return "hoje";
  if (d === 1) return "1 dia";
  if (d < 0) return `${Math.abs(d)} dia(s) no futuro`;
  return `${d} dias`;
}

function getStageFromStatus(status) {
  switch (status) {
    case "Planejando": return "Plan";
    case "Executando": return "Do";
    case "Checando": return "Check";
    case "Padronizado": return "Act";
    default: return "Plan";
  }
}

// Cálculo do "tempo no estágio atual"
function getTempoNoEstagio(pdca) {
  const stage = getStageFromStatus(pdca.status);
  const nowIso = new Date().toISOString();

  if (stage === "Plan") return diffLabel(pdca.criadoEm, pdca.doIniciadoEm || nowIso);
  if (stage === "Do") return diffLabel(pdca.doIniciadoEm || pdca.criadoEm, pdca.checkIniciadoEm || nowIso);
  if (stage === "Check") return diffLabel(pdca.checkIniciadoEm || pdca.doIniciadoEm, pdca.actIniciadoEm || nowIso);
  if (stage === "Act") return diffLabel(pdca.actIniciadoEm, nowIso);

  return "-";
}

// Tempo entre etapas
function getTempoEntreEtapas(pdca) {
  return {
    planToDo: diffLabel(pdca.criadoEm, pdca.doIniciadoEm),
    doToCheck: diffLabel(pdca.doIniciadoEm, pdca.checkIniciadoEm),
    checkToAct: diffLabel(pdca.checkIniciadoEm, pdca.actIniciadoEm),
  };
}

// ---------- COMPONENTES AUXILIARES ----------

function BoardColumn({ title, stageKey, items }) {
  const total = items.length;

  return (
    <section className="board-column">
      <header className="board-column-header">
        <div>
          <h2 style={{margin:0, fontSize:'16px'}}>{title}</h2>
          <p style={{margin:0, fontSize:'12px', color:'#666'}}>{total} PDCA(s)</p>
        </div>
      </header>

      <div className="board-column-body">
        {items.length === 0 ? (
          <div className="empty" style={{padding:'20px', textAlign:'center', color:'#999', fontSize:'13px'}}>Vazio</div>
        ) : (
          items.map((pdca) => <PdcaCard key={pdca.id} pdca={pdca} />)
        )}
      </div>
    </section>
  );
}

function PdcaCard({ pdca }) {
  const createdAt = toDate(pdca.criadoEm);
  const createdLabel = createdAt ? createdAt.toLocaleString("pt-BR") : "Sem data";
  const tempoNoEstagio = getTempoNoEstagio(pdca);

  // Fallback seguro para o objeto 'plan'
  const plan = pdca.plan || {};

  return (
    <Link to={`/pdca/${pdca.id}`} className="pdca-card" style={{textDecoration:'none', color:'inherit', display:'block', background:'white', padding:'15px', borderBottom:'1px solid #eee', marginBottom:'10px', borderRadius:'8px', border:'1px solid #e5e7eb'}}>
      <div className="pdca-card-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
        <div className="pdca-card-title" style={{fontWeight:'bold', fontSize:'14px'}}>
          {pdca.codigo || "S/ Cód"}
        </div>
        <span className="pdca-card-status" style={{fontSize:'10px', background:'#eee', padding:'2px 6px', borderRadius:'4px'}}>{pdca.status}</span>
      </div>

      <div className="pdca-card-meta" style={{fontSize:'11px', color:'#666', marginBottom:'8px'}}>
        <span style={{marginRight:'10px'}}>📍 {plan.area || "Geral"}</span>
        <span>👤 {plan.responsavel || "Ñ atribuído"}</span>
      </div>

      <p className="pdca-card-body" style={{fontSize:'13px', margin:'0 0 10px 0', color:'#333'}}>
        {plan.problema || "Sem descrição do problema."}
      </p>

      <div className="pdca-card-footer" style={{fontSize:'11px', color:'#999', borderTop:'1px dashed #eee', paddingTop:'8px', display:'flex', justifyContent:'space-between'}}>
        <span>Criado: {createdLabel.split(' ')[0]}</span>
        <span>Há {tempoNoEstagio}</span>
      </div>
    </Link>
  );
}

// ---------- PÁGINA PRINCIPAL (EXPORTAÇÃO CORRIGIDA) ----------

export function PdcaDashboardPage() {
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        // Busca a coleção 'pdcas' do Firebase
        const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
        const snap = await getDocs(q);
        const docs = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          docs.push({ id: docSnap.id, ...data });
        });

        setPdcas(docs);
      } catch (e) {
        console.error("Erro ao carregar PDCAs:", e);
        setError("Erro ao conectar com o banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Filtra e separa os cards nas colunas
  const { planList, doList, checkList, actList } = useMemo(() => {
    const plan = [];
    const doStage = [];
    const check = [];
    const act = [];

    pdcas.forEach((p) => {
      // Se não tiver status, assume 'Planejando'
      const s = p.status || "Planejando";
      const stage = getStageFromStatus(s);
      
      if (stage === "Plan") plan.push(p);
      else if (stage === "Do") doStage.push(p);
      else if (stage === "Check") check.push(p);
      else if (stage === "Act") act.push(p);
    });

    return { planList: plan, doList: doStage, checkList: check, actList: act };
  }, [pdcas]);

  // CSS Embutido para garantir o layout das colunas
  const styles = `
    .board-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding-top: 20px; }
    .board-column { background: #f9fafb; border-radius: 8px; padding: 10px; height: 100%; min-height: 400px; }
    .board-column-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
    .page { max-width: 1200px; margin: 0 auto; padding: 20px; }
  `;

  if (loading) return <div className="page">Carregando quadro...</div>;
  if (error) return <div className="page" style={{color:'red'}}>{error}</div>;

  return (
    <div className="page">
      <style>{styles}</style>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h1 className="page-title" style={{fontSize:'24px', margin:0}}>Dashboard PDCA</h1>
            <p style={{color:'#666', marginTop:'5px'}}>Visão geral de todos os planos de ação da empresa.</p>
        </div>
        <Link to="/" style={{textDecoration:'none', color:'#2563eb', fontWeight:'bold'}}>← Voltar ao Diário</Link>
      </div>

      <div className="board-grid">
        <BoardColumn title="1. Planejamento (Plan)" stageKey="Plan" items={planList} />
        <BoardColumn title="2. Execução (Do)" stageKey="Do" items={doList} />
        <BoardColumn title="3. Verificação (Check)" stageKey="Check" items={checkList} />
        <BoardColumn title="4. Ação/Padronização (Act)" stageKey="Act" items={actList} />
      </div>
    </div>
  );
}