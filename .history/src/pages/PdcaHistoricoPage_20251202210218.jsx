import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase.js";

export function PdcaHistoricoPage() {
  const [done, setDone] = useState([]);
  const [canceled, setCanceled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const q = query(collection(db, "pdcas"), orderBy("criadoEm", "desc"));
      const snap = await getDocs(q);

      const concluido = [];
      const cancelado = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const situacao = data.situacao || "ativo";

        if (situacao === "concluido") {
          concluido.push({ id: docSnap.id, ...data });
        }
        if (situacao === "cancelado") {
          cancelado.push({ id: docSnap.id, ...data });
        }
      });

      setDone(concluido);
      setCanceled(cancelado);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Histórico de PDCAs</h1>
      <p className="page-subtitle">
        Aqui ficam todos os ciclos concluídos ou cancelados.
      </p>

      {loading && <p>Carregando histórico...</p>}

      {!loading && (
        <>
          <div className="home-row home-row-2">
            <div className="home-card">
              <h2>Concluídos</h2>
              {done.length === 0 ? (
                <p>Nenhum PDCA concluído.</p>
              ) : (
                <ul className="home-card-list">
                  {done.map((p) => (
                    <li key={p.id}>
                      <a href={`#/pdca/${p.id}`}>
                        <strong>{p.codigo}</strong>
                        <span>{p.titulo}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="home-card">
              <h2>Cancelados</h2>
              {canceled.length === 0 ? (
                <p>Nenhum PDCA cancelado.</p>
              ) : (
                <ul className="home-card-list">
                  {canceled.map((p) => (
                    <li key={p.id}>
                      <a href={`#/pdca/${p.id}`}>
                        <strong>{p.codigo}</strong>
                        <span>{p.titulo}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
