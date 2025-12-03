// src/pages/PdcaDetailPage.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js"; // usa o mesmo firebase.js do seu app atual

export function PdcaDetailPage() {
  const { id } = useParams(); // /pdca/:id
  const [pdca, setPdca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Campos editáveis
  const [prioridade, setPrioridade] = useState("");
  const [area, setArea] = useState("");
  const [meta, setMeta] = useState("");
  const [textoProblema, setTextoProblema] = useState("");

  useEffect(() => {
    async function loadPdca() {
      setLoading(true);
      setError("");
      try {
        const ref = doc(db, "pdcas", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("PDCA não encontrado.");
          setPdca(null);
        } else {
          const data = snap.data();

          setPdca({ id: snap.id, ...data });

          // Lendo dos campos dentro de plan
          setPrioridade(data.plan?.prioridade || "");
          setArea(data.plan?.area || "");
          setMeta(data.plan?.meta || "");
          setTextoProblema(
            data.plan?.problema ||
              data.textoProblema || // fallback se você mudar a estrutura depois
              ""
          );
        }
      } catch (e) {
        console.error(e);
        setError("Erro ao carregar PDCA.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPdca();
    }
  }, [id]);

  const handleSave = async () => {
    if (!pdca) return;

    setSaving(true);
    setError("");

    try {
      const ref = doc(db, "pdcas", pdca.id);

      await updateDoc(ref, {
        "plan.prioridade": prioridade,
        "plan.area": area,
        "plan.meta": meta,
        "plan.problema": textoProblema,
        updatedAt: new Date().toISOString(),
      });

      setPdca((prev) =>
        prev
          ? {
              ...prev,
              plan: {
                ...(prev.plan || {}),
                prioridade,
                area,
                meta,
                problema: textoProblema,
              },
            }
          : prev
      );
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando PDCA...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 text-sm">{error}</div>;
  }

  if (!pdca) {
    return <div className="p-4">PDCA não encontrado.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">
            {pdca.codigo || pdca.id} — {pdca.titulo}
          </h1>
          <p className="text-sm text-gray-600">Status: {pdca.status}</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            className="px-3 py-2 text-sm rounded border border-gray-300 bg-white"
          >
            Voltar para o dashboard
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded text-sm text-white ${
              saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </header>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Prioridade */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">Selecione</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        {/* Área */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Área</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Expedição, Logística, Seleção..."
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* Meta */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Meta</label>
          <input
            type="text"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder="Ex.: Reduzir quebra de tomate de 8% para 4% em 30 dias"
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* Texto do problema */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Texto do problema</label>
          <textarea
            value={textoProblema}
            onChange={(e) => setTextoProblema(e.target.value)}
            rows={5}
            placeholder="Descreva claramente o problema..."
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
}
