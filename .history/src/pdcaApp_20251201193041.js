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
    } catch (e) {
      alert("Erro ao carregar dados para Check: " + e.message);
    }
  });

  formCheck.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes.");
      return;
    }

    const id = selectCheckPdca.value;
    if (!id) {
      alert("Escolha um PDCA para registrar o Check.");
      return;
    }

    const agoraISO = new Date().toISOString();

    try {
      const ref = doc(db, "pdcas", id);
      await updateDoc(ref, {
        check: {
          indicadoresAntes: checkIndicAntes.value,
          indicadoresDepois: checkIndicDepois.value,
          observacoes: checkObs.value,
        },
        status: "Checando",
        atualizadoEm: agoraISO,
      });

      alert("Check registrado para esse PDCA.");
      formCheck.reset();
      selectCheckPdca.value = "";
      checkResumo.innerHTML = "";
      carregarDados(user.uid);
    } catch (e) {
      alert("Erro ao salvar Check: " + e.message);
    }
  };

  // ---------- ACT ----------
  selectActPdca.addEventListener("change", async () => {
    const id = selectActPdca.value;
    actResumo.innerHTML = "";

    if (!id) return;

    try {
      const ref = doc(db, "pdcas", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const d = snap.data();

      const dataAlvoTexto = d.plan?.dataAlvo
        ? new Date(d.plan.dataAlvo + "T00:00:00").toLocaleDateString("pt-BR")
        : "-";

      actResumo.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Responsável:</strong> ${d.plan?.responsavel || "-"}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
        <p><strong>Data alvo:</strong> ${dataAlvoTexto}</p>
        <p><strong>Problema:</strong> ${d.plan?.problema || ""}</p>
        <p><strong>Meta:</strong> ${d.plan?.meta || ""}</p>
        <p><strong>Plano de ação:</strong> ${d.plan?.planoAcao || ""}</p>
        <p><strong>Ações (Do):</strong> ${d.do?.acoesRealizadas || ""}</p>
        <p><strong>Indicadores antes:</strong> ${
          d.check?.indicadoresAntes || ""
        }</p>
        <p><strong>Indicadores depois:</strong> ${
          d.check?.indicadoresDepois || ""
        }</p>
      `;
    } catch (e) {
      alert("Erro ao carregar dados para Act: " + e.message);
    }
  });

  formAct.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes.");
      return;
    }

    const id = selectActPdca.value;
    if (!id) {
      alert("Escolha um PDCA para registrar o Act.");
      return;
    }

    const agoraISO = new Date().toISOString();
    const funcionou = actFuncionou.value; // "sim" ou "nao"

    const novoStatus = funcionou === "sim" ? "Padronizado" : "Planejando";

    try {
      const ref = doc(db, "pdcas", id);
      await updateDoc(ref, {
        act: {
          funcionou,
          padrao: actPadrao.value,
          licoes: actLicoes.value,
        },
        status: novoStatus,
        atualizadoEm: agoraISO,
      });

      if (funcionou === "sim") {
        alert("Act registrado. PDCA virou padrão.");
      } else {
        alert(
          "Act registrado como 'não funcionou'. Ajuste o Plan e recomece o ciclo."
        );
      }

      formAct.reset();
      selectActPdca.value = "";
      actResumo.innerHTML = "";
      carregarDados(user.uid);
    } catch (e) {
      alert("Erro ao salvar Act: " + e.message);
    }
  };

  // ---------- CARREGAR DADOS GERAIS ----------
  async function carregarDados(uid) {
    listaPdca.innerHTML = "Carregando...";
    pdcaDetalhe.innerHTML = "";

    const q = query(
      collection(db, "pdcas"),
      where("usuario", "==", uid),
      orderBy("criadoEm", "desc")
    );

    const snapshot = await getDocs(q);

    const totais = {
      Planejando: 0,
      Executando: 0,
      Checando: 0,
      Padronizado: 0,
    };

    const listaPlanParaDo = [];
    const listaDoParaCheck = [];
    const listaCheckParaAct = [];

    const mapaArea = {};        // áreas x prioridade
    const mapaResponsavel = {}; // responsável x (abertos, atrasados)

    listaPdca.innerHTML = "";

    snapshot.forEach((snapDoc) => {
      const d = snapDoc.data();
      const id = snapDoc.id;

      // Totais por status (para o gráfico)
      if (d.status && totais[d.status] !== undefined) {
        totais[d.status]++;
      }

      // Listas por etapa
      if (d.status === "Planejando") {
        listaPlanParaDo.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      if (d.status === "Executando") {
        listaDoParaCheck.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      if (d.status === "Checando") {
        listaCheckParaAct.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      // PRIORIDADES POR ÁREA (somente não padronizados)
      if (d.status !== "Padronizado") {
        const area = d.plan?.area || "Sem área";
        const prioridade = d.plan?.prioridade || "Sem prioridade";

        if (!mapaArea[area]) {
          mapaArea[area] = {
            Baixa: 0,
            Média: 0,
            Alta: 0,
            Crítica: 0,
            total: 0,
          };
        }

        if (mapaArea[area][prioridade] === undefined) {
          mapaArea[area][prioridade] = 0;
        }

        mapaArea[area][prioridade]++;
        mapaArea[area].total++;
      }

      // CÁLCULO DE ATRASO
      const temDataAlvo = !!d.plan?.dataAlvo;
      const dataAlvo = temDataAlvo
        ? new Date(d.plan.dataAlvo + "T00:00:00")
        : null;

      const hoje = new Date();
      const hojeSemHora = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
      );

      let estaAtrasado = false;
      let diasAtraso = 0;

      if (dataAlvo && d.status !== "Padronizado") {
        const diffMs = hojeSemHora.getTime() - dataAlvo.getTime();
        if (diffMs > 0) {
          estaAtrasado = true;
          diasAtraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      // NOVO: SOMAR POR RESPONSÁVEL
      const responsavel =
        d.plan?.responsavel && d.plan.responsavel.trim() !== ""
          ? d.plan.responsavel
          : "Sem responsável";

      if (!mapaResponsavel[responsavel]) {
        mapaResponsavel[responsavel] = {
          abertos: 0,
          atrasados: 0,
        };
      }

      if (d.status !== "Padronizado") {
        mapaResponsavel[responsavel].abertos++;
        if (estaAtrasado) {
          mapaResponsavel[responsavel].atrasados++;
        }
      }

      // MONTA CARD
      const dataAlvoTexto = temDataAlvo
        ? dataAlvo.toLocaleDateString("pt-BR")
        : "-";

      const prioridade = d.plan?.prioridade || "";
      const prioridadeClasse = mapPrioridadeClasse(prioridade);
      const prioridadeBadge = prioridade
        ? `<span class="badge badge-${prioridadeClasse}">${prioridade}</span>`
        : "";

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = id;

      if (estaAtrasado) {
        card.classList.add("card-atrasado");
      }

      const textoAtraso = estaAtrasado
        ? `<p class="alerta-atraso"><strong>Atrasado:</strong> ${diasAtraso} dia(s) vencido</p>`
        : "";

      card.innerHTML = `
        <h3>[${d.codigo}] ${d.titulo}</h3>
        <p><strong>Status:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Responsável:</strong> ${d.plan?.responsavel || "-"}</p>
        <p><strong>Prioridade:</strong> ${prioridadeBadge}</p>
        <p><strong>Data alvo:</strong> ${dataAlvoTexto}</p>
        ${textoAtraso}
        <p><strong>Categoria:</strong> ${d.plan?.categoria || ""}</p>
        <p><strong>Criado:</strong> ${new Date(
          d.criadoEm
        )
