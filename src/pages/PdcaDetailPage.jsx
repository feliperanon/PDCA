import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export function PdcaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pdca, setPdca] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- CONTROLE VISUAL ---
  const [isEditingContext, setIsEditingContext] = useState(false);

  // saving separado
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingDo, setSavingDo] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);
  const [savingAct, setSavingAct] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const [error, setError] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");

  // mensagens por card
  const [planMessage, setPlanMessage] = useState("");
  const [doMessage, setDoMessage] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [actMessage, setActMessage] = useState("");

  // --- PLAN (Removidos Responsavel e Turno) ---
  const [prioridade, setPrioridade] = useState("");
  const [area, setArea] = useState("");
  const [meta, setMeta] = useState("");
  const [textoProblema, setTextoProblema] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  
  const [categoria, setCategoria] = useState("");
  const [tipoObjeto, setTipoObjeto] = useState("");
  const [descricaoObjeto, setDescricaoObjeto] = useState("");
  const [causas, setCausas] = useState("");
  const [planoAcao, setPlanoAcao] = useState("");
  const [indicadorReferencia, setIndicadorReferencia] = useState("");
  const [indicadorDesejado, setIndicadorDesejado] = useState("");

  // DO
  const [doAcoes, setDoAcoes] = useState("");
  const [doQuem, setDoQuem] = useState("");
  const [doQuando, setDoQuando] = useState("");

  // CHECK
  const [checkAntes, setCheckAntes] = useState("");
  const [checkDepois, setCheckDepois] = useState("");
  const [checkObs, setCheckObs] = useState("");

  // ACT
  const [actFuncionou, setActFuncionou] = useState("");
  const [actPadrao, setActPadrao] = useState("");
  const [actLicoes, setActLicoes] = useState("");

  // carimbos
  const [doIniciadoEm, setDoIniciadoEm] = useState(null);
  const [checkIniciadoEm, setCheckIniciadoEm] = useState(null);
  const [actIniciadoEm, setActIniciadoEm] = useState(null);

  // Snapshots
  const [initialPlan, setInitialPlan] = useState(null);
  const [initialDo, setInitialDo] = useState(null);
  const [initialCheck, setInitialCheck] = useState(null);
  const [initialAct, setInitialAct] = useState(null);

  // --- REGRA DE NEGÓCIO: DATAS ---
  const calcularDataPorPrioridade = (novaPrioridade) => {
    const hoje = new Date();
    let dias = 7; // Baixa
    if (novaPrioridade === 'Crítica') dias = 4;
    else if (novaPrioridade === 'Alta') dias = 5;
    else if (novaPrioridade === 'Média') dias = 6;
    
    hoje.setDate(hoje.getDate() + dias);
    return hoje.toISOString().split('T')[0];
  };

  const handlePrioridadeChange = (e) => {
    const novaPrio = e.target.value;
    setPrioridade(novaPrio);
    // Recalcula data automaticamente ao mudar prioridade
    setDataAlvo(calcularDataPorPrioridade(novaPrio));
  };

  useEffect(() => {
    async function loadPdca() {
      setLoading(true);
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
          setPrioridade(plan.prioridade || "Baixa");
          setArea(data.area || plan.area || "");
          setMeta(plan.meta || "");
          setTextoProblema(plan.descricaoProblema || plan.problema || "");
          setDataAlvo(plan.dataAlvo || "");
          setCategoria(plan.categoria || "");
          setTipoObjeto(plan.tipoObjeto || "");
          setDescricaoObjeto(plan.descricaoObjeto || "");
          setCausas(plan.causas || "");
          setPlanoAcao(plan.planoAcao || "");
          setIndicadorReferencia(plan.indicadorReferencia || "");
          setIndicadorDesejado(plan.indicadorDesejado || "");

          setInitialPlan({
            prioridade: plan.prioridade, area: data.area, meta: plan.meta,
            textoProblema: plan.descricaoProblema, dataAlvo: plan.dataAlvo,
            categoria: plan.categoria,
            tipoObjeto: plan.tipoObjeto, descricaoObjeto: plan.descricaoObjeto,
            causas: plan.causas, planoAcao: plan.planoAcao,
            indicadorReferencia: plan.indicadorReferencia, indicadorDesejado: plan.indicadorDesejado
          });

          // DO
          setDoAcoes(doBlock.acoesRealizadas || "");
          setDoQuem(doBlock.quemFez || "");
          setDoQuando(doBlock.quandoFez || "");
          setInitialDo({ doAcoes: doBlock.acoesRealizadas, doQuem: doBlock.quemFez, doQuando: doBlock.quandoFez });

          // CHECK
          setCheckAntes(checkBlock.indicadoresAntes || "");
          setCheckDepois(checkBlock.indicadoresDepois || "");
          setCheckObs(checkBlock.observacoes || "");
          setInitialCheck({ checkAntes: checkBlock.indicadoresAntes, checkDepois: checkBlock.indicadoresDepois, checkObs: checkBlock.observacoes });

          // ACT
          setActFuncionou(actBlock.funcionou === "sim" ? "sim" : actBlock.funcionou === "nao" ? "nao" : "");
          setActPadrao(actBlock.padrao || "");
          setActLicoes(actBlock.licoes || "");
          setInitialAct({ actFuncionou: actBlock.funcionou, actPadrao: actBlock.padrao, actLicoes: actBlock.licoes });

          // Carimbos
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

  // Trava
  const planOK = textoProblema && textoProblema.trim() !== "";
  const doOK = planOK && ((doAcoes && doAcoes.trim() !== "") || (doQuem && doQuem.trim() !== "") || (doQuando && doQuando.trim() !== ""));
  const checkOK = doOK && ((checkAntes && checkAntes.trim() !== "") || (checkDepois && checkDepois.trim() !== "") || (checkObs && checkObs.trim() !== ""));
  const actOK = checkOK && actFuncionou && actFuncionou !== "";

  // --- FUNÇÃO CENTRAL DE SALVAR ---
  async function savePdcaCore(sectionToUpdate) {
    if (!pdca || (pdca.situacao || "ativo") !== "ativo") return;
    setError("");
    
    // Calcula status
    let novoStatus = "Planejando";
    const temDo = doAcoes || doQuem || doQuando;
    const temCheck = checkAntes || checkDepois || checkObs;
    if (actFuncionou === "sim") novoStatus = "Padronizado";
    else if (temCheck) novoStatus = "Checando";
    else if (temDo) novoStatus = "Executando";

    const agoraISO = new Date().toISOString();
    let novoDoIniciadoEm = doIniciadoEm;
    if (!doIniciadoEm && temDo) novoDoIniciadoEm = agoraISO;

    try {
      const ref = doc(db, "pdcas", pdca.id);
      
      // 1. Atualiza no Banco de Dados (Sem Responsavel/Turno)
      await updateDoc(ref, {
        "plan.prioridade": prioridade, "plan.area": area, "plan.meta": meta,
        "plan.problema": textoProblema, "plan.dataAlvo": dataAlvo,
        "plan.categoria": categoria,
        "plan.tipoObjeto": tipoObjeto,
        "plan.descricaoObjeto": descricaoObjeto, "plan.causas": causas,
        "plan.planoAcao": planoAcao, "plan.indicadorReferencia": indicadorReferencia,
        "plan.indicadorDesejado": indicadorDesejado,
        "area": area, // raiz
        
        do: { acoesRealizadas: doAcoes, quemFez: doQuem, quandoFez: doQuando },
        check: { indicadoresAntes: checkAntes, indicadoresDepois: checkDepois, observacoes: checkObs },
        act: { funcionou: actFuncionou, padrao: actPadrao, licoes: actLicoes },
        status: novoStatus, atualizadoEm: agoraISO,
        ...(novoDoIniciadoEm && { doIniciadoEm: novoDoIniciadoEm })
      });
      
      // 2. Atualiza Local
      setPdca(prev => ({
          ...prev, 
          status: novoStatus, 
          atualizadoEm: agoraISO, 
          doIniciadoEm: novoDoIniciadoEm,
          area: area,
          plan: {
             ...prev.plan,
             prioridade, area, meta, problema: textoProblema, dataAlvo,
             categoria, tipoObjeto, descricaoObjeto,
             causas, planoAcao, indicadorReferencia, indicadorDesejado
          }
      }));

      // 3. Atualiza Snapshot
      if (sectionToUpdate === 'context' || sectionToUpdate === 'plan') {
         setInitialPlan({
           prioridade, area, meta, textoProblema, dataAlvo,
           categoria, tipoObjeto, descricaoObjeto,
           causas, planoAcao, indicadorReferencia, indicadorDesejado
         });
         
         if(sectionToUpdate === 'context') {
             setIsEditingContext(false);
         }
      }
      
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar.");
    }
  }

  // Handlers
  const handleSaveContext = async () => { setSavingPlan(true); await savePdcaCore('context'); setSavingPlan(false); };
  const handleSavePlan = async () => { setSavingPlan(true); await savePdcaCore('plan'); setSavingPlan(false); setPlanMessage("Dados atualizados."); };
  const handleSaveDo = async () => { setSavingDo(true); await savePdcaCore(); setSavingDo(false); setDoMessage("Dados atualizados."); };
  const handleSaveCheck = async () => { setSavingCheck(true); await savePdcaCore(); setSavingCheck(false); setCheckMessage("Dados atualizados."); };
  const handleSaveAct = async () => { setSavingAct(true); await savePdcaCore(); setSavingAct(false); setActMessage("Dados atualizados."); };

  // Cancelar (Contexto)
  const handleCancelarContext = () => {
    if(!initialPlan) return;
    setCategoria(initialPlan.categoria || ""); 
    setPrioridade(initialPlan.prioridade || ""); 
    setArea(initialPlan.area || "");
    setDataAlvo(initialPlan.dataAlvo || "");
    setTipoObjeto(initialPlan.tipoObjeto || ""); 
    setDescricaoObjeto(initialPlan.descricaoObjeto || "");
    setIsEditingContext(false);
  };
  
  const handleCancelarPlan = () => {
    if(!initialPlan) return;
    setTextoProblema(initialPlan.textoProblema || "");
    setCausas(initialPlan.causas || "");
    setIndicadorReferencia(initialPlan.indicadorReferencia || "");
    setIndicadorDesejado(initialPlan.indicadorDesejado || "");
    setMeta(initialPlan.meta || "");
    setPlanoAcao(initialPlan.planoAcao || "");
  };

  const handleConcluirProjeto = async () => {
      if (!pdca || !window.confirm("Concluir projeto?")) return;
      setSavingProject(true);
      try {
        const agoraISO = new Date().toISOString();
        await updateDoc(doc(db, "pdcas", pdca.id), { situacao: "concluido", concluidoEm: agoraISO, atualizadoEm: agoraISO });
        setPdca(prev => ({ ...prev, situacao: "concluido", concluidoEm: agoraISO, atualizadoEm: agoraISO }));
        setGlobalMessage("Projeto concluído!");
      } catch (e) { setError("Erro ao concluir."); } finally { setSavingProject(false); }
  };

  const handleCancelarProjeto = async () => {
      if (!pdca || !window.confirm("Cancelar projeto?")) return;
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

  if (loading) return <div className="page">Carregando...</div>;
  if (!pdca) return <div className="page">PDCA não encontrado.</div>;

  const isAtivo = (pdca.situacao || "ativo") === "ativo";

  return (
    <div className="page">
      <div className="detail-header">
        <div>
          <h1 className="page-title">{pdca.codigo || pdca.id}</h1>
          <h2 style={{margin: '5px 0', fontSize: '1.2rem', color: '#555'}}>{pdca.titulo}</h2>
          <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
             <span className="status-badge">{pdca.status}</span>
             <span className={`status-badge ${isAtivo ? 'badge-alta' : 'badge-critica'}`} style={{background: isAtivo ? '#e6fffa' : '#fff5f5'}}>
                {isAtivo ? '🟢 Em Andamento' : '🔴 Encerrado'}
             </span>
          </div>
        </div>
        <div className="detail-actions">
           {isAtivo && <button onClick={handleConcluirProjeto} disabled={savingProject || !actOK} className="btn-primary" style={{marginRight: 5}}>Concluir</button>}
           {isAtivo && <button onClick={handleCancelarProjeto} disabled={savingProject} className="btn-secondary" style={{marginRight: 5}}>Encerrar</button>}
           <button onClick={handleExcluirProjeto} disabled={savingProject} className="btn-danger">Excluir</button>
        </div>
      </div>

      {globalMessage && <div className="alert">{globalMessage}</div>}

      {/* SEÇÃO CONTEXTO */}
      <section className="context-section">
        <div className="context-header">
          <h3>📋 Contexto & Informações Gerais</h3>
          {isAtivo && (
            <button 
              className="btn-text-edit"
              onClick={() => setIsEditingContext(!isEditingContext)}
            >
              {isEditingContext ? "Cancelar Edição" : "✏️ Editar Contexto"}
            </button>
          )}
        </div>

        {!isEditingContext ? (
          <div className="context-grid-visual">
             <div className="ctx-item"><label>Categoria</label><strong>{categoria || "-"}</strong></div>
             <div className="ctx-item"><label>Prioridade</label><span className={`badge-${prioridade?.toLowerCase()}`}>{prioridade || "-"}</span></div>
             <div className="ctx-item"><label>Área</label><strong>{area || "-"}</strong></div>
             {/* CAMPOS REMOVIDOS AQUI */}
             <div className="ctx-item"><label>Data Alvo</label><strong>{dataAlvo ? new Date(dataAlvo).toLocaleDateString('pt-BR') : "-"}</strong></div>
             
             <div className="ctx-item ctx-full">
                <label>Objeto do Problema</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <span style={{fontWeight: 'bold', color: '#444'}}>{tipoObjeto || "N/A"}:</span>
                  <span>{descricaoObjeto || "-"}</span>
                </div>
             </div>
          </div>
        ) : (
          <div className="context-edit-form animate-fade-in">
             <div className="form-grid-3">
                <label>Categoria
                   <select value={categoria} onChange={e => setCategoria(e.target.value)}>
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
                   {/* AO MUDAR PRIORIDADE, CHAMA A LÓGICA DE DATA */}
                   <select value={prioridade} onChange={handlePrioridadeChange}>
                      <option value="Crítica">Crítica (4 dias)</option>
                      <option value="Alta">Alta (5 dias)</option>
                      <option value="Média">Média (6 dias)</option>
                      <option value="Baixa">Baixa (7 dias)</option>
                   </select>
                </label>
                <label>Data Alvo <input type="date" value={dataAlvo} onChange={e => setDataAlvo(e.target.value)} /></label>
             </div>
             <div className="form-grid-3">
                <label>Área <input value={area} onChange={e => setArea(e.target.value)} /></label>
             </div>
             <div className="form-grid-2">
                <label>Tipo Objeto <input value={tipoObjeto} onChange={e => setTipoObjeto(e.target.value)} /></label>
                <label>Desc. Objeto <input value={descricaoObjeto} onChange={e => setDescricaoObjeto(e.target.value)} /></label>
             </div>
             <div className="section-actions" style={{marginTop: '15px'}}>
               <button type="button" className="btn-secondary" onClick={handleCancelarContext}>Cancelar</button>
               <button type="button" className="btn-primary" onClick={handleSaveContext} disabled={savingPlan}>{savingPlan ? "Salvando..." : "Salvar Contexto"}</button>
             </div>
          </div>
        )}
      </section>

      {/* GRID PDCA */}
      <div className="pdca-cycle-grid">
        <section className="form-section detail-card plan-card">
          <div className="card-header-styled"><h2>Plan – Análise</h2></div>
          {planMessage && <div className="alert alert-success">{planMessage}</div>}
          <div className="card-content">
             <label>Descrição do Problema <textarea value={textoProblema} onChange={e => setTextoProblema(e.target.value)} rows={3} disabled={!isAtivo} /></label>
             <label>Causas (Hipóteses) <textarea value={causas} onChange={e => setCausas(e.target.value)} rows={3} disabled={!isAtivo} /></label>
             <div className="form-grid-2">
                <label>Indicador Antes <input value={indicadorReferencia} onChange={e => setIndicadorReferencia(e.target.value)} placeholder="Ref..." disabled={!isAtivo} /></label>
                <label>Indicador Meta <input value={indicadorDesejado} onChange={e => setIndicadorDesejado(e.target.value)} placeholder="Alvo..." disabled={!isAtivo} /></label>
             </div>
             <label>Meta (Descritiva) <input value={meta} onChange={e => setMeta(e.target.value)} disabled={!isAtivo} /></label>
             <label>Plano de Ação <textarea value={planoAcao} onChange={e => setPlanoAcao(e.target.value)} rows={4} disabled={!isAtivo} /></label>
             {isAtivo && 
                <div className="section-actions">
                   <button type="button" className="btn-secondary" onClick={handleCancelarPlan} disabled={savingPlan}>Cancelar</button>
                   <button type="button" className="btn-primary" onClick={handleSavePlan} disabled={savingPlan}>{savingPlan ? "Salvando..." : "Salvar Plan"}</button>
                </div>
             }
          </div>
        </section>

        <section className="form-section detail-card do-card">
          <div className="card-header-styled"><h2>Do – Execução</h2></div>
          {doMessage && <div className="alert alert-success">{doMessage}</div>}
          <div className="card-content">
            <fieldset disabled={!planOK || !isAtivo} style={{border:'none', padding:0, margin:0}}>
              <label>Ações Realizadas <textarea value={doAcoes} onChange={e => setDoAcoes(e.target.value)} rows={6}/></label>
              <div className="form-grid-2">
                 <label>Quem <input value={doQuem} onChange={e => setDoQuem(e.target.value)} /></label>
                 <label>Quando <input type="date" value={doQuando} onChange={e => setDoQuando(e.target.value)} /></label>
              </div>
            </fieldset>
            {isAtivo && <button className="btn-primary full-width" onClick={handleSaveDo} disabled={savingDo || !planOK}>{savingDo ? "Salvando..." : "Salvar Do"}</button>}
          </div>
        </section>

        <section className="form-section detail-card check-card">
          <div className="card-header-styled"><h2>Check – Resultados</h2></div>
          {checkMessage && <div className="alert alert-success">{checkMessage}</div>}
          <div className="card-content">
            <fieldset disabled={!doOK || !isAtivo} style={{border:'none', padding:0, margin:0}}>
              <label>Antes (Medição) <input value={checkAntes} onChange={e => setCheckAntes(e.target.value)} /></label>
              <label>Depois (Medição) <input value={checkDepois} onChange={e => setCheckDepois(e.target.value)} /></label>
              <label>Observações <textarea value={checkObs} onChange={e => setCheckObs(e.target.value)} rows={3} /></label>
            </fieldset>
            {isAtivo && <button className="btn-primary full-width" onClick={handleSaveCheck} disabled={savingCheck || !doOK}>{savingCheck ? "Salvando..." : "Salvar Check"}</button>}
          </div>
        </section>

        <section className="form-section detail-card act-card">
          <div className="card-header-styled"><h2>Act – Conclusão</h2></div>
          {actMessage && <div className="alert alert-success">{actMessage}</div>}
          <div className="card-content">
            <fieldset disabled={!checkOK || !isAtivo} style={{border:'none', padding:0, margin:0}}>
              <label>Funcionou? 
                 <select value={actFuncionou} onChange={e => setActFuncionou(e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                 </select>
              </label>
              <label>Padrão / Ajustes <textarea value={actPadrao} onChange={e => setActPadrao(e.target.value)} rows={3} /></label>
              <label>Lições Aprendidas <textarea value={actLicoes} onChange={e => setActLicoes(e.target.value)} rows={3} /></label>
            </fieldset>
            {isAtivo && <button className="btn-primary full-width" onClick={handleSaveAct} disabled={savingAct || !checkOK}>{savingAct ? "Salvando..." : "Salvar Act"}</button>}
          </div>
        </section>
      </div>

      <style>{`
        .context-section { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
        .context-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #e9ecef; padding-bottom: 10px; }
        .context-header h3 { margin: 0; font-size: 1.1rem; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-text-edit { background: none; border: none; color: #667eea; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
        .btn-text-edit:hover { text-decoration: underline; }
        .context-grid-visual { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
        .ctx-item label { display: block; font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 4px; }
        .ctx-item strong { font-size: 1rem; color: #212529; }
        .ctx-full { grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e9ecef; }
        .pdca-cycle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .pdca-cycle-grid { grid-template-columns: 1fr; } }
        .detail-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; display: flex; flex-direction: column; height: 100%; }
        .plan-card { border-top: 4px solid #3b82f6; }
        .do-card { border-top: 4px solid #f59e0b; }
        .check-card { border-top: 4px solid #10b981; }
        .act-card { border-top: 4px solid #8b5cf6; }
        .card-header-styled { padding: 15px; border-bottom: 1px solid #f0f0f0; background: #fdfdfd; }
        .card-header-styled h2 { margin: 0; font-size: 1.1rem; color: #333; }
        .card-content { padding: 20px; flex-grow: 1; }
        .full-width { width: 100%; margin-top: 15px; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .section-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px; }
      `}</style>
    </div>
  );
}