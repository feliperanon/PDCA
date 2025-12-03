import { useMemo, useState } from "react";

// Exemplo de estrutura de dados que vem do Firestore
// {
//   id: "PDCA-2025-3861",
//   codigo: "PDCA-2025-3861",
//   titulo: "Problema na expedição",
//   prioridade: "Alta" | "Média" | "Baixa",
//   area: "Expedição" | "Logística" | "Qualidade" | ...,
//   clienteTipo: "Varejo Premium" | "Varejo" | "Atacado" | null,
//   status: "Planejando" | "Executando" | "Verificando" | "Padronizado",
//   criadoEm: { seconds: 12345, nanoseconds: 12345 } // Timestamp Firestore
// }

const savedViews = [
  {
    id: "criticos-hoje",
    label: "Ver só críticos",
    apply: (pdca) => pdca.prioridade === "Alta",
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

export function PdcaListWithFilters({ pdcas, onSelectPdca }) {
  const [activeViewId, setActiveViewId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPdcas = useMemo(() => {
    let list = [...pdcas];

    // Aplicar visão salva
    const activeView = savedViews.find((v) => v.id === activeViewId);
    if (activeView) {
      list = list.filter(activeView.apply);
    }

    // Filtro de texto simples (por código ou título)
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.codigo && p.codigo.toLowerCase().includes(term)) ||
          (p.titulo && p.titulo.toLowerCase().includes(term))
      );
    }

    // Ordenar por data de criação (mais recente primeiro)
    list.sort((a, b) => {
      const aTime = a.criadoEm?.seconds || 0;
      const bTime = b.criadoEm?.seconds || 0;
      return bTime - aTime;
    });

    return list;
  }, [pdcas, activeViewId, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Filtros rápidos / visões salvas */}
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

      {/* Campo de busca simples */}
      <div>
        <input
          type="text"
          placeholder="Buscar por código ou título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      {/* Lista de PDCAs */}
      <div className="border border-gray-200 rounded-md divide-y divide-gray-200 bg-white">
        {filteredPdcas.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            Nenhum PDCA encontrado com os filtros atuais.
          </div>
        )}

        {filteredPdcas.map((pdca) => (
          <button
            key={pdca.id}
            type="button"
            onClick={() => onSelectPdca && onSelectPdca(pdca)}
            className="w-full text-left p-4 hover:bg-gray-50 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {pdca.codigo || pdca.id} — {pdca.titulo}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {pdca.status}
              </span>
            </div>
            <div className="text-xs text-gray-600 flex gap-3 flex-wrap">
              <span>Área: {pdca.area || "—"}</span>
              <span>Prioridade: {pdca.prioridade || "—"}</span>
              <span>Cliente: {pdca.clienteTipo || "—"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
