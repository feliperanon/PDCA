/* src/services/aiService.js */
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function gerarPdcaComIA(textoProblema) {
  console.log("🚀 Iniciando análise com IA (Modelo 2.0 Flash)...");

  // 1. Lê a chave do ficheiro .env (que criámos no Passo 2)
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // 2. Verifica se a chave foi carregada corretamente
  if (!API_KEY || API_KEY.length < 10) {
    console.warn("⚠️ Chave API não encontrada. Verifique se criou o arquivo .env na raiz.");
    return fallbackSimulation("Falta o arquivo .env com a chave VITE_GOOGLE_API_KEY");
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Configura o modelo 'flash' que é mais rápido e eficiente
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
    
    // Deteta se a chave foi bloqueada
    let msg = error.message;
    if (msg.includes("403") || msg.includes("leaked")) {
        msg = "Chave bloqueada. Verifique o ficheiro .env";
    }

    return fallbackSimulation("Erro: " + msg);
  }
}

/**
 * Função de fallback: Garante que o utilizador recebe uma resposta
 * mesmo se a IA falhar ou estiver sem internet.
 */
function fallbackSimulation(motivo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          titulo_sugerido: "Modo Offline (Erro Conexão)",
          categoria: "Outro",
          prioridade: "Média",
          area_sugerida: "Sistema",
          turno_sugerido: "-",
          tipo_objeto: "Erro API",
          descricao_objeto: motivo,
          causas: "1. Arquivo .env em falta ou incorreto.\n2. Chave API bloqueada.\n3. Falha de internet.",
          meta: "Verificar configurações do projeto.",
          planoAcao: "1. Confirmar se o ficheiro .env existe na raiz.\n2. Reiniciar o servidor com 'npm run dev'."
        });
      }, 1000);
    });
}