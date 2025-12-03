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
} from "firebase/firestore";

let pdcaEmEdicaoId = null; // null = novo; string = editando esse ID

// ---------- Gerar código PDCA: PDCA-YYYY-XXXX ----------
function gerarCodigoPdca() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const sufixo = String(agora.getTime()).slice(-4); // 4 últimos dígitos do timestamp
  return `PDCA-${ano}-${sufixo}`;
}

window.addEventListener("DOMContentLoaded", () => {
  const loginArea = document.getElementById("login-area");
  const appArea = document.getElementById("app-area");

  const inputEmail = document.getElementById("login-email");
  const inputSenha = document.getElementById("login-senha");

  const btnLogar = document.getElementById("btn-logar");
  const btnCriarConta = document.getElementById("btn-criar-conta");
  const btnSair = document.getElementById("btn-sair");

  const formPdca = document.getElementById("pdca-form");
  const listaPdca = document.getElementById("pdca-list");

  function mostrarApp() {
    loginArea.style.display = "none";
    appArea.style.display = "block";
  }

  function esconderApp() {
    loginArea.style.display = "block";
    appArea.style.display = "none";
  }

  // ---------- LOGIN ----------
  btnLogar.onclick = async () => {
    const email = inputEmail.value;
    const senha = inputSenha.value;

    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) {
      alert("Erro ao fazer login: " + e.message);
    }
  };

  btnCriarConta.onclick = async () => {
    const email = inputEmail.value;
    const senha = inputSenha.value;

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      alert("Conta criada! Agora faça login.");
    } catch (e) {
      alert("Erro ao criar conta: " + e.message);
    }
  };

  btnSair.onclick = () => {
    signOut(auth);
  };

  // ---------- MONITOR DE LOGIN ----------
  onAuthStateChanged(auth, (user) => {
    if (user) {
      mostrarApp();
      carregarPdcas(user.uid);
    } else {
      esconderApp();
    }
  });

  // ---------- SALVAR (NOVO OU EDIÇÃO) ----------
  formPdca.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes de salvar.");
      return;
    }

    const docData = montarObjetoPdca(user.uid);

    try {
      if (pdcaEmEdicaoId) {
        // EDIÇÃO
        const ref = doc(db, "pdcas", pdcaEmEdicaoId);
        await updateDoc(ref, {
          ...docData,
          atualizadoEm: new Date().toISOString(),
        });
        alert(`PDCA ${docData.codigo} atualizado!`);
      } else {
        // NOVO
        const ref = await addDoc(collection(db, "pdcas"), docData);
        pdcaEmEdicaoId = ref.id; // opcional: já considerar como "em edição"
        alert(`PDCA ${docData.codigo} criado!`);
      }

      formPdca.reset();
      pdcaEmEdicaoId = null; // volta para modo "novo"
      carregarPdcas(user.uid);
    } catch (e) {
      alert("Erro ao salvar PDCA: " + e.message);
    }
  };

  // Monta o objeto com plan, do, check, act
  function montarObjetoPdca(uid) {
    const agoraISO = new Date().toISOString();

    return {
      usuario: uid,
      // se estiver editando, mantém o mesmo código; se for novo, gera
      codigo: document.getElementById("codigo-pdca")?.value || gerarCodigoPdca(),
      titulo: document.getElementById("titulo").value,
      status: document.getElementById("status").value,

      plan: {
        categoria: document.getElementById("categoria").value,
        area: document.getElementById("area").value,
        problema: document.getElementById("problema").value,
        causas: document.getElementById("causas").value,
        meta: document.getElementById("meta").value,
        indicadorReferencia:
          document.getElementById("indicador-referencia").value,
        indicadorDesejado:
          document.getElementById("indicador-desejado").value,
        planoAcao: document.getElementById("plano-acao").value,
      },

      do: {
        acoesRealizadas: document.getElementById("acoes-realizadas").value,
        quemFez: document.getElementById("quem-fez").value,
        quandoFez: document.getElementById("quando-fez").value,
      },

      check: {
        indicadoresAntes: document.getElementById("indicadores-antes").value,
        indicadoresDepois:
          document.getElementById("indicadores-depois").value,
        observacoes: document.getElementById("check-observacoes").value,
      },

      act: {
        padrao: document.getElementById("padrao").value,
        licoes: document.getElementById("licoes").value,
      },

      criadoEm: agoraISO, // para novo; na edição, vamos sobrescrever só atualizadoEm
      atualizadoEm: agoraISO,
    };
  }

  // ---------- LISTAR PDCAS ----------
  async function carregarPdcas(uid) {
    listaPdca.innerHTML = "Carregando...";

    const q = query(
      collection(db, "pdcas"),
      where("usuario", "==", uid),
      orderBy("criadoEm", "desc")
    );

    const snapshot = await getDocs(q);

    listaPdca.innerHTML = "";

    snapshot.forEach((snapshotDoc) => {
      const d = snapshotDoc.data();

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = snapshotDoc.id; // ID do Firestore
      card.innerHTML = `
        <h3>[${d.codigo}] ${d.titulo}</h3>
        <p><strong>Status:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.plan?.area || ""}</p>
        <p><strong>Categoria:</strong> ${d.plan?.categoria || ""}</p>
        <p><strong>Criado:</strong> ${new Date(
          d.criadoEm
        ).toLocaleString("pt-BR")}</p>
        <p><em>Clique para editar</em></p>
      `;

      listaPdca.appendChild(card);
    });
  }

  // ---------- CLIQUE NO CARD = EDITAR ----------
  listaPdca.onclick = async (event) => {
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
      pdcaEmEdicaoId = id;

      // Se quiser visualizar código na tela, pode criar um input readonly com id="codigo-pdca"
      if (document.getElementById("codigo-pdca")) {
        document.getElementById("codigo-pdca").value = d.codigo || "";
      }

      document.getElementById("titulo").value = d.titulo || "";
      document.getElementById("status").value = d.status || "Planejando";

      document.getElementById("categoria").value =
        d.plan?.categoria || "";
      document.getElementById("area").value = d.plan?.area || "";
      document.getElementById("problema").value =
        d.plan?.problema || "";
      document.getElementById("causas").value = d.plan?.causas || "";
      document.getElementById("meta").value = d.plan?.meta || "";
      document.getElementById("indicador-referencia").value =
        d.plan?.indicadorReferencia || "";
      document.getElementById("indicador-desejado").value =
        d.plan?.indicadorDesejado || "";
      document.getElementById("plano-acao").value =
        d.plan?.planoAcao || "";

      document.getElementById("acoes-realizadas").value =
        d.do?.acoesRealizadas || "";
      document.getElementById("quem-fez").value = d.do?.quemFez || "";
      document.getElementById("quando-fez").value =
        d.do?.quandoFez || "";

      document.getElementById("indicadores-antes").value =
        d.check?.indicadoresAntes || "";
      document.getElementById("indicadores-depois").value =
        d.check?.indicadoresDepois || "";
      document.getElementById("check-observacoes").value =
        d.check?.observacoes || "";

      document.getElementById("padrao").value = d.act?.padrao || "";
      document.getElementById("licoes").value = d.act?.licoes || "";

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert("Erro ao carregar PDCA: " + e.message);
    }
  };
});
