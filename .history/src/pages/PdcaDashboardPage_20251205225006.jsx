// src/pages/PdcaDashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";

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
    case "Planejando":
      return "Plan";
    case "Executando":
      return "Do";
    case "Checando":
      return "Check";
    case "Padronizado":
      return "Act";
    default:
      return "Plan";
  }
}

function firestoreStringDateToDate(str) {
  return toDate(str);
}

// Cálculo do "tempo no estágio atual"
function getTempoNoEstagio(pdca) {
  const stage = getStageFromStatus(pdca.status);
  const nowIso = new Date().toISOString();

  if (stage === "Plan") {
    return diffLabel(pdca.criadoEm, pdca.doIniciadoEm || nowIso);
  }

  if (stage === "Do") {
    const inicio = pdca.doIniciadoEm || pdca.criadoEm;
    return diffLabel(inicio, pdca.checkIniciadoEm || nowIso);
  }

  if (stage === "Check") {
    const inicio = pdca.checkIniciadoEm || pdca.doIniciadoEm || pdca.criadoEm;
    return diffLabel(inicio, pdca.actIniciadoEm || nowIso);
  }

  if (stage === "Act") {
    const inicio =
      pdca.actIniciadoEm ||
      pdca.checkIniciadoEm ||
      pdca.doIniciadoEm ||
      pdca.criadoEm;
    return diffLabel(inicio, nowIso);
  }

  return "-";
}

// Tempo entre etapas (para mostrar no card)
function getTempoEntreEtapas(pdca) {
  return {
    planToDo: diffLabel(pdca.criadoEm, pdca.doIniciadoEm),
    doToCheck: diffLabel(pdca.doIniciadoEm, pdca.checkIniciadoEm),
    checkToAct: diffLabel(pdca.checkIniciadoEm, pdca.actIniciadoEm),
  };
}

// ---------- COMPONENTE DE COLUNA ----------

function BoardColumn({ title, stageKey, items }) {
  const total = items.length;

  function diffDaysParaStage(pdca, stage) {
    const nowIso = new Date().toISOString();
    if (stage === "Plan") {
      return diffDays(pdca.criadoEm, pdca.doIniciadoEm || nowIso);
    }
    if (stage === "Do") {
      const inicio = pdca.doIniciadoEm || pdca.criadoEm;
      return diffDays(inicio, pdca.checkIniciadoEm || nowIso);
    }
    if (stage === "Check") {
      const inicio = pdca.checkIniciadoEm || pdca.doIniciadoEm || pdca.criadoEm;
      return diffDays(inicio, pdca.actIniciadoEm || nowIso);
    }
    if (stage === "Act") {
      const inicio =
        pdca.actIniciadoEm ||
        pdca.checkIniciadoEm ||
        pdca.doIniciadoEm ||
        pdca.criadoEm;
      return diffDays(inicio, nowIso);
    }
    return null;
  }

  const temposValidos = items
    .map((p) => diffDaysParaStage(p, stageKey))
    .filter((v) => v !== null && v >= 0);

  let mediaDias = null;
  if (temposValidos.length > 0) {
    const soma = temposValidos.reduce((acc, v) => acc + v, 0);
    mediaDias = Math.round(soma / temposValidos.length);
  }

  return (
    <section className="board-column">
      <header className="board-column-header">
        <div>
          <h2>{title}</h2>
          <p>{total} PDCA(s) nesta etapa</p>
        </div>
        <div className="board-column-metrics">
          <span className="badge">
            Média no estágio:{" "}
            {mediaDias === null ? "-" : `${mediaDias} dia(s)`}
          </span>
        </div>
      </header>

      <div className="board-column-body">
        {items.length === 0 ? (
          <div className="empty">Nenhum PDCA nesta etapa.</div>
        ) : (
          items.map((pdca) => <PdcaCard key={pdca.id} pdca={pdca} />)
        )}
      </div>
    </section>
  );
}

// CARD DE CADA PDCA NA COLUNA
function PdcaCard({ pdca }) {
  const createdAt = firestoreStringDateToDate(pdca.criadoEm);
  const createdLabel = createdAt
    ? createdAt.toLocaleString("pt-BR")
    : "Sem data";

  const dataAlvoDate = pdca.dataAlvo
    ? new Date(pdca.dataAlvo + "T00:00:00")
    : null;
  const dataAlvoLabel = dataAlvoDate
    ? dataAlvoDate.toLocaleDateString("pt-BR")
    : "-";

  let atrasoLabel = "-";
  if (dataAlvoDate && pdca.situacao === "ativo" && pdca.status !== "Padronizado") {
    const hoje = new Date();
    const diffMs = hoje.getTime() - dataAlvoDate.getTime();
    const atrasoDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (atrasoDias > 0) {
      atrasoLabel = `${atrasoDias} dia(s) atrasado`;
    } else if (atrasoDias === 0) {
      atrasoLabel = "vence hoje";
    } else {
      atrasoLabel = `${Math.abs(atrasoDias)} dia(s) até o vencimento`;
    }
  }

  const tempoNoEstagio = getTempoNoEstagio(pdca);
  const temposEntre = getTempoEntreEtapas(pdca);

  return (
    <Link to={`/pdca/${pdca.id}`} className="pdca-card">
      <div className="pdca-card-header">
        <div className="pdca-card-title">
          {pdca.codigo} — {pdca.titulo}
        </div>
        <span className="pdca-card-status">{pdca.status}</span>
      </div>

      <div className="pdca-card-meta">
        <span>Área: {pdca.area || "-"}</span>
        <span>Responsável: {pdca.responsavel || "-"}</span>
        <span>Prazo: {dataAlvoLabel}</span>
      </div>

      <p className="pdca-card-body">
        {pdca.problema ||
          "Sem descrição de problema cadastrada no Plan ainda."}
      </p>

      <div className="pdca-card-footer">
        <div className="pdca-card-footer-item">
          <small>Criado em</small>
          <span>{createdLabel}</span>
        </div>

        <div className="pdca-card-footer-item">
          <small>Tempo no estágio</small>
          <span>{tempoNoEstagio}</span>
        </div>

        <div className="pdca-card-footer-item">
          <small>Prazo</small>
          <span>{atrasoLabel}</span>
        </div>
      </div>

      <div className="pdca-card-timing">
        <div>
          <small>Plan → Do</small>
          <span>{temposEntre.planToDo}</span>
        </div>
        <div>
          <small>Do → Check</small>
          <span>{temposEntre.doToCheck}</span>
        </div>
        <div>
          <small>Check → Act</small>
          <span>{temposEntre.checkToAct}</span>
        </div>
      </div>
    </Link>
  );
}

// ---------- PÁGINA PRINCIPAL DO DASHBOARD ----------

export function PdcaDashboardPage() {
  const [pdcas, setPdcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
        const snap = await getDocs(q);
        const docs = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const plan = data.plan || {};
          docs.push({
            id: docSnap.id,
            codigo: data.codigo || docSnap.id,
            titulo: data.titulo || "",
            status: data.status || "Planejando",
            criadoEm: data.criadoEm || null,
            atualizadoEm: data.atualizadoEm || null,
            situacao: data.situacao || "ativo",
            concluidoEm: data.concluidoEm || null,
            canceladoEm: data.canceladoEm || null,

            // Plan
            area: plan.area || "",
            prioridade: plan.prioridade || "",
            responsavel: plan.responsavel || "",
            problema: plan.problema || "",
            dataAlvo: plan.dataAlvo || "",

            // carimbos de tempo entre fases
            doIniciadoEm: data.doIniciadoEm || null,
            checkIniciadoEm: data.checkIniciadoEm || null,
            actIniciadoEm: data.actIniciadoEm || null,
          });
        });

        setPdcas(docs);
      } catch (e) {
        console.error("Erro ao carregar PDCAs:", e);
        setError("Erro ao carregar PDCAs.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pdcasAtivos = useMemo(
    () => pdcas.filter((p) => (p.situacao || "ativo") === "ativo"),
    [pdcas]
  );

  const { planList, doList, checkList, actList } = useMemo(() => {
    const plan = [];
    const doStage = [];
    const check = [];
    const act = [];

    pdcasAtivos.forEach((p) => {
      const stage = getStageFromStatus(p.status);
      if (stage === "Plan") plan.push(p);
      if (stage === "Do") doStage.push(p);
      if (stage === "Check") check.push(p);
      if (stage === "Act") act.push(p);
    });

    return { planList: plan, doList: doStage, checkList: check, actList: act };
  }, [pdcasAtivos]);

  if (loading) {
    return <div className="page">Carregando quadro de PDCAs...</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Dashboard de PDCAs por etapa</h1>
      <p className="page-subtitle">
        Quadro em quatro colunas: Plan, Do, Check e Act, exibindo todos os
        PDCAs ativos em todas as áreas.
      </p>

      <div className="board-grid">
        <BoardColumn title="Plan" stageKey="Plan" items={planList} />
        <BoardColumn title="Do" stageKey="Do" items={doList} />
        <BoardColumn title="Check" stageKey="Check" items={checkList} />
        <BoardColumn title="Act" stageKey="Act" items={actList} />
      </div>
    </div>
  );
}
