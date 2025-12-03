// src/main.js
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
let ultimoMapaArea = {}; // guarda último mapa para reaplicar filtros

// Gera código tipo PDCA-2025-1234
function gerarCodigoPdca() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const sufixo = String(agora.getTime()).slice(-4);
  return `PDCA-${ano}-${sufixo}`;
}

// Mapeia prioridade para classe CSS
function mapPrioridadeClasse(prioridade) {
  if (!prioridade) return "";
  const p = prioridade.toLowerCase();
  if (p.includes("baixa")) return "baixa";
  if (p.includes("média") || p.includes("media")) return "media";
  if (p.includes("alta")) return "alta";
  if (p.includes("crítica") || p.includes("critica")) return "critica";
  return "";
}

window.addEventListener("DOMContentLoaded", () => {
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
  const planPrioridade = document.getElementById("plan-prioridade");
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

  // Lista + dashboard + detalhe
  const listaPdca = document.getElementById("pdca-list");
  const canvasGrafico = document.getElementById("grafico-status");
  const tabelaPrioridades = document.getElementById("tabela-prioridades");
  const resumoTopAreas = document.getElementById("resumo-top-areas");
  const filtroPrioridade = document.getElementById("filtro-prioridade");
  const pdcaDetalhe = document.getElementById("pdca-detalhe");

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

    const codigo = gerarCodigoPdca(); // criação automática na etapa Plan
    const agoraISO = new Date().toISOString();

    const docData = {
      usuario: user.uid,
      codigo,
      titulo: planTitulo.value,
      status: "Planejando", // estamos no Plan
      plan: {
        categoria: planCategoria.value,
        area: planArea.value,
        prioridade: planPrioridade.value,
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

      doResumoPlan.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
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

      checkResumo.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
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

      actResumo.innerHTML = `
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Prioridade:</strong> ${d.plan?.prioridade || ""}</p>
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

    const mapaArea = {}; // { area: { Baixa, Média, Alta, Crítica, total } }

    listaPdca.innerHTML = "";

    snapshot.forEach((snapDoc) => {
      const d = snapDoc.data();
      const id = snapDoc.id;

      if (d.status && totais[d.status] !== undefined) {
        totais[d.status]++;
      }

      // Alimenta listas por etapa
      if (d.status === "Planejando") {
        listaPlanParaDo.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      if (d.status === "Executando") {
        listaDoParaCheck.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      if (d.status === "Checando") {
        listaCheckParaAct.push({ id, codigo: d.codigo, titulo: d.titulo });
      }

      // Prioridades por área – considerar "abertos" (não padronizados)
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

      const prioridade = d.plan?.prioridade || "";
      const prioridadeClasse = mapPrioridadeClasse(prioridade);
      const prioridadeBadge = prioridade
        ? `<span class="badge badge-${prioridadeClasse}">${prioridade}</span>`
        : "";

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = id;
      card.innerHTML = `
        <h3>[${d.codigo}] ${d.titulo}</h3>
        <p><strong>Status:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Prioridade:</strong> ${prioridadeBadge}</p>
        <p><strong>Categoria:</strong> ${d.plan?.categoria || ""}</p>
        <p><strong>Criado:</strong> ${new Date(
          d.criadoEm
        ).toLocaleString("pt-BR")}</p>
        <p><em>Clique para visualizar detalhes</em></p>
      `;
      listaPdca.appendChild(card);
    });

    preencherSelect(selectDoPdca, listaPlanParaDo, "Selecione um PDCA em Plan...");
    preencherSelect(
      selectCheckPdca,
      listaDoParaCheck,
      "Selecione um PDCA em Do..."
    );
    preencherSelect(
      selectActPdca,
      listaCheckParaAct,
      "Selecione um PDCA em Check..."
    );

    atualizarGraficoStatus(canvasGrafico, totais);

    ultimoMapaArea = mapaArea;
    atualizarTabelaPrioridades(
      tabelaPrioridades,
      mapaArea,
      filtroPrioridade.value
    );
  }

  function preencherSelect(selectElem, lista, textoPadrao) {
    selectElem.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = textoPadrao;
    selectElem.appendChild(opt0);

    lista.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = `[${item.codigo}] ${item.titulo}`;
      selectElem.appendChild(opt);
    });
  }

  function atualizarGraficoStatus(canvas, totais) {
    if (!canvas) return;

    const labels = ["Planejando", "Executando", "Checando", "Padronizado"];
    const data = labels.map((l) => totais[l] || 0);
    const ctx = canvas.getContext("2d");

    if (graficoStatus) {
      graficoStatus.data.datasets[0].data = data;
      graficoStatus.update();
      return;
    }

    graficoStatus = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Quantidade de PDCAs por etapa",
            data,
            backgroundColor: ["#2563eb", "#f97316", "#0d9488", "#16a34a"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            precision: 0,
          },
        },
      },
    });
  }

  function atualizarTabelaPrioridades(tabela, mapaArea, filtro = "") {
    if (!tabela) return;

    const areas = Object.keys(mapaArea);

    if (areas.length === 0) {
      tabela.innerHTML =
        "<tr><td>Não há PDCAs em aberto.</td></tr>";
      if (resumoTopAreas) {
        resumoTopAreas.textContent = "Nenhum PDCA em aberto no momento.";
      }
      return;
    }

    let html = `
      <thead>
        <tr>
          <th>Área</th>
          <th>Baixa</th>
          <th>Média</th>
          <th>Alta</th>
          <th>Crítica</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
    `;

    const apenasUmaPrioridade = filtro && filtro !== "";

    const linhas = [];

    areas.forEach((area) => {
      const info = mapaArea[area];

      if (apenasUmaPrioridade) {
        const qtd = info[filtro] || 0;
        if (qtd === 0) return; // não mostra área sem essa prioridade

        linhas.push({
          area,
          Baixa: filtro === "Baixa" ? qtd : 0,
          Média: filtro === "Média" ? qtd : 0,
          Alta: filtro === "Alta" ? qtd : 0,
          Crítica: filtro === "Crítica" ? qtd : 0,
          total: qtd,
        });
      } else {
        linhas.push({
          area,
          Baixa: info.Baixa || 0,
          Média: info["Média"] || 0,
          Alta: info.Alta || 0,
          Crítica: info["Crítica"] || 0,
          total: info.total || 0,
        });
      }
    });

    if (linhas.length === 0) {
      tabela.innerHTML =
        "<tr><td>Não há PDCAs para esse filtro de prioridade.</td></tr>";
      if (resumoTopAreas) {
        resumoTopAreas.textContent = "Nenhuma área com PDCAs para esse filtro.";
      }
      return;
    }

    // ordenar por total desc
    linhas.sort((a, b) => b.total - a.total);

    linhas.forEach((linha) => {
      html += `
        <tr>
          <td>${linha.area}</td>
          <td>${linha.Baixa}</td>
          <td>${linha["Média"]}</td>
          <td>${linha.Alta}</td>
          <td>${linha["Crítica"]}</td>
          <td>${linha.total}</td>
        </tr>
      `;
    });

    html += "</tbody>";
    tabela.innerHTML = html;

    // Resumo top áreas
    if (resumoTopAreas) {
      const top = linhas.slice(0, 3);
      const textoFiltro = filtro ? ` (prioridade: ${filtro})` : "";
      const partes = top.map(
        (l) => `${l.area}: ${l.total} PDCA(s)`
      );
      resumoTopAreas.textContent =
        "Top áreas com PDCAs abertos" +
        textoFiltro +
        " — " +
        partes.join(" | ");
    }
  }

  // Atualiza tabela quando mudar filtro de prioridade
  filtroPrioridade.addEventListener("change", () => {
    atualizarTabelaPrioridades(
      tabelaPrioridades,
      ultimoMapaArea,
      filtroPrioridade.value
    );
  });

  // ---------- DETALHE DO PDCA (histórico + ações) ----------
  listaPdca.addEventListener("click", async (event) => {
    const card = event.target.closest(".card");
    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    try {
      const ref = doc(db, "pdcas", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("PDCA não encontrado.");
        return;
      }

      const d = snap.data();

      const criado = new Date(d.criadoEm).toLocaleString("pt-BR");
      const atualizado = d.atualizadoEm
        ? new Date(d.atualizadoEm).toLocaleString("pt-BR")
        : "-";

      const prioridade = d.plan?.prioridade || "";
      const prioridadeClasse = mapPrioridadeClasse(prioridade);
      const prioridadeBadge = prioridade
        ? `<span class="badge badge-${prioridadeClasse}">${prioridade}</span>`
        : "";

      pdcaDetalhe.innerHTML = `
        <h2>PDCA completo</h2>
        <p><strong>Código:</strong> ${d.codigo}</p>
        <p><strong>Título:</strong> ${d.titulo}</p>
        <p><strong>Status atual:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Prioridade:</strong> ${prioridadeBadge}</p>
        <p><strong>Categoria:</strong> ${d.plan?.categoria || ""}</p>
        <p><strong>Criado em:</strong> ${criado}</p>
        <p><strong>Última atualização:</strong> ${atualizado}</p>

        <hr>
        <h3>P – Plan</h3>
        <p><strong>Problema:</strong> ${d.plan?.problema || ""}</p>
        <p><strong>Causas:</strong> ${d.plan?.causas || ""}</p>
        <p><strong>Meta:</strong> ${d.plan?.meta || ""}</p>
        <p><strong>Indicador antes:</strong> ${
          d.plan?.indicadorReferencia || ""
        }</p>
        <p><strong>Indicador desejado:</strong> ${
          d.plan?.indicadorDesejado || ""
        }</p>
        <p><strong>Plano de ação:</strong> ${d.plan?.planoAcao || ""}</p>

        <hr>
        <h3>D – Do</h3>
        <p><strong>Ações realizadas:</strong> ${
          d.do?.acoesRealizadas || "(ainda não registrado)"
        }</p>
        <p><strong>Quem fez:</strong> ${d.do?.quemFez || ""}</p>
        <p><strong>Quando fez:</strong> ${d.do?.quandoFez || ""}</p>

        <hr>
        <h3>C – Check</h3>
        <p><strong>Indicadores antes:</strong> ${
          d.check?.indicadoresAntes || ""
        }</p>
        <p><strong>Indicadores depois:</strong> ${
          d.check?.indicadoresDepois || ""
        }</p>
        <p><strong>Observações:</strong> ${
          d.check?.observacoes || ""
        }</p>

        <hr>
        <h3>A – Act</h3>
        <p><strong>Funcionou?:</strong> ${
          d.act?.funcionou === "sim"
            ? "Sim"
            : d.act?.funcionou === "nao"
            ? "Não"
            : ""
        }</p>
        <p><strong>Virou padrão:</strong> ${d.act?.padrao || ""}</p>
        <p><strong>Lições aprendidas:</strong> ${
          d.act?.licoes || ""
        }</p>

        <hr>
        <button id="btn-ir-etapa">Ir para etapa atual</button>
        <button id="btn-excluir-pdca">Excluir PDCA</button>
      `;

      // Botão: Ir para etapa atual
      const btnIrEtapa = document.getElementById("btn-ir-etapa");
      if (btnIrEtapa) {
        btnIrEtapa.onclick = () => {
          const status = d.status;
          if (status === "Planejando") {
            selectEtapa.value = "plan";
            atualizarVisibilidadeEtapas();
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (status === "Executando") {
            selectEtapa.value = "do";
            atualizarVisibilidadeEtapas();
            selectDoPdca.value = id;
            selectDoPdca.dispatchEvent(new Event("change"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (status === "Checando") {
            selectEtapa.value = "check";
            atualizarVisibilidadeEtapas();
            selectCheckPdca.value = id;
            selectCheckPdca.dispatchEvent(new Event("change"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (status === "Padronizado") {
            selectEtapa.value = "act";
            atualizarVisibilidadeEtapas();
            selectActPdca.value = id;
            selectActPdca.dispatchEvent(new Event("change"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        };
      }

      // Botão: Excluir PDCA
      const btnExcluir = document.getElementById("btn-excluir-pdca");
      if (btnExcluir) {
        btnExcluir.onclick = async () => {
          const confirmar = window.confirm(
            `Tem certeza que deseja excluir o PDCA ${d.codigo}?`
          );
          if (!confirmar) return;

          const user = auth.currentUser;
          if (!user) {
            alert("Você precisa estar logado.");
            return;
          }

          try {
            await deleteDoc(ref);
            alert("PDCA excluído.");
            pdcaDetalhe.innerHTML = "";
            carregarDados(user.uid);
          } catch (e) {
            alert("Erro ao excluir PDCA: " + e.message);
          }
        };
      }
    } catch (e) {
      alert("Erro ao carregar detalhes do PDCA: " + e.message);
    }
  });
});
