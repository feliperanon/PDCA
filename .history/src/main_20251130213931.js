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
        licoe
