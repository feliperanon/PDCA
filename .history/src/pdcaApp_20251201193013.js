// src/pdcaApp.js
// Módulo principal da aplicação PDCA (tudo que antes estava no main.js)

import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import Chart from "chart.js/auto";

let graficoStatus = null;
let ultimoMapaArea = {};

// Mapeia prioridade para classe CSS (para badge de cor)
function mapPrioridadeClasse(prioridade) {
  if (!prioridade) return "";
  const p = prioridade.toLowerCase();
  if (p.includes("baixa")) return "baixa";
  if (p.includes("média") || p.includes("media")) return "media";
  if (p.includes("alta")) return "alta";
  if (p.includes("crítica") || p.includes("critica")) return "critica";
  return "";
}

// Gera código tipo PDCA-2025-1234
function gerarCodigoPdca() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const sufixo = String(agora.getTime()).slice(-4);
  return `PDCA-${ano}-${sufixo}`;
}

// Função que INICIALIZA toda a app (antes isso estava no window.addEventListener)
export function initPdcaApp() {
  // Áreas
  const loginArea = document.getElementById("login-area");
  const appArea = document.getElementById("app-area");

  // Login
  const inputEmail = document.getElementById("login-email");
  const inputSenha = document.getElementById("login-senha");
  const btnLogar = document.getElementById("btn-logar");
  const btnCriarConta = document.getElementById("btn-criar-conta");
  const btnSair = document.getElementById("btn-sair");

  // Etapas
  const selectEtapa = document.getElementById("etapa");
  const sectionPlan = document.getElementById("section-plan");
  const sectionDo = document.getElementById("section-do");
  const sectionCheck = document.getElementById("section-check");
  const sectionAct = document.getElementById("section-act");

  // Plan
  const formPlan = document.getElementById("form-plan");
  const planTitulo = document.getElementById("plan-titulo");
  const planCategoria = document.getElementById("plan-categoria");
  const planArea = document.getElementById("plan-area");

  // Campos de gestão
  const planPrioridade = document.getElementById("plan-prioridade");
  const planResponsavel = document.getElementById("plan-responsavel");
  const planTimeTurno = document.getElementById("plan-time-turno");
  const planDataAlvo = document.getElementById("plan-data-alvo");
  const planTipoObjeto = document.getElementById("plan-tipo-objeto");
  const planDescricaoObjeto = document.getElementById("plan-descricao-objeto");

  // Conteúdo do Plan
  const planProblema = document.getElementById("plan-problema");
  const planCausas = document.getElementById("plan-causas");
  const planMeta = document.getElementById("plan-meta");
  const planIndicadorRef = document.getElementById("plan-indicador-referencia");
  const planIndicadorDesej = document.getElementById(
    "plan-indicador-desejado"
  );
  const planPlanoAcao = document.getElementById("plan-plano-acao");

  // Do
  const formDo = document.getElementById("form-do");
  const selectDoPdca = document.getElementById("do-pdca-select");
  const doResumoPlan = document.getElementById("do-resumo-plan");
  const doAcoes = document.getElementById("do-acoes");
  const doQuem = document.getElementById("do-quem");
  const doQuando = document.getElementById("do-quando");

  // Check
  const formCheck = document.getElementById("form-check");
  const selectCheckPdca = document.getElementById("check-pdca-select");
  const checkResumo = document.getElementById("check-resumo-plan-do");
  const checkIndicAntes = document.getElementById("check-indicadores-antes");
  const checkIndicDepois = document.getElementById("check-indicadores-depois");
  const checkObs = document.getElementById("check-observacoes");

  // Act
  const formAct = document.getElementById("form-act");
  const selectActPdca = document.getElementById("act-pdca-select");
  const actResumo = document.getElementById("act-resumo-completo");
  const actFuncionou = document.getElementById("act-funcionou");
  const actPadrao = document.getElementById("act-padrao");
  const actLicoes = document.getElementById("act-licoes");

  // Lista + dashboards + detalhe
  const listaPdca = document.getElementById("pdca-list");
  const canvasGrafico = document.getElementById("grafico-status");
  const tabelaPrioridades = document.getElementById("tabela-prioridades");
  const resumoTopAreas = document.getElementById("resumo-top-areas");
  const filtroPrioridade = document.getElementById("filtro-prioridade");
  const pdcaDetalhe = document.getElementById("pdca-detalhe");

  // NOVO: dashboard por responsável
  const resumoResponsaveis = document.getElementById("resumo-responsaveis");
  const tabelaResponsaveis = document.getElementById("tabela-responsaveis");

  function mostrarApp() {
    loginArea.style.display = "none";
    appArea.style.display = "block";
  }

  function esconderApp() {
    loginArea.style.display = "block";
    appArea.style.display = "none";
  }

  function atualizarVisibilidadeEtapas() {
    const etapa = selectEtapa.value;
    sectionPlan.style.display = etapa === "plan" ? "block" : "none";
    sectionDo.style.display = etapa === "do" ? "block" : "none";
    sectionCheck.style.display = etapa === "check" ? "block" : "none";
    sectionAct.style.display = etapa === "act" ? "block" : "none";
  }

  selectEtapa.addEventListener("change", atualizarVisibilidadeEtapas);
  atualizarVisibilidadeEtapas();

  // ---------- LOGIN ----------
  btnLogar.onclick = async () => {
    try {
      await signInWithEmailAndPassword(auth, inputEmail.value, inputSenha.value);
    } catch (e) {
      alert("Erro ao fazer login: " + e.message);
    }
  };

  btnCriarConta.onclick = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        inputEmail.value,
        inputSenha.value
      );
      alert("Conta criada! Agora faça login.");
    } catch (e) {
      alert("Erro ao criar conta: " + e.message);
    }
  };

  btnSair.onclick = () => {
    signOut(auth);
  };

  // ---------- MONITOR LOGIN ----------
  onAuthStateChanged(auth, (user) => {
    if (user) {
      mostrarApp();
      carregarDados(user.uid);
    } else {
      esconderApp();
    }
  });

  // ---------- PLAN: criar novo PDCA ----------
  formPlan.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes.");
      return;
    }

    const codigo = gerarCodigoPdca();
    const agoraISO = new Date().toISOString();

    const docData = {
      usuario: user.uid,
      codigo,
      titulo: planTitulo.value,
      status: "Planejando",
      plan: {
        categoria: planCategoria.value,
        area: planArea.value,

        // Gestão
        prioridade: planPrioridade ? planPrioridade.value : "",
        responsavel: planResponsavel ? planResponsavel.value : "",
        timeOuTurno: planTimeTurno ? planTimeTurno.value || "" : "",
        dataAlvo: planDataAlvo ? planDataAlvo.value || "" : "",
        tipoObjeto: planTipoObjeto ? planTipoObjeto.value || "" : "",
        descricaoObjeto: planDescricaoObjeto
          ? planDescricaoObjeto.value || ""
          : "",

        // Conteúdo do PDCA
        problema: planProblema.value,
        causas: planCausas.value,
        meta: planMeta.value,
        indicadorReferencia: planIndicadorRef.value,
        indicadorDesejado: planIndicadorDesej.value,
        planoAcao: planPlanoAcao.value,
      },
      do: null,
      check: null,
      act: null,
      criadoEm: agoraISO,
      atualizadoEm: agoraISO,
    };

    try {
      await addDoc(collection(db, "pdcas"), docData);
      alert(`PDCA ${codigo} criado (Plan registrado).`);
      formPlan.reset();
      carregarDados(user.uid);
    } catch (e) {
      alert("Erro ao salvar Plan: " + e.message);
    }
  };

  // ---------- DO ----------
  selectDoPdca.addEventListener("change", async () => {
    const id = selectDoPdca.value;
    doResumoPlan.innerHTML = "";

    if (!id) return;

    try {
      const ref = doc(db, "pdcas", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const d = snap.data();

      const dataAlvoTexto = d.plan?.dataAlvo
        ? new Date(d.plan.dataAlvo + "T00:00:00").toLocaleDateString("pt-BR")
        : "-";

      doResumoPlan.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Responsável:</strong> ${d.plan?.responsavel || "-"}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
        <p><strong>Data alvo:</strong> ${dataAlvoTexto}</p>
        <p><strong>Problema:</strong> ${d.plan?.problema || ""}</p>
        <p><strong>Meta:</strong> ${d.plan?.meta || ""}</p>
        <p><strong>Plano de ação:</strong> ${d.plan?.planoAcao || ""}</p>
      `;
    } catch (e) {
      alert("Erro ao carregar Plan: " + e.message);
    }
  });

  formDo.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes.");
      return;
    }

    const id = selectDoPdca.value;
    if (!id) {
      alert("Escolha um PDCA para registrar o Do.");
      return;
    }

    const agoraISO = new Date().toISOString();

    try {
      const ref = doc(db, "pdcas", id);
      await updateDoc(ref, {
        do: {
          acoesRealizadas: doAcoes.value,
          quemFez: doQuem.value,
          quandoFez: doQuando.value,
        },
        status: "Executando",
        atualizadoEm: agoraISO,
      });

      alert("Do registrado para esse PDCA.");
      formDo.reset();
      selectDoPdca.value = "";
      doResumoPlan.innerHTML = "";
      carregarDados(user.uid);
    } catch (e) {
      alert("Erro ao salvar Do: " + e.message);
    }
  };

  // ---------- CHECK ----------
  selectCheckPdca.addEventListener("change", async () => {
    const id = selectCheckPdca.value;
    checkResumo.innerHTML = "";

    if (!id) return;

    try {
      const ref = doc(db, "pdcas", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const d = snap.data();

      const dataAlvoTexto = d.plan?.dataAlvo
        ? new Date(d.plan.dataAlvo + "T00:00:00").toLocaleDateString("pt-BR")
        : "-";

      checkResumo.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Responsável:</strong> ${d.plan?.responsavel || "-"}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
        <p><strong>Data alvo:</strong> ${dataAlvoTexto}</p>
        <p><strong>Problema:</strong> ${d.plan?.problema || ""}</p>
        <p><strong>Plano de ação:</strong> ${d.plan?.planoAcao || ""}</p>
        <p><strong>Ações realizadas (Do):</strong> ${
          d.do?.acoesRealizadas || ""
        }</p>
      `;
