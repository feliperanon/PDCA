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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // usuário do Firebase Auth
  const [profile, setProfile] = useState(null); // doc em /users/{uid}
  const [loading, setLoading] = useState(true); // carregando estado inicial

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          console.warn("Perfil não encontrado em /users para este usuário.");
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    area: profile?.area ?? null,
    loading,
    login,
    logout,
    isAdmin: profile?.role === "ADMIN",
    isManager: profile?.role === "MANAGER",
    isAnalyst: profile?.role === "ANALYST",
    isOperator: profile?.role === "OPERATOR",
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
