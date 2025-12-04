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

// Valor padrão para evitar null (mesmo se não tiver Provider)
const defaultValue = {
  user: null,
  profile: null,
  role: null,
  area: null,
  loading: false,
  login: async () => {
    console.error("login chamado fora de um <AuthProvider>.");
  },
  logout: async () => {
    console.error("logout chamado fora de um <AuthProvider>.");
  },
  isAdmin: false,
  isManager: false,
  isAnalyst: false,
  isOperator: false,
};

const AuthContext = createContext(defaultValue);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
          console.warn(
            "Perfil não encontrado em /users para este usuário."
          );
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
  // Nunca será null por causa do defaultValue
  return useContext(AuthContext);
}
