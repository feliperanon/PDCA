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
} from "firebase/firestore";

// Só roda depois do HTML estar carregado
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

  // ---------- FUNÇÕES AUXILIARES ----------

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

  // ---------- SALVAR PDCA ----------

  formPdca.onsubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Faça login antes de salvar.");
      return;
    }

    const pdca = {
      usuario: user.uid,
      titulo: document.getElementById("titulo").value,
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

      acoesRealizadas: document.getElementById("acoes-realizadas").value,
      quemFez: document.getElementById("quem-fez").value,
      quandoFez: document.getElementById("quando-fez").value,

      indicadoresAntes: document.getElementById("indicadores-antes").value,
      indicadoresDepois: document.getElementById("indicadores-depois").value,
      checkObservacoes:
        document.getElementById("check-observacoes").value,

      padrao: document.getElementById("padrao").value,
      licoes: document.getElementById("licoes").value,
      status: document.getElementById("status").value,

      criadoEm: new Date().toISOString(),
    };

    await addDoc(collection(db, "pdcas"), pdca);

    alert("PDCA salvo!");
    formPdca.reset();
    carregarPdcas(user.uid);
  };

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

    snapshot.forEach((doc) => {
      const d = doc.data();

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${d.titulo}</h3>
        <p><strong>Status:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.area}</p>
        <p><strong>Categoria:</strong> ${d.categoria}</p>
        <p><strong>Criado:</strong> ${new Date(
          d.criadoEm
        ).toLocaleString("pt-BR")}</p>
      `;

      listaPdca.appendChild(card);
    });
  }
});
