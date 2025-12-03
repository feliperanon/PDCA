// src/pages/CreatePdcaPage.jsx
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase.js";

function gerarCodigoPdca() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const sufixo = String(agora.getTime()).slice(-4);
  return `PDCA-${ano}-${sufixo}`;
}

export function CreatePdcaPage() {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [area, setArea] = useState("");
  const [prioridade, setPrioridade] = useState("Média");
  const [responsavel, setResponsavel] = useState("");
  const [timeTurno, setTimeTurno] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [tipoObjeto, setTipoObjeto] = useState("");
  const [descricaoObjeto, setDescricaoObjeto] = useState("");
  const [problema, setProblema] = useState("");
  const [causas, setCausas] = useState("");
  const [meta, setMeta] = useState("");
  const [indicadorReferencia, setIndicadorReferencia] = useState("");
  const [indicadorDesejado, setIndicadorDesejado] = useState("");
  const [planoAcao, setPlanoAcao] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const codigo = gerarCodigoPdca();
      const agoraISO = new Date().toISOString();

      const docData = {
        // se quiser, depois podemos ligar com auth e usar user.uid aqui
        usuario: null,
        codigo,
        titulo,
        status: "Planejando",
        plan: {
          categoria,
          area,
          prioridade,
          responsavel,
          timeOuTurno: timeTurno,
          dataAlvo,
          tipoObjeto,
          descricaoObjeto,
          problema,
          causas,
          meta,
          indicadorReferencia,
          indicadorDesejado,
          planoAcao,
        },
        do: null,
        check: null,
        act: null,
        criadoEm: agoraISO,
        atualizadoEm: agoraISO,
      };

      await addDoc(collection(db, "pdcas"), docData);

      setMessage(`PDCA ${codigo} criado com sucesso.`);
      // limpa o formulário
      setTitulo("");
      setCategoria("");
      setArea("");
      setPrioridade("Média");
      setResponsavel("");
      setTimeTurno("");
      setDataAlvo("");
      setTipoObjeto("");
      setDescricaoObjeto("");
      setProblema("");
      setCausas("");
      setMeta("");
      setIndicadorReferencia("");
      setIndicadorDesejado("");
      setPlanoAcao("");
    } catch (e) {
      console.error(e);
      setMessage("Erro ao criar PDCA. Confira os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Novo PDCA – Plan</h1>
      <p className="page-subtitle">
        Registre o problema com clareza, prioridade, área e meta. O código PDCA
        será gerado automaticamente.
      </p>

      {message && <div className="alert">{message}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>Informações gerais</h2>

          <label>
            Título (nome do problema)
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </label>

          <label>
            Categoria
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Quebra / perda de produto">
                Quebra / perda de produto
              </option>
              <option value="Atraso / tempo">Atraso / tempo</option>
              <option value="Comunicação / alinhamento">
                Comunicação / alinhamento
              </option>
              <option value="Organização / processo">
                Organização / processo
              </option>
              <option value="Segurança / risco">Segurança / risco</option>
              <option value="Outro">Outro</option>
            </select>
          </label>

          <label>
            Área
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Expedição, Seleção, Logística..."
            />
          </label>

          <label>
            Prioridade
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>

          <label>
            Responsável pelo PDCA
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              required
            />
          </label>

          <label>
            Time / turno (opcional)
            <input
              type="text"
              value={timeTurno}
              onChange={(e) => setTimeTurno(e.target.value)}
              placeholder="Expedição dia, Noite, Seleção..."
            />
          </label>

          <label>
            Data alvo para concluir o ciclo (Check/Act)
            <input
              type="date"
              value={dataAlvo}
              onChange={(e) => setDataAlvo(e.target.value)}
            />
          </label>
        </section>

        <section className="form-section">
          <h2>Objeto do problema</h2>

          <label>
            Tipo de objeto
            <select
              value={tipoObjeto}
              onChange={(e) => setTipoObjeto(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Produto">Produto</option>
              <option value="Cliente">Cliente</option>
              <option value="Processo">Processo</option>
            </select>
          </label>

          <label>
            Descrição do objeto
            <input
              type="text"
              value={descricaoObjeto}
              onChange={(e) => setDescricaoObjeto(e.target.value)}
              placeholder="Tomate Débora, Verdemar, Separação..."
            />
          </label>
        </section>

        <section className="form-section">
          <h2>Conteúdo do Plan</h2>

          <label>
            Problema
            <textarea
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
            />
          </label>

          <label>
            Causas (ou hipóteses)
            <textarea
              value={causas}
              onChange={(e) => setCausas(e.target.value)}
            />
          </label>

          <label>
            Meta
            <input
              type="text"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ex.: Reduzir quebra de 8% para 4% em 30 dias"
            />
          </label>

          <label>
            Indicador antes (referência)
            <input
              type="text"
              value={indicadorReferencia}
              onChange={(e) => setIndicadorReferencia(e.target.value)}
            />
          </label>

          <label>
            Indicador desejado
            <input
              type="text"
              value={indicadorDesejado}
              onChange={(e) => setIndicadorDesejado(e.target.value)}
            />
          </label>

          <label>
            Plano de ação
            <textarea
              value={planoAcao}
              onChange={(e) => setPlanoAcao(e.target.value)}
            />
          </label>
        </section>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar Plan (criar novo PDCA)"}
        </button>
      </form>
    </div>
  );
}
