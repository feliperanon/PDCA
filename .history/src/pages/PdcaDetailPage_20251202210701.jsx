// src/pages/PdcaDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";

function gerarCodigoPdca() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const sufixo = String(agora.getTime()).slice(-4);
  return `PDCA-${ano}-${sufixo}`;
}

export function PdcaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pdca, setPdca] = useState(null);
  const [loading, setLoading] = useState(true);

  // saving separado
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingDo, setSavingDo] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);
  const [savingAct, setSavingAct] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const [error, setError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");

  // mensagens por card (sucesso / cancelamento)
  const [planMessage, setPlanMessage] = useState("");
  const [doMessage, setDoMessage] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [actMessage, setActMessage] = useState("");

  // PLAN
  const [prioridade, setPrioridade] = useState("");
  const [area, setArea] = useState("");
  const [meta, setMeta] = useState("");
  const [textoProblema, setTextoProblema] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");

  // DO
  const [doAcoes, setDoAcoes] = useState("");
  const [doQuem, setDoQuem] = useState("");
  const [doQuando, setDoQuando] = useState("");

  // CHECK
  const [checkAntes, setCheckAntes] = useState("");
  const [checkDepois, setCheckDepois] = useState("");
  const [checkObs, setCheckObs] = useState("");

  // ACT
  const [actFuncionou, setActFuncionou] = useState(""); // "sim" | "nao" | ""
  const [actPadrao, setActPadrao] = useState("");
  const [actLicoes, setActLicoes] = useState("");

  // carimbos de tempo (para o dashboard calcular tempos entre etapas)
  const [doIniciadoEm, setDoIniciadoEm] = useState(null);
  const [checkIniciadoEm, setCheckIniciadoEm] = useState(null);
  const [actIniciadoEm, setActIniciadoEm] = useState(null);

  // Snapshots para botão "Cancelar" em cada card
  const [initialPlan, setInitialPlan] = useState(null);
  const [initialDo, setInitialDo] = useState(null);
  const [initialCheck, setInitialCheck] = useState(null);
  const [initialAct, setInitialAct] = useState(null);

  useEffect(() => {
    async function loadPdca() {
      setLoading(true);
      setError("");
      setGlobalMessage("");
      setPlanMessage("");
      setDoMessage("");
      setCheckMessage("");
      setActMessage("");

      try {
        const ref = doc(db, "pdcas", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("PDCA não encontrado.");
          setPdca(null);
        } else {
          const data = snap.data();
          const situacao = data.situacao || "ativo";
          const full = { id: snap.id, situacao, ...data };
          setPdca(full);

          const plan = data.plan || {};
          const doBlock = data.do || {};
          const checkBlock = data.check || {};
          const actBlock = data.act || {};

          // PLAN
          const pPrioridade = plan.prioridade || "";
          const pArea = plan.area || "";
          const pMeta = plan.meta || "";
          const pProblema = plan.problema || "";
          const pDataAlvo = plan.dataAlvo || "";

          setPrioridade(pPrioridade);
          setArea(pArea);
          setMeta(pMeta);
          setTextoProblema(pProblema);
          setDataAlvo(pDataAlvo);

          setInitialPlan({
            prioridade: pPrioridade,
            area: pArea,
            meta: pMeta,
            textoProblema: pProblema,
            dataAlvo: pDataAlvo,
          });

          // DO
          const dAcoes = doBlock.acoesRealizadas || "";
          const dQuem = doBlock.quemFez || "";
          const dQuando = doBlock.quandoFez || "";

          setDoAcoes(dAcoes);
          setDoQuem(dQuem);
          setDoQuando(dQuando);

          setInitialDo({
            doAcoes: dAcoes,
            doQuem: dQuem,
            doQuando: dQuando,
          });

          // CHECK
          const cAntes = checkBlock.indicadoresAntes || "";
          const cDepois = checkBlock.indicadoresDepois || "";
          const cObs = checkBlock.observacoes || "";

          setCheckAntes(cAntes);
          setCheckDepois(cDepois);
          setCheckObs(cObs);

          setInitialCheck({
            checkAntes: cAntes,
            checkDepois: cDepois,
            checkObs: cObs,
          });

          // ACT
          const aFunc =
            actBlock.funcionou === "sim"
              ? "sim"
              : actBlock.funcionou === "nao"
              ? "nao"
              : "";
          const aPadrao = actBlock.padrao || "";
          const aLicoes = actBlock.licoes || "";

          setActFuncionou(aFunc);
          setActPadrao(aPadrao);
          setActLicoes(aLicoes);

          setInitialAct({
            actFuncionou: aFunc,
            actPadrao: aPadrao,
            actLicoes: aLicoes,
          });

          // carimbos de tempo
          setDoIniciadoEm(data.doIniciadoEm || null);
          setCheckIniciadoEm(data.checkIniciadoEm || null);
          setActIniciadoEm(data.actIniciadoEm || null);
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

  // --------- TRAVAS ENTRE ETAPAS ---------

  const planOK = textoProblema && textoProblema.trim() !== "";
  const doOK =
    planOK &&
    ((doAcoes && doAcoes.trim() !== "") ||
      (doQuem && doQuem.trim() !== "") ||
      (doQuando && doQuando.trim() !== ""));
  const checkOK =
    doOK &&
    ((checkAntes && checkAntes.trim() !== "") ||
      (checkDepois && checkDepois.trim() !== "") ||
      (checkObs && checkObs.trim() !== ""));
  const actOK = checkOK && actFuncionou && actFuncionou !== "";

  function calcularNovoStatus() {
    if (actFuncionou === "sim") {
      return "Padronizado";
    }

    const temCheck =
      (checkAntes && checkAntes.trim() !== "") ||
      (checkDepois && checkDepois.trim() !== "") ||
      (checkObs && checkObs.trim() !== "");

    const temDo =
      (doAcoes && doAcoes.trim() !== "") ||
      (doQuem && doQuem.trim() !== "") ||
      (doQuando && doQuando.trim() !== "");

    if (temCheck) return "Checando";
    if (temDo) return "Executando";
    return "Planejando";
  }

  // --------- SALVAR GENÉRICO (USADO POR TODOS OS CARDS) ---------

  async function savePdcaCore() {
    if (!pdca) return;
    if ((pdca.situacao || "ativo") !== "ativo") {
      // segurança: não salva se não estiver ativo
      return;
    }

    setError("");

    const novoStatus = calcularNovoStatus();
    const agoraISO = new Date().toISOString();

    const prev = pdca || {};
    const prevDo = prev.do || {};
    const prevCheck = prev.check || {};
    const prevAct = prev.act || {};

    const prevDoVazio =
      !prevDo.acoesRealizadas && !prevDo.quemFez && !prevDo.quandoFez;
    const agoraDoVazio = !doAcoes && !doQuem && !doQuando;

    const prevCheckVazio =
      !prevCheck.indicadoresAntes &&
      !prevCheck.indicadoresDepois &&
      !prevCheck.observacoes;
    const agoraCheckVazio = !checkAntes && !checkDepois && !checkObs;

    const prevActVazio =
      !prevAct.funcionou && !prevAct.padrao && !prevAct.licoes;
    const agoraActVazio = !actFuncionou && !actPadrao && !actLicoes;

    let novoDoIniciadoEm = doIniciadoEm;
    let novoCheckIniciadoEm = checkIniciadoEm;
    let novoActIniciadoEm = actIniciadoEm;

    if (prevDoVazio && !agoraDoVazio && !novoDoIniciadoEm) {
      novoDoIniciadoEm = agoraISO;
    }
    if (prevCheckVazio && !agoraCheckVazio && !novoCheckIniciadoEm) {
      novoCheckIniciadoEm = agoraISO;
    }
    if (prevActVazio && !agoraActVazio && !novoActIniciadoEm) {
      novoActIniciadoEm = agoraISO;
    }

    try {
      const ref = doc(db, "pdcas", pdca.id);
      await updateDoc(ref, {
        // PLAN
        "plan.prioridade": prioridade,
        "plan.area": area,
        "plan.meta": meta,
        "plan.problema": textoProblema,
        "plan.dataAlvo": dataAlvo,

        // DO
        do: {
          acoesRealizadas: doAcoes,
          quemFez: doQuem,
          quandoFez: doQuando,
        },

        // CHECK
        check: {
          indicadoresAntes: checkAntes,
          indicadoresDepois: checkDepois,
          observacoes: checkObs,
        },

        // ACT
        act: {
          funcionou: actFuncionou,
          padrao: actPadrao,
          licoes: actLicoes,
        },

        status: novoStatus,
        atualizadoEm: agoraISO,
        ...(novoDoIniciadoEm && { doIniciadoEm: novoDoIniciadoEm }),
        ...(novoCheckIniciadoEm && { checkIniciadoEm: novoCheckIniciadoEm }),
        ...(novoActIniciadoEm && { actIniciadoEm: novoActIniciadoEm }),
      });

      setDoIniciadoEm(novoDoIniciadoEm);
      setCheckIniciadoEm(novoCheckIniciadoEm);
      setActIniciadoEm(novoActIniciadoEm);

      setInitialPlan({
        prioridade,
        area,
        meta,
        textoProblema,
        dataAlvo,
      });
      setInitialDo({
        doAcoes,
        doQuem,
        doQuando,
      });
      setInitialCheck({
        checkAntes,
        checkDepois,
        checkObs,
      });
      setInitialAct({
        actFuncionou,
        actPadrao,
        actLicoes,
      });

      setPdca((prevState) =>
        prevState
          ? {
              ...prevState,
              plan: {
                ...(prevState.plan || {}),
                prioridade,
                area,
                meta,
                problema: textoProblema,
                dataAlvo,
              },
              do: {
                acoesRealizadas: doAcoes,
                quemFez: doQuem,
                quandoFez: doQuando,
              },
              check: {
                indicadoresAntes: checkAntes,
                indicadoresDepois: checkDepois,
                observacoes: checkObs,
              },
              act: {
                funcionou: actFuncionou,
                padrao: actPadrao,
                licoes: actLicoes,
              },
              status: novoStatus,
              atualizadoEm: agoraISO,
              doIniciadoEm: novoDoIniciadoEm,
              checkIniciadoEm: novoCheckIniciadoEm,
              actIniciadoEm: novoActIniciadoEm,
            }
          : prevState
      );
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar alterações.");
    }
  }

  // --------- SALVAR POR CARD (CONTROLAM O PRÓPRIO LOADING / MENSAGEM) ---------

  const limparMensagensCards = () => {
    setPlanMessage("");
    setDoMessage("");
    setCheckMessage("");
    setActMessage("");
  };

  const handleSavePlan = async () => {
    limparMensagensCards();
    setSavingPlan(true);
    await savePdcaCore();
    setSavingPlan(false);
    setPlanMessage("PDCA atualizado com sucesso (Plan).");
  };

  const handleSaveDo = async () => {
    if (!planOK) return;
    limparMensagensCards();
    setSavingDo(true);
    await savePdcaCore();
    setSavingDo(false);
    setDoMessage("PDCA atualizado com sucesso (Do).");
  };

  const handleSaveCheck = async () => {
    if (!doOK) return;
    limparMensagensCards();
    setSavingCheck(true);
    await savePdcaCore();
    setSavingCheck(false);
    setCheckMessage("PDCA atualizado com sucesso (Check).");
  };

  const handleSaveAct = async () => {
    if (!checkOK) return;
    limparMensagensCards();
    setSavingAct(true);
    await savePdcaCore();
    setSavingAct(false);
    setActMessage("PDCA atualizado com sucesso (Act).");
  };

  // --------- BOTÕES DE CANCELAR POR CARD ---------

  const handleCancelarPlan = () => {
    if (!initialPlan) return;
    setPrioridade(initialPlan.prioridade || "");
    setArea(initialPlan.area || "");
    setMeta(initialPlan.meta || "");
    setTextoProblema(initialPlan.textoProblema || "");
    setDataAlvo(initialPlan.dataAlvo || "");
    setPlanMessage("Alterações em Plan descartadas.");
    setError("");
  };

  const handleCancelarDo = () => {
    if (!initialDo) return;
    setDoAcoes(initialDo.doAcoes || "");
    setDoQuem(initialDo.doQuem || "");
    setDoQuando(initialDo.doQuando || "");
    setDoMessage("Alterações em Do descartadas.");
    setError("");
  };

  const handleCancelarCheck = () => {
    if (!initialCheck) return;
    setCheckAntes(initialCheck.checkAntes || "");
    setCheckDepois(initialCheck.checkDepois || "");
    setCheckObs(initialCheck.checkObs || "");
    setCheckMessage("Alterações em Check descartadas.");
    setError("");
  };

  const handleCancelarAct = () => {
    if (!initialAct) return;
    setActFuncionou(initialAct.actFuncionou || "");
    setActPadrao(initialAct.actPadrao || "");
    setActLicoes(initialAct.actLicoes || "");
    setActMessage("Alterações em Act descartadas.");
    setError("");
  };

  // --------- REABRIR NOVO CICLO A PARTIR DO ACT ---------

  const handleReabrirCiclo = async () => {
    if (!pdca) return;

    if (actFuncionou !== "nao") {
      setError(
        "Só é possível abrir um novo ciclo automático quando o Act estiver marcado como 'não funcionou'."
      );
      return;
    }

    if ((pdca.situacao || "ativo") !== "ativo") {
      setError("Não é possível reabrir ciclo de um PDCA concluído ou cancelado.");
      return;
    }

    setSavingProject(true);
    setError("");
    setGlobalMessage("");

    try {
      const agoraISO = new Date().toISOString();
      const novoCodigo = gerarCodigoPdca();

      const planAnterior = pdca.plan || {};

      const novoDoc = {
        codigo: novoCodigo,
        titulo: pdca.titulo || `Reabertura de ${pdca.codigo}`,
        status: "Planejando",
        situacao: "ativo",
        plan: {
          ...planAnterior,
        },
        do: null,
        check: null,
        act: null,
        criadoEm: agoraISO,
        atualizadoEm: agoraISO,
        cicloAnteriorId: pdca.id,
        cicloAnteriorCodigo: pdca.codigo,
      };

      const refColecao = collection(db, "pdcas");
      const novoRef = await addDoc(refColecao, novoDoc);

      const refAntigo = doc(db, "pdcas", pdca.id);
      await updateDoc(refAntigo, {
        cicloReabertoParaId: novoRef.id,
        cicloReabertoParaCodigo: novoCodigo,
      });

      setGlobalMessage(
        `Novo ciclo criado a partir deste PDCA: ${novoCodigo}. Você já pode acessá-lo pelo dashboard.`
      );
    } catch (e) {
      console.error(e);
      setError("Erro ao abrir novo ciclo a partir deste PDCA.");
    } finally {
      setSavingProject(false);
    }
  };

  // --------- CONCLUIR / CANCELAR / EXCLUIR PROJETO ---------

  const canConcluir = planOK && doOK && checkOK && actOK;

  const handleConcluirProjeto = async () => {
    if (!pdca) return;

    const situacaoAtual = pdca.situacao || "ativo";
    if (situacaoAtual !== "ativo") {
      setError("Este PDCA já foi concluído ou cancelado.");
      return;
    }

    if (!canConcluir) {
      setError(
        "Para concluir o projeto, preencha as quatro etapas do ciclo (Plan, Do, Check e Act)."
      );
      setGlobalMessage("");
      return;
    }

    if (
      !window.confirm(
        "Confirmar conclusão deste PDCA? Ele será marcado como concluído e sairá do quadro de Act."
      )
    ) {
      return;
    }

    setSavingProject(true);
    setError("");
    setGlobalMessage("");

    try {
      const agoraISO = new Date().toISOString();
      const ref = doc(db, "pdcas", pdca.id);
      await updateDoc(ref, {
        situacao: "concluido",
        concluidoEm: agoraISO,
        atualizadoEm: agoraISO,
      });

      setPdca((prev) =>
        prev
          ? {
              ...prev,
              situacao: "concluido",
              concluidoEm: agoraISO,
              atualizadoEm: agoraISO,
            }
          : prev
      );

      setGlobalMessage("Projeto concluído com sucesso.");
    } catch (e) {
      console.error(e);
      setError("Erro ao concluir o projeto.");
    } finally {
      setSavingProject(false);
    }
  };

  const handleCancelarProjeto = async () => {
    if (!pdca) return;

    const situacaoAtual = pdca.situacao || "ativo";
    if (situacaoAtual !== "ativo") {
      setError("Este PDCA já foi concluído ou cancelado.");
      return;
    }

    if (
      !window.confirm(
        "Tem certeza que deseja cancelar este PDCA? Ele sairá do quadro e ficará registrado como cancelado."
      )
    ) {
      return;
    }

    setSavingProject(true);
    setError("");
    setGlobalMessage("");

    try {
      const agoraISO = new Date().toISOString();
      const ref = doc(db, "pdcas", pdca.id);
      await updateDoc(ref, {
        situacao: "cancelado",
        canceladoEm: agoraISO,
        atualizadoEm: agoraISO,
      });

      setPdca((prev) =>
        prev
          ? {
              ...prev,
              situacao: "cancelado",
              canceladoEm: agoraISO,
              atualizadoEm: agoraISO,
            }
          : prev
      );

      setGlobalMessage("Projeto cancelado com sucesso.");
    } catch (e) {
      console.error(e);
      setError("Erro ao cancelar o projeto.");
    } finally {
      setSavingProject(false);
    }
  };

  const handleExcluirProjeto = async () => {
    if (!pdca) return;

    if (
      !window.confirm(
        "Tem certeza que deseja excluir este PDCA? Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setSavingProject(true);
    setError("");
    setGlobalMessage("");

    try {
      const ref = doc(db, "pdcas", pdca.id);
      await deleteDoc(ref);
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setError("Erro ao excluir o projeto.");
    } finally {
      setSavingProject(false);
    }
  };

  // --------- RENDER ---------

  if (loading) {
    return <div className="page">Carregando PDCA...</div>;
  }

  if (error && !pdca) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!pdca) {
    return <div className="page">PDCA não encontrado.</div>;
  }

  const criado = pdca.criadoEm
    ? new Date(pdca.criadoEm).toLocaleString("pt-BR")
    : "-";
  const atualizado = pdca.atualizadoEm
    ? new Date(pdca.atualizadoEm).toLocaleString("pt-BR")
    : "-";

  const situacao = pdca.situacao || "ativo";
  const isAtivo = situacao === "ativo";

  const situacaoLabel =
    situacao === "ativo"
      ? "Ativo"
      : situacao === "concluido"
      ? "Concluído"
      : "Cancelado";

  return (
    <div className="page">
      <div className="detail-header">
        <div>
          <h1 className="page-title">
            {pdca.codigo || pdca.id} — {pdca.titulo}
          </h1>
          <p className="detail-status">Status atual: {pdca.status}</p>
          <p className="detail-status">Situação: {situacaoLabel}</p>
        </div>

        <div className="detail-actions">
          {/* Removido botão "Voltar para o dashboard" */}

          <button
            type="button"
            onClick={handleConcluirProjeto}
            disabled={savingProject || !canConcluir || !isAtivo}
            className="btn-primary"
          >
            {savingProject ? "Processando..." : "Concluir projeto"}
          </button>

          <button
            type="button"
            onClick={handleCancelarProjeto}
            disabled={savingProject || !isAtivo}
            className="btn-secondary"
          >
            {savingProject ? "Processando..." : "Cancelar projeto"}
          </button>

          <button
            type="button"
            onClick={handleExcluirProjeto}
            disabled={savingProject}
            className="btn-danger"
          >
            {savingProject ? "Processando..." : "Excluir projeto"}
          </button>
        </div>
      </div>

      {!isAtivo && (
        <div className="alert">
          Este PDCA está <strong>{situacaoLabel.toLowerCase()}</strong>. Todos os
          campos estão apenas para consulta.
        </div>
      )}

      {globalMessage && <div className="alert">{globalMessage}</div>}
      {error && !loading && (
        <div className="alert alert-error">{error}</div>
      )}

      <section className="detail-info">
        <p>
          <strong>Criado em:</strong> {criado}
        </p>
        <p>
          <strong>Última atualização:</strong> {atualizado}
        </p>
        {pdca.cicloAnteriorCodigo && (
          <p>
            <strong>Ciclo anterior:</strong> {pdca.cicloAnteriorCodigo}
          </p>
        )}
        {pdca.cicloReabertoParaCodigo && (
          <p>
            <strong>Reaberto para:</strong> {pdca.cicloReabertoParaCodigo}
          </p>
        )}
      </section>

      {/* GRID: PLAN | DO */}
      <div className="detail-grid">
        {/* PLAN */}
        <section className="form-section detail-card">
          <h2>Plan – problema e contexto</h2>

          {planMessage && (
            <div className="alert alert-success">{planMessage}</div>
          )}

          <label>
            Prioridade
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              disabled={!isAtivo}
            >
              <option value="">Selecione</option>
              <option value="Crítica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </label>

          <label>
            Área
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Expedição, Logística, Seleção..."
              disabled={!isAtivo}
            />
          </label>

          <label>
            Meta
            <input
              type="text"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ex.: Reduzir quebra de tomate de 8% para 4% em 30 dias"
              disabled={!isAtivo}
            />
          </label>

          <label>
            Data alvo para concluir o ciclo (Check/Act)
            <input
              type="date"
              value={dataAlvo}
              onChange={(e) => setDataAlvo(e.target.value)}
              disabled={!isAtivo}
            />
          </label>

          <label>
            Texto do problema
            <textarea
              value={textoProblema}
              onChange={(e) => setTextoProblema(e.target.value)}
              rows={4}
              placeholder="Descreva claramente o problema..."
              disabled={!isAtivo}
            />
          </label>

          {isAtivo ? (
            <div className="section-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelarPlan}
                disabled={savingPlan}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSavePlan}
                disabled={savingPlan}
              >
                {savingPlan ? "Salvando..." : "Salvar"}
              </button>
            </div>
          ) : (
            <p className="section-readonly-hint">
              Projeto {situacaoLabel.toLowerCase()}: Plan apenas para consulta.
            </p>
          )}
        </section>

        {/* DO */}
        <section className="form-section detail-card">
          <h2>Do – execução</h2>

          {doMessage && (
            <div className="alert alert-success">{doMessage}</div>
          )}

          {!planOK && (
            <div className="alert alert-error">
              Para registrar o Do, preencha primeiro o problema no Plan.
            </div>
          )}

          <fieldset disabled={!planOK || !isAtivo}>
            <label>
              Ações realizadas
              <textarea
                value={doAcoes}
                onChange={(e) => setDoAcoes(e.target.value)}
                rows={3}
                placeholder="O que foi feito na prática?"
              />
            </label>

            <label>
              Quem fez
              <input
                type="text"
                value={doQuem}
                onChange={(e) => setDoQuem(e.target.value)}
                placeholder="Nome(s) do(s) responsável(is)"
              />
            </label>

            <label>
              Quando fez
              <input
                type="date"
                value={doQuando}
                onChange={(e) => setDoQuando(e.target.value)}
              />
            </label>
          </fieldset>

          {isAtivo ? (
            <div className="section-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelarDo}
                disabled={savingDo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveDo}
                disabled={savingDo || !planOK}
              >
                {savingDo ? "Salvando..." : "Salvar"}
              </button>
            </div>
          ) : (
            <p className="section-readonly-hint">
              Projeto {situacaoLabel.toLowerCase()}: Do apenas para consulta.
            </p>
          )}
        </section>
      </div>

      {/* GRID: CHECK | ACT */}
      <div className="detail-grid">
        {/* CHECK */}
        <section className="form-section detail-card">
          <h2>Check – resultados</h2>

          {checkMessage && (
            <div className="alert alert-success">{checkMessage}</div>
          )}

          {!doOK && (
            <div className="alert alert-error">
              Para acessar o Check, finalize o Do (ações, quem e quando).
            </div>
          )}

          <fieldset disabled={!doOK || !isAtivo}>
            <label>
              Indicadores antes
              <textarea
                value={checkAntes}
                onChange={(e) => setCheckAntes(e.target.value)}
                rows={2}
                placeholder="Ex.: Quebra 8%, atraso médio 60 min..."
              />
            </label>

            <label>
              Indicadores depois
              <textarea
                value={checkDepois}
                onChange={(e) => setCheckDepois(e.target.value)}
                rows={2}
                placeholder="Ex.: Quebra 4%, atraso médio 20 min..."
              />
            </label>

            <label>
              Observações
              <textarea
                value={checkObs}
                onChange={(e) => setCheckObs(e.target.value)}
                rows={3}
                placeholder="O que você percebeu ao comparar antes/depois?"
              />
            </label>
          </fieldset>

          {isAtivo ? (
            <div className="section-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelarCheck}
                disabled={savingCheck}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveCheck}
                disabled={savingCheck || !doOK}
              >
                {savingCheck ? "Salvando..." : "Salvar"}
              </button>
            </div>
          ) : (
            <p className="section-readonly-hint">
              Projeto {situacaoLabel.toLowerCase()}: Check apenas para consulta.
            </p>
          )}
        </section>

        {/* ACT */}
        <section className="form-section detail-card">
          <h2>Act – padronizar ou ajustar</h2>

          {actMessage && (
            <div className="alert alert-success">{actMessage}</div>
          )}

          {!checkOK && (
            <div className="alert alert-error">
              Para acessar o Act, registre primeiro os resultados do Check.
            </div>
          )}

          <fieldset disabled={!checkOK || !isAtivo}>
            <label>
              Funcionou?
              <select
                value={actFuncionou}
                onChange={(e) => setActFuncionou(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="sim">Sim, funcionou</option>
                <option value="nao">Não funcionou</option>
              </select>
            </label>

            <label>
              Virou padrão? (descreva o novo padrão)
              <textarea
                value={actPadrao}
                onChange={(e) => setActPadrao(e.target.value)}
                rows={3}
                placeholder="Como deve ser feito daqui pra frente quando der certo?"
              />
            </label>

            <label>
              Lições aprendid
