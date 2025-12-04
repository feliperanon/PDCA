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

      try {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          console.log("📄 Perfil carregado de /users:", snap.data());
          setProfile(snap.data());
        } else {
          console.warn("⚠️ Perfil não encontrado em /users para este usuário.");
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar perfil do usuário:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log("👋 Limpando listener onAuthStateChanged");
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    console.log("🔐 AuthContext.login chamado com:", email);

    const cred = await signInWithEmailAndPassword(auth, email, password);

    console.log("✅ Firebase retornou credencial:", cred.user?.uid);

    // 👇 Atualiza o estado imediatamente, sem esperar onAuthStateChanged
    setUser(cred.user);

    // Opcional: já tenta carregar o perfil aqui também
    try {
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        console.log("📄 (login) Perfil carregado de /users:", snap.data());
        setProfile(snap.data());
      } else {
        console.warn("⚠️ (login) Perfil não encontrado em /users.");
        setProfile(null);
      }
    } catch (error) {
      console.error("❌ (login) Erro ao carregar perfil:", error);
    }

    return cred;
  };

  const logout = async () => {
    console.log("🚪 Fazendo logout...");
    await signOut(auth);
    setUser(null);
    setProfile(null);
    console.log("✅ Logout concluído");
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
