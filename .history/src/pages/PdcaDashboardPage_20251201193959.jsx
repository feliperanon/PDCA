// src/pages/PdcaDashboardPage.jsx
// Dashboard inicial com dados mockados por enquanto.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

// MOCK PDCAs – depois a gente troca por Firestore
const MOCK_PDCAS = [
  {
    id: "PDCA-2025-3861",
    codigo: "PDCA-2025-3861",
    titulo: "Quebra de tomate no Verdemar",
    prioridade: "Alta",
    area: "Expedição",
    clienteTipo: "Varejo Premium",
    status: "Planejando",
    meta: "Reduzir quebra de 8% para 4% em 30 dias",
    textoProblema:
      "Alta quebra de tomate nas lojas premium, principalmente em clientes mais distantes.",
    criadoEm: "2025-11-30T22:51:03",
  },
  {
    id: "PDCA-2025-6935",
    codigo: "PDCA-2025-6935",
    titulo: "Atraso na saída dos caminhões",
    prioridade: "Média",
    area: "Logística",
    clienteTipo: "Varejo",
    status: "Padronizado",
    meta: "Garantir 90% das saídas até 10h",
    textoProblema:
      "Caminhões do Verdemar saindo após 11h, gerando atraso na loja.",
    criadoEm: "2025-11-29T10:15:00",
  },
  {
    id: "PDCA-2025-7777",
    codigo: "PDCA-2025-7777",
    titulo: "Falta de caixas verdes",
    prioridade: "Alta",
    area: "Almoxarifado",
    clienteTipo: "Varejo",
    status: "Planejando",
    meta: "Manter estoque mínimo de 500 caixas verdes",
    textoProblema:
      "Ruptura frequente de caixas verdes no horário de pico de carregamento.",
    criadoEm: "2025-12-01T06:30:00",
  },
];

export function PdcaDashboardPage() {
  const [pdcas] = useState(MOCK_PDCAS);
  const [activeViewId, setActiveViewId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const savedViews = [
    {
      id: "criticos-hoje",
      label: "Ver só críticos",
      apply: (pdca) => pdca.prioridade === "Alta" || pdca.prioridade === "Crítica",
    },
    {
      id: "area-expedicao",
      label: "Ver só área Expedição",
      apply: (pdca) => pdca.area === "Expedição",
    },
    {
      id: "clientes-premium",
      label: "Ver só Varejo Premium",
      apply: (pdca) => pdca.clienteTipo === "Varejo Premium",
    },
  ];

  const filteredPdcas = useMemo(() => {
    let list = [...pdcas];

    const activeView = savedViews.find((v) => v.id === activeViewId);
    if (activeView) {
      list = list.filter(activeView.apply);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.codigo && p.codigo.toLowerCase().includes(term)) ||
          (p.titulo && p.titulo.toLowerCase().includes(term))
      );
    }

    list.sort((a, b) => {
      const aTime = firestoreStringDateToDate(a.criadoEm)?.getTime() || 0;
      const bTime = firestoreStringDateToDate(b.criadoEm)?.getTime() || 0;
      return bTime - aTime;
    });

    return list;
  }, [pdcas, activeViewId, searchTerm]);

  return (
    <div className="p-4 space-y-6">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Dashboard de PDCAs</h1>
          <p className="text-sm text-gray-600">
            Visões rápidas para reunião diária e acompanhamento da cultura PDCA.
          </p>
        </div>
      </header>

      {/* Filtros rápidos e busca */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Visões rápidas:</span>

          <button
            type="button"
            onClick={() => setActiveViewId(null)}
            className={`px-3 py-1 rounded text-sm border ${
              activeViewId === null
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300"
            }`}
          >
            Ver todos
          </button>

          {savedViews.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveViewId(view.id)}
              className={`px-3 py-1 rounded text-sm border ${
                activeViewId === view.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            placeholder="Buscar por código ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </section>

      {/* Lista de PDCAs */}
      <section className="border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">
        {filteredPdcas.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            Nenhum PDCA encontrado com os filtros atuais.
          </div>
        )}

        {filteredPdcas.map((pdca) => {
          const createdAt = firestoreStringDateToDate(pdca.criadoEm);
          const dateLabel = createdAt
            ? createdAt.toLocaleString("pt-BR")
            : "Sem data";

          return (
            <Link
              key={pdca.id}
              to={`/pdca/${pdca.id}`}
              className="w-full text-left p-4 hover:bg-gray-50 flex flex-col gap-1 cursor-pointer no-underline text-inherit"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {pdca.codigo} — {pdca.titulo}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {pdca.status}
                </span>
              </div>
              <div className="text-xs text-gray-600 flex gap-3 flex-wrap">
                <span>Área: {pdca.area}</span>
                <span>Prioridade: {pdca.prioridade}</span>
                <span>Cliente: {pdca.clienteTipo}</span>
                <span>Criado em: {dateLabel}</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                {pdca.textoProblema}
              </p>
            </Link>
          );
        })}
      </section>

      {/* Linha do tempo / visão de cultura */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Linha do tempo da cultura PDCA</h2>

        <TimelineSection
          title="PDCAs criados nos últimos 7 dias"
          items={getPdcasCreatedLastDays(pdcas, 7)}
        />

        <TimelineSection
          title="PDCAs padronizados neste mês"
          items={getPdcasStandardizedThisMonth(pdcas)}
        />

        <TimelineSection
          title="PDCAs que voltaram para Plan"
          items={getPdcasBackToPlan(pdcas)}
        />
      </section>
    </div>
  );
}

// Helpers

function firestoreStringDateToDate(str) {
  if (!str) return null;
  return new Date(str);
}

function getPdcasCreatedLastDays(pdcas, days = 7) {
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() - days);

  return pdcas
    .filter((p) => {
      const date = firestoreStringDateToDate(p.criadoEm);
      return date && date >= limit;
    })
    .sort((a, b) => {
      const aTime = firestoreStringDateToDate(a.criadoEm)?.getTime() || 0;
      const bTime = firestoreStringDateToDate(b.criadoEm)?.getTime() || 0;
      return bTime - aTime;
    });
}

function getPdcasStandardizedThisMonth(pdcas) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return pdcas.filter((p) => {
    if (p.status !== "Padronizado") return false;
    const date = firestoreStringDateToDate(p.criadoEm);
    if (!date) return false;
    return date.getMonth() === month && date.getFullYear() === year;
  });
}

function getPdcasBackToPlan(pdcas) {
  return pdcas.filter(
    (p) => p.status === "Planejando" && p.voltouParaPlan === true
  );
}

function TimelineSection({ title, items }) {
  return (
    <section className="border border-gray-200 rounded-md bg-white">
      <header className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{items.length} itens</span>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-3 text-xs text-gray-500">
          Nenhum registro neste período.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((p) => {
            const createdAt = firestoreStringDateToDate(p.criadoEm);
            const dateLabel = createdAt
              ? createdAt.toLocaleString("pt-BR")
              : "Sem data";

            return (
              <li key={p.id} className="px-4 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {p.codigo} — {p.titulo}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {dateLabel}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 flex gap-3 flex-wrap mt-1">
                  <span>Área: {p.area}</span>
                  <span>Prioridade: {p.prioridade}</span>
                  <span>Status: {p.status}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
