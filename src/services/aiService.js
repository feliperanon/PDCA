/* src/services/aiService.js */
import { GoogleGenerativeAI } from "@google/generative-ai";

// SUA CHAVE (Mantenha a que você gerou)
const API_KEY = "AIzaSyCmtLe1w5gf0J-QWDdYacrH1zkNr-5i_-8"; 

export async function gerarPdcaComIA(textoProblema) {
  console.log("Iniciando análise com IA para:", textoProblema);

  if (!API_KEY || API_KEY.includes("SUA_API_KEY")) {
    return fallbackSimulation("Chave não configurada");
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // 🔥 USANDO O MODELO MAIS RECENTE E RÁPIDO (Agora suportado pela sua lib nova)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Atue como Especialista em PDCA. Analise: "${textoProblema}"
      Responda APENAS com este JSON (sem markdown):
      {
        "titulo_sugerido": "Título curto (max 50 chars)",
        "categoria": "Escolha: 'Quebra / perda de produto', 'Atraso / tempo', 'Comunicação / alinhamento', 'Organização / processo', 'Segurança / risco', 'Outro'",
        "prioridade": "Baixa, Média, Alta ou Crítica",
        "area_sugerida": "Setor provável",
        "turno_sugerido": "Dia/Noite ou vazio",
        "tipo_objeto": "O que falhou (Ex: Empilhadeira, Sistema)",
        "descricao_objeto": "Detalhe do objeto",
        "causas": "3 causas provaveis",
        "meta": "Meta smart",
        "planoAcao": "3 passos de ação"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro na IA:", error);
    // Se der erro, mostra mensagem clara na tela
    return fallbackSimulation("Erro: " + error.message.slice(0, 20));
  }
}

function fallbackSimulation(motivo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          titulo_sugerido: "Erro de Conexão (Simulação)",
          categoria: "Outro",
          prioridade: "Média",
          area_sugerida: "Erro",
          turno_sugerido: "-",
          tipo_objeto: "Erro API",
          descricao_objeto: motivo,
          causas: "1. Biblioteca desatualizada ou Cache.\n2. Tente rodar com --force.",
          meta: "Reiniciar servidor.",
          planoAcao: "Pare o servidor e rode: npm run dev -- --force"
        });
      }, 1000);
    });
}