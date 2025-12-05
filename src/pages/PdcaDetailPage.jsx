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

  // --- PLAN (Novos campos adicionados) ---
  const [prioridade, setPrioridade] = useState("");
  const [area, setArea] = useState("");
  const [meta, setMeta] = useState("");
  const [textoProblema, setTextoProblema] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  
  // Novos campos detalhados
  const [categoria, setCategoria] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [turno, setTurno] = useState("");
  const [tipoObjeto, setTipoObjeto] = useState("");
  const [descricaoObjeto, setDescricaoObjeto] = useState("");
  const [causas, setCausas] = useState(""); // Hipóteses
  const [planoAcao, setPlanoAcao] = useState(""); // O passo a passo
  const [indicadorReferencia, setIndicadorReferencia] = useState(""); // Indicador Antes (Plan)
  const [indicadorDesejado, setIndicadorDesejado] = useState(""); // Indicador Desejado (Plan)

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

  // carimbos de tempo
  const [doIniciadoEm, setDoIniciadoEm] = useState(null);
  const [checkIniciadoEm, setCheckIniciadoEm] = useState(null);
  const [actIniciadoEm, setActIniciadoEm] = useState(null);

  // Snapshots para botão "Cancelar"
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

          // --- PLAN (Mapeamento dos dados) ---
          const pPrioridade = plan.prioridade || "";
          const pArea = data.area || plan.area || ""; // Tenta pegar da raiz ou do plan
          const pMeta = plan.meta || "";
          const pProblema = plan.descricaoProblema || plan.problema || ""; // Compatibilidade com IA e Manual
          const pDataAlvo = plan.dataAlvo || "";
          
          const pCategoria = plan.categoria || "";
          const pResponsavel = data.responsavel || plan.responsavel || "";
          const pTurno = plan.turno || "";
          const pTipoObjeto = plan.tipoObjeto || "";
          const pDescricaoObjeto = plan.descricaoObjeto || "";
          const pCausas = plan.causas || "";
          const pPlanoAcao = plan.planoAcao || "";
          const pIndRef = plan.indicadorReferencia || "";
          const pIndDes = plan.indicadorDesejado || "";

          setPrioridade(pPrioridade);
          setArea(pArea);
          setMeta(pMeta);
          setTextoProblema(pProblema);
          setDataAlvo(pDataAlvo);
          setCategoria(pCategoria);
          setResponsavel(pResponsavel);
          setTurno(pTurno);
          setTipoObjeto(pTipoObjeto);
          setDescricaoObjeto(pDescricaoObjeto);
          setCausas(pCausas);
          setPlanoAcao(pPlanoAcao);
          setIndicadorReferencia(pIndRef);
          setIndicadorDesejado(pIndDes);

          setInitialPlan({
            prioridade: pPrioridade,
            area: pArea,
            meta: pMeta,
            textoProblema: pProblema,
            dataAlvo: pDataAlvo,
            categoria: pCategoria,
            responsavel: pResponsavel,
            turno: pTurno,
            tipoObjeto: pTipoObjeto,
            descricaoObjeto: pDescricaoObjeto,
            causas: pCausas,
            planoAcao: pPlanoAcao,
            indicadorReferencia: pIndRef,
            indicadorDesejado: pIndDes
          });

          // DO
          const dAcoes = doBlock.acoesRealizadas || "";
          const dQuem = doBlock.quemFez || "";
          const dQuando = doBlock.quandoFez || "";
          setDoAcoes(dAcoes);
          setDoQuem(dQuem);
          setDoQuando(dQuando);
          setInitialDo({ doAcoes: dAcoes, doQuem: dQuem, doQuando: dQuando });

          // CHECK
          const cAntes = checkBlock.indicadoresAntes || "";
          const cDepois = checkBlock.indicadoresDepois || "";
          const cObs = checkBlock.observacoes || "";
          setCheckAntes(cAntes);
          setCheckDepois(cDepois);
          setCheckObs(cObs);
          setInitialCheck({ checkAntes: cAntes, checkDepois: cDepois, checkObs: cObs });

          // ACT
          const aFunc = actBlock.funcionou === "sim" ? "sim" : actBlock.funcionou === "nao" ? "nao" : "";
          const aPadrao = actBlock.padrao || "";
          const aLicoes = actBlock.licoes || "";
          setActFuncionou(aFunc);
          setActPadrao(aPadrao);
          setActLicoes(aLicoes);
          setInitialAct({ actFuncionou: aFunc, actPadrao: aPadrao, actLicoes: aLicoes });

          // carimbos
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

    if (id) loadPdca();
  }, [id]);

  // --------- TRAVAS ENTRE ETAPAS ---------
  const planOK = textoProblema && textoProblema.trim() !== "";
  const doOK = planOK && ((doAcoes && doAcoes.trim() !== "") || (doQuem && doQuem.trim() !== "") || (doQuando && doQuando.trim() !== ""));
  const checkOK = doOK && ((checkAntes && checkAntes.trim() !== "") || (checkDepois && checkDepois.trim() !== "") || (checkObs && checkObs.trim() !== ""));
  const actOK = checkOK && actFuncionou && actFuncionou !== "";

  function calcularNovoStatus() {
    if (actFuncionou === "sim") return "Padronizado";
    const temCheck = (checkAntes && checkAntes.trim() !== "") || (checkDepois && checkDepois.trim() !== "") || (checkObs && checkObs.trim() !== "");
    const temDo = (doAcoes && doAcoes.trim() !== "") || (doQuem && doQuem.trim() !== "") || (doQuando && doQuando.trim() !== "");
    if (temCheck) return "Checando";
    if (temDo) return "Executando";
    return "Planejando";
  }

  // --------- SALVAR GENÉRICO ---------
  async function savePdcaCore() {
    if (!pdca) return;
    if ((pdca.situacao || "ativo") !== "ativo") return;

    setError("");
    const novoStatus = calcularNovoStatus();
    const agoraISO = new Date().toISOString();

    const prev = pdca || {};
    const prevDo = prev.do || {};
    const prevCheck = prev.check || {};
    const prevAct = prev.act || {};

    // Lógica de carimbo de tempo (mantida)
    const prevDoVazio = !prevDo.acoesRealizadas && !prevDo.quemFez && !prevDo.quandoFez;
    const agoraDoVazio = !doAcoes && !doQuem && !doQuando;
    const prevCheckVazio = !prevCheck.indicadoresAntes && !prevCheck.indicadoresDepois && !prevCheck.observacoes;
    const agoraCheckVazio = !checkAntes && !checkDepois && !checkObs;
    const prevActVazio = !prevAct.funcionou && !prevAct.padrao && !prevAct.licoes;
    const agoraActVazio = !actFuncionou && !actPadrao && !actLicoes;

    let novoDoIniciadoEm = doIniciadoEm;
    let novoCheckIniciadoEm = checkIniciadoEm;
    let novoActIniciadoEm = actIniciadoEm;

    if (prevDoVazio && !agoraDoVazio && !novoDoIniciadoEm) novoDoIniciadoEm = agoraISO;
    if (prevCheckVazio && !agoraCheckVazio && !novoCheckIniciadoEm) novoCheckIniciadoEm = agoraISO;
    if (prevActVazio && !agoraActVazio && !novoActIniciadoEm) novoActIniciadoEm = agoraISO;

    try {
      const ref = doc(db, "pdcas", pdca.id);
      await updateDoc(ref, {
        "plan.prioridade": prioridade,
        "plan.area": area,
        "plan.meta": meta,
        "plan.problema": textoProblema,
        "plan.dataAlvo": dataAlvo,
        // Novos campos salvos no PLAN
        "plan.categoria": categoria,
        "plan.responsavel": responsavel,
        "plan.turno": turno,
        "plan.tipoObjeto": tipoObjeto,
        "plan.descricaoObjeto": descricaoObjeto,
        "plan.causas": causas,
        "plan.planoAcao": planoAcao,
        "plan.indicadorReferencia": indicadorReferencia,
        "plan.indicadorDesejado": indicadorDesejado,
        
        // Atualiza raiz também para facilitar filtros
        "area": area, 
        "responsavel": responsavel,

        do: { acoesRealizadas: doAcoes, quemFez: doQuem, quandoFez: doQuando },
        check: { indicadoresAntes: checkAntes, indicadoresDepois: checkDepois, observacoes: checkObs },
        act: { funcionou: actFuncionou, padrao: actPadrao, licoes: actLicoes },

        status: novoStatus,
        atualizadoEm: agoraISO,
        ...(novoDoIniciadoEm && { doIniciadoEm: novoDoIniciadoEm }),
        ...(novoCheckIniciadoEm && { checkIniciadoEm: novoCheckIniciadoEm }),
        ...(novoActIniciadoEm && { actIniciadoEm: novoActIniciadoEm }),
      });

      setDoIniciadoEm(novoDoIniciadoEm);
      setCheckIniciadoEm(novoCheckIniciadoEm);
      setActIniciadoEm(novoActIniciadoEm);

      // Atualiza Initial Plan
      setInitialPlan({
        prioridade, area, meta, textoProblema, dataAlvo,
        categoria, responsavel, turno, tipoObjeto, descricaoObjeto,
        causas, planoAcao, indicadorReferencia, indicadorDesejado
      });
      setInitialDo({ doAcoes, doQuem, doQuando });
      setInitialCheck({ checkAntes, checkDepois, checkObs });
      setInitialAct({ actFuncionou, actPadrao, actLicoes });

      // Atualiza estado local
      setPdca((prev) => prev ? {
          ...prev,
          plan: { 
            ...prev.plan, prioridade, area, meta, problema: textoProblema, dataAlvo,
            categoria, responsavel, turno, tipoObjeto, descricaoObjeto, causas, planoAcao, indicadorReferencia, indicadorDesejado
          },
          area, // atualiza raiz
          responsavel, // atualiza raiz
          do: { acoesRealizadas: doAcoes, quemFez: doQuem, quandoFez: doQuando },
          check: { indicadoresAntes: checkAntes, indicadoresDepois: checkDepois, observacoes: checkObs },
          act: { funcionou: actFuncionou, padrao: actPadrao, licoes: actLicoes },
          status: novoStatus,
          atualizadoEm: agoraISO,
          doIniciadoEm: novoDoIniciadoEm,
          checkIniciadoEm: novoCheckIniciadoEm,
          actIniciadoEm: novoActIniciadoEm
      } : prev);

    } catch (e) {
      console.error(e);
      setError("Erro ao salvar alterações.");
    }
  }

  // --------- FUNÇÕES DE BOTÕES ---------
  const limparMensagensCards = () => {
    setPlanMessage(""); setDoMessage(""); setCheckMessage(""); setActMessage("");
  };

  const handleSavePlan = async () => {
    limparMensagensCards(); setSavingPlan(true); await savePdcaCore(); setSavingPlan(false); setPlanMessage("Dados do Plan atualizados.");
  };
  const handleSaveDo = async () => {
    if (!planOK) return; limparMensagensCards(); setSavingDo(true); await savePdcaCore(); setSavingDo(false); setDoMessage("Dados do Do atualizados.");
  };
  const handleSaveCheck = async () => {
    if (!doOK) return; limparMensagensCards(); setSavingCheck(true); await savePdcaCore(); setSavingCheck(false); setCheckMessage("Dados do Check atualizados.");
  };
  const handleSaveAct = async () => {
    if (!checkOK) return; limparMensagensCards(); setSavingAct(true); await savePdcaCore(); setSavingAct(false); setActMessage("Dados do Act atualizados.");
  };

  // Cancelar edições
  const handleCancelarPlan = () => {
    if (!initialPlan) return;
    setPrioridade(initialPlan.prioridade); setArea(initialPlan.area); setMeta(initialPlan.meta);
    setTextoProblema(initialPlan.textoProblema); setDataAlvo(initialPlan.dataAlvo);
    setCategoria(initialPlan.categoria); setResponsavel(initialPlan.responsavel); setTurno(initialPlan.turno);
    setTipoObjeto(initialPlan.tipoObjeto); setDescricaoObjeto(initialPlan.descricaoObjeto);
    setCausas(initialPlan.causas); setPlanoAcao(initialPlan.planoAcao);
    setIndicadorReferencia(initialPlan.indicadorReferencia); setIndicadorDesejado(initialPlan.indicadorDesejado);
    setPlanMessage("Edição cancelada.");
  };
  const handleCancelarDo = () => {
    if (!initialDo) return; setDoAcoes(initialDo.doAcoes); setDoQuem(initialDo.doQuem); setDoQuando(initialDo.doQuando); setDoMessage("Edição cancelada.");
  };
  const handleCancelarCheck = () => {
    if (!initialCheck) return; setCheckAntes(initialCheck.checkAntes); setCheckDepois(initialCheck.checkDepois); setCheckObs(initialCheck.checkObs); setCheckMessage("Edição cancelada.");
  };
  const handleCancelarAct = () => {
    if (!initialAct) return; setActFuncionou(initialAct.actFuncionou); setActPadrao(initialAct.actPadrao); setActLicoes(initialAct.actLicoes); setActMessage("Edição cancelada.");
  };

  // Ciclo de vida do projeto
  const handleReabrirCiclo = async () => {
    if (!pdca || actFuncionou !== "nao" || (pdca.situacao || "ativo") !== "ativo") return;
    setSavingProject(true);
    try {
      const agoraISO = new Date().toISOString();
      const novoCodigo = gerarCodigoPdca();
      const novoDoc = {
        codigo: novoCodigo, titulo: pdca.titulo || `Reabertura ${pdca.codigo}`, status: "Planejando", situacao: "ativo",
        plan: { ...pdca.plan }, do: null, check: null, act: null, criadoEm: agoraISO, atualizadoEm: agoraISO,
        cicloAnteriorId: pdca.id, cicloAnteriorCodigo: pdca.codigo
      };
      const refCol = collection(db, "pdcas");
      const novoRef = await addDoc(refCol, novoDoc);
      await updateDoc(doc(db, "pdcas", pdca.id), { cicloReabertoParaId: novoRef.id, cicloReabertoParaCodigo: novoCodigo });
      setGlobalMessage(`Novo ciclo criado: ${novoCodigo}.`);
    } catch (e) { setError("Erro ao reabrir ciclo."); } finally { setSavingProject(false); }
  };

  const canConcluir = planOK && doOK && checkOK && actOK;
  const handleConcluirProjeto = async () => {
    if (!pdca || (pdca.situacao || "ativo") !== "ativo" || !canConcluir || !window.confirm("Concluir projeto?")) return;
    setSavingProject(true);
    try {
      const agoraISO = new Date().toISOString();
      await updateDoc(doc(db, "pdcas", pdca.id), { situacao: "concluido", concluidoEm: agoraISO, atualizadoEm: agoraISO });
      setPdca(prev => ({ ...prev, situacao: "concluido", concluidoEm: agoraISO, atualizadoEm: agoraISO }));
      setGlobalMessage("Projeto concluído!");
    } catch (e) { setError("Erro ao concluir."); } finally { setSavingProject(false); }
  };

  const handleCancelarProjeto = async () => {
    if (!pdca || (pdca.situacao || "ativo") !== "ativo" || !window.confirm("Cancelar projeto?")) return;
    setSavingProject(true);
    try {
      const agoraISO = new Date().toISOString();
      await updateDoc(doc(db, "pdcas", pdca.id), { situacao: "cancelado", canceladoEm: agoraISO, atualizadoEm: agoraISO });
      setPdca(prev => ({ ...prev, situacao: "cancelado", canceladoEm: agoraISO, atualizadoEm: agoraISO }));
      setGlobalMessage("Projeto cancelado.");
    } catch (e) { setError("Erro ao cancelar."); } finally { setSavingProject(false); }
  };

  const handleExcluirProjeto = async () => {
    if (!pdca || !window.confirm("Excluir projeto permanentemente?")) return;
    setSavingProject(true);
    try { await deleteDoc(doc(db, "pdcas", pdca.id)); navigate("/dashboard"); } catch (e) { setError("Erro ao excluir."); setSavingProject(false); }
  };

  if (loading) return <div className="page">Carregando PDCA...</div>;
  if (!pdca) return <div className="page">{error || "PDCA não encontrado."}</div>;

  const situacao = pdca.situacao || "ativo";
  const isAtivo = situacao === "ativo";
  const situacaoLabel = situacao === "ativo" ? "Ativo" : situacao === "concluido" ? "Concluído" : "Cancelado";

  return (
    <div className="page">
      <div className="detail-header">
        <div>
          <h1 className="page-title">{pdca.codigo || pdca.id} — {pdca.titulo}</h1>
          <p className="detail-status">Status: {pdca.status} | Situação: {situacaoLabel}</p>
        </div>
        <div className="detail-actions">
          <button onClick={handleConcluirProjeto} disabled={savingProject || !canConcluir || !isAtivo} className="btn-primary">Concluir</button>
          <button onClick={handleCancelarProjeto} disabled={savingProject || !isAtivo} className="btn-secondary">Cancelar</button>
          <button onClick={handleExcluirProjeto} disabled={savingProject} className="btn-danger">Excluir</button>
        </div>
      </div>

      {!isAtivo && <div className="alert">PDCA <strong>{situacaoLabel}</strong>. Modo somente leitura.</div>}
      {globalMessage && <div className="alert">{globalMessage}</div>}
      {error && !loading && <div className="alert alert-error">{error}</div>}

      {/* GRID: PLAN | DO */}
      <div className="detail-grid">
        {/* PLAN - CARD EXPANDIDO */}
        <section className="form-section detail-card">
          <h2>Plan – problema e contexto</h2>
          {planMessage && <div className="alert alert-success">{planMessage}</div>}

          {/* INFORMAÇÕES GERAIS */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
             <label>Categoria
               <select value={categoria} onChange={e => setCategoria(e.target.value)} disabled={!isAtivo}>
                  <option value="">Selecione...</option>
                  <option value="Quebra / perda de produto">Quebra / perda de produto</option>
                  <option value="Atraso / tempo">Atraso / tempo</option>
                  <option value="Comunicação / alinhamento">Comunicação / alinhamento</option>
                  <option value="Organização / processo">Organização / processo</option>
                  <option value="Segurança / risco">Segurança / risco</option>
                  <option value="Outro">Outro</option>
               </select>
             </label>
             <label>Prioridade
               <select value={prioridade} onChange={e => setPrioridade(e.target.value)} disabled={!isAtivo}>
                 <option value="">Selecione...</option>
                 <option value="Crítica">Crítica</option>
                 <option value="Alta">Alta</option>
                 <option value="Média">Média</option>
                 <option value="Baixa">Baixa</option>
               </select>
             </label>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <label>Área
              <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="Expedição..." disabled={!isAtivo} />
            </label>
            <label>Responsável
               <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome..." disabled={!isAtivo} />
            </label>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
             <label>Turno
               <input type="text" value={turno} onChange={e => setTurno(e.target.value)} placeholder="Dia/Noite..." disabled={!isAtivo} />
             </label>
             <label>Data Alvo
               <input type="date" value={dataAlvo} onChange={e => setDataAlvo(e.target.value)} disabled={!isAtivo} />
             </label>
          </div>
          
          <hr style={{margin: '15px 0', border: '0', borderTop: '1px solid #eee'}}/>

          {/* OBJETO DO PROBLEMA */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px'}}>
            <label>Tipo Objeto
              <input type="text" value={tipoObjeto} onChange={e => setTipoObjeto(e.target.value)} placeholder="Produto, Máquina..." disabled={!isAtivo} />
            </label>
            <label>Descrição Objeto
              <input type="text" value={descricaoObjeto} onChange={e => setDescricaoObjeto(e.target.value)} placeholder="Ex: Tomate Débora..." disabled={!isAtivo} />
            </label>
          </div>

          <label>Problema (Descrição)
            <textarea value={textoProblema} onChange={e => setTextoProblema(e.target.value)} rows={3} placeholder="Descreva o problema..." disabled={!isAtivo} />
          </label>

          {/* ANÁLISE E AÇÃO */}
          <label>Causas (Hipóteses)
             <textarea value={causas} onChange={e => setCausas(e.target.value)} rows={3} placeholder="Quais as prováveis causas?" disabled={!isAtivo} />
          </label>

          <label>Meta
            <input type="text" value={meta} onChange={e => setMeta(e.target.value)} placeholder="Ex: Reduzir de X para Y..." disabled={!isAtivo} />
          </label>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
             <label>Indicador Referência (Antes)
               <input type="text" value={indicadorReferencia} onChange={e => setIndicadorReferencia(e.target.value)} placeholder="Ex: 8% atual" disabled={!isAtivo} />
             </label>
             <label>Indicador Desejado (Meta)
               <input type="text" value={indicadorDesejado} onChange={e => setIndicadorDesejado(e.target.value)} placeholder="Ex: 4% alvo" disabled={!isAtivo} />
             </label>
          </div>

          <label>Plano de Ação (Planejado)
             <textarea value={planoAcao} onChange={e => setPlanoAcao(e.target.value)} rows={4} placeholder="O que será feito? (Passo a passo planejado)" disabled={!isAtivo} />
          </label>

          {isAtivo ? (
            <div className="section-actions">
              <button type="button" className="btn-secondary" onClick={handleCancelarPlan} disabled={savingPlan}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSavePlan} disabled={savingPlan}>{savingPlan ? "Salvando..." : "Salvar Plan"}</button>
            </div>
          ) : <p className="section-readonly-hint">Plan apenas leitura.</p>}
        </section>

        {/* DO */}
        <section className="form-section detail-card">
          <h2>Do – execução</h2>
          {doMessage && <div className="alert alert-success">{doMessage}</div>}
          {!planOK && <div className="alert alert-error">Preencha o problema no Plan antes.</div>}

          <fieldset disabled={!planOK || !isAtivo}>
            <label>Ações realizadas (Prática)
              <textarea value={doAcoes} onChange={e => setDoAcoes(e.target.value)} rows={4} placeholder="O que foi realmente executado?" />
            </label>
            <label>Quem fez
              <input type="text" value={doQuem} onChange={e => setDoQuem(e.target.value)} placeholder="Responsável pela execução" />
            </label>
            <label>Quando fez
              <input type="date" value={doQuando} onChange={e => setDoQuando(e.target.value)} />
            </label>
          </fieldset>

          {isAtivo ? (
            <div className="section-actions">
              <button type="button" className="btn-secondary" onClick={handleCancelarDo} disabled={savingDo}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSaveDo} disabled={savingDo || !planOK}>{savingDo ? "Salvando..." : "Salvar Do"}</button>
            </div>
          ) : <p className="section-readonly-hint">Do apenas leitura.</p>}
        </section>
      </div>

      {/* GRID: CHECK | ACT */}
      <div className="detail-grid">
        {/* CHECK */}
        <section className="form-section detail-card">
          <h2>Check – resultados</h2>
          {checkMessage && <div className="alert alert-success">{checkMessage}</div>}
          {!doOK && <div className="alert alert-error">Finalize o Do para acessar o Check.</div>}

          <fieldset disabled={!doOK || !isAtivo}>
            <label>Indicadores Antes (Medição Real)
              <textarea value={checkAntes} onChange={e => setCheckAntes(e.target.value)} rows={2} placeholder="Resultado medido antes..." />
            </label>
            <label>Indicadores Depois (Medição Real)
              <textarea value={checkDepois} onChange={e => setCheckDepois(e.target.value)} rows={2} placeholder="Resultado medido depois..." />
            </label>
            <label>Observações
              <textarea value={checkObs} onChange={e => setCheckObs(e.target.value)} rows={3} placeholder="Comparação e análise..." />
            </label>
          </fieldset>

          {isAtivo ? (
            <div className="section-actions">
              <button type="button" className="btn-secondary" onClick={handleCancelarCheck} disabled={savingCheck}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSaveCheck} disabled={savingCheck || !doOK}>{savingCheck ? "Salvando..." : "Salvar Check"}</button>
            </div>
          ) : <p className="section-readonly-hint">Check apenas leitura.</p>}
        </section>

        {/* ACT */}
        <section className="form-section detail-card">
          <h2>Act – padronizar ou ajustar</h2>
          {actMessage && <div className="alert alert-success">{actMessage}</div>}
          {!checkOK && <div className="alert alert-error">Registre o Check para acessar o Act.</div>}

          <fieldset disabled={!checkOK || !isAtivo}>
            <label>Funcionou?
              <select value={actFuncionou} onChange={e => setActFuncionou(e.target.value)}>
                <option value="">Selecione</option>
                <option value="sim">Sim, funcionou</option>
                <option value="nao">Não funcionou</option>
              </select>
            </label>
            <label>Virou padrão? (Novo procedimento)
              <textarea value={actPadrao} onChange={e => setActPadrao(e.target.value)} rows={3} placeholder="Como deve ser feito daqui pra frente?" />
            </label>
            <label>Lições aprendidas
              <textarea value={actLicoes} onChange={e => setActLicoes(e.target.value)} rows={3} placeholder="O que aprendemos?" />
            </label>
          </fieldset>

          {checkOK && actFuncionou === "nao" && isAtivo && (
            <div style={{ marginTop: "12px" }}>
              <button type="button" className="btn-secondary" onClick={handleReabrirCiclo} disabled={savingProject}>
                {savingProject ? "Processando..." : "Abrir novo ciclo (Reiniciar)"}
              </button>
            </div>
          )}

          {isAtivo ? (
            <div className="section-actions">
              <button type="button" className="btn-secondary" onClick={handleCancelarAct} disabled={savingAct}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={handleSaveAct} disabled={savingAct || !checkOK}>{savingAct ? "Salvando..." : "Salvar Act"}</button>
            </div>
          ) : <p className="section-readonly-hint">Act apenas leitura.</p>}
        </section>
      </div>
    </div>
  );
}