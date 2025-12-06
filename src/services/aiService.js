/* src/services/aiService.js */
import { GoogleGenerativeAI } from "@google/generative-ai";

// A TUA CHAVE (A mesma do comando curl que enviaste)
const API_KEY = "AIzaSyCO7USCPZ6OQfNOMbBxMh7mwhrMhUIwMBU"; 

export async function gerarPdcaComIA(textoProblema) {
  console.log("🚀 Iniciando análise com IA (Modelo 2.0 Flash) para:", textoProblema);

  if (!API_KEY || API_KEY.length < 10) {
    return fallbackSimulation("Chave não configurada");
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // 🔥 ATUALIZAÇÃO: Usando o modelo 'gemini-2.0-flash' conforme o teu comando curl.
    // Este parece ser o modelo que a tua chave está autorizada a usar.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    
    // Limpeza para garantir JSON válido
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro na IA:", error);
    return fallbackSimulation("Erro: " + error.message);
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
          causas: "1. O modelo gemini-2.0-flash pode não estar ativo.\n2. Verifique a chave.",
          meta: "Tentar novamente.",
          planoAcao: "Verifique o console para mais detalhes."
        });
      }, 1000);
    });
}