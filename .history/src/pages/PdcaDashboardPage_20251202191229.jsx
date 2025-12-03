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
    // do criadoEm até início de Do (se existir) ou hoje
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

  // média simples de dias no estágio (onde der para calcular)
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

  const dataAlvoDate = pdca.dataA
