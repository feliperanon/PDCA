// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Valor padrão seguro
const defaultAuthValue = {
  user: null,
  profile: null,
  role: null,
  area: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isManager: false,
  isAnalyst: false,
  isOperator: false,
};

const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Usuário do Firebase Auth
  const [profile, setProfile] = useState(null); // Doc em /users/{uid}
  const [loading, setLoading] = useState(true); // Carregando auth inicial

  useEffect(() => {
    console.log("👀 Registrando onAuthStateChanged...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 onAuthStateChanged disparou:", firebaseUser);

      if (!firebaseUser) {
        console.log("⚪ Nenhum usuário logado.");
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log("🟢 Usuário logado no Firebase Auth:", firebaseUser.uid);
      setUser(firebaseUser);
