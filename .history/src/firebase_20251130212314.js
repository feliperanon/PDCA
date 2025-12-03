// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTYbhIM1b0TLQEDQVw8nQr5zjJCVoIx4E",
  authDomain: "pdca-nl.firebaseapp.com",
  projectId: "pdca-nl",
  storageBucket: "pdca-nl.firebasestorage.app",
  messagingSenderId: "822955504406",
  appId: "1:822955504406:web:92216a559d9ab87152d637",
  measurementId: "G-KCX6DB2KKC"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
