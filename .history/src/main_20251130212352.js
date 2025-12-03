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
    planoAcao: document.getElementById("pla
