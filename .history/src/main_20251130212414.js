import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";


// --------------------------------------------
// LOGIN
// --------------------------------------------

document.getElementById("btn-logar").onclick = async () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (e) {
    alert("Erro ao fazer login: " + e.message);
  }
};

document.getElementById("btn-criar-conta").onclick = async () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    alert("Conta criada! Agora faça login.");
  } catch (e) {
    alert("Erro ao criar conta: " + e.message);
  }
};

document.getElementById("btn-sair").onclick = () => signOut(auth);


// --------------------------------------------
// MONITOR DE LOGIN
// --------------------------------------------

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("login-area").style.display = "none";
    document.getElementById("app-area").style.display = "block";
    carregarPdcas(user.uid);
  } else {
    document.getElementById("login-area").style.display = "block";
    document.getElementById("app-area").style.display = "none";
  }
});


// --------------------------------------------
// SALVAR PDCA
// --------------------------------------------

document.getElementById("pdca-form").onsubmit = async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Faça login antes!");

  const pdca = {
    usuario: user.uid,
    titulo: document.getElementById("titulo").value,
    categoria: document.getElementById("categoria").value,
    area: document.getElementById("area").value,
    problema: document.getElementById("problema").value,
    causas: document.getElementById("causas").value,
    meta: document.getElementById("meta").value,
    indicadorReferencia: document.getElementById("indicador-referencia").value,
    indicadorDesejado: document.getElementById("indicador-desejado").value,
    planoAcao: document.getElementById("plano-acao").value,

    acoesRealizadas: document.getElementById("acoes-realizadas").value,
    quemFez: document.getElementById("quem-fez").value,
    quandoFez: document.getElementById("quando-fez").value,

    indicadoresAntes: document.getElementById("indicadores-antes").value,
    indicadoresDepois: document.getElementById("indicadores-depois").value,
    checkObservacoes: document.getElementById("check-observacoes").value,

    padrao: document.getElementById("padrao").value,
    licoes: document.getElementById("licoes").value,
    status: document.getElementById("status").value,

    criadoEm: new Date().toISOString()
  };

  await addDoc(collection(db, "pdcas"), pdca);

  alert("PDCA salvo!");
  e.target.reset();
  carregarPdcas(user.uid);
};


// --------------------------------------------
// LISTAR PDCAS
// --------------------------------------------

async function carregarPdcas(uid) {
  const lista = document.getElementById("pdca-list");
  lista.innerHTML = "Carregando...";

  const q = query(
    collection(db, "pdcas"),
    where("usuario", "==", uid),
    orderBy("criadoEm", "desc")
  );

  const snapshot = await getDocs(q);

  lista.innerHTML = "";

  snapshot.forEach((doc) => {
    const d = doc.data();

    lista.innerHTML += `
      <div class="card">
        <h3>${d.titulo}</h3>
        <p><strong>Status:</strong> ${d.status}</p>
        <p><strong>Área:</strong> ${d.area}</p>
        <p><strong>Categoria:</strong> ${d.categoria}</p>
        <p><strong>Criado:</strong> ${new Date(d.criadoEm).toLocaleString("pt-BR")}</p>
      </div>
    `;
  });
}
