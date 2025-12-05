/* Serviço responsável por conectar com a IA (Google Gemini).
  Se não houver chave de API configurada, ele usa uma simulação para testes.
*/

import { GoogleGenerativeAI } from "@google/generative-ai";

// COLOQUE SUA CHAVE AQUI (Mantenha as aspas)
const API_KEY = "SUA_API_KEY_DO_GOOGLE_AQUI"; 

export async function gerarPdcaComIA(textoProblema) {
  console.log("Iniciando análise com IA para:", textoProblema);

  // --- MODO SIMULAÇÃO (FALLBACK) ---
  // Se a chave for a padrão ou vazia, simulamos a IA para você ver o app funcionando
  if (API_KEY === "SUA_API_KEY_DO_GOOGLE_AQUI" || !API_KEY) {
    console.warn("⚠️ API Key não configurada. Usando modo SIMULAÇÃO.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          titulo_sugerido: "Falha Operacional Detectada (Simulação)",
          categoria: "Processo / Organização",
          prioridade: "Média",
          causas: "1. Falta de padronização.\n2. Ausência de conferência.\n3. Treinamento insuficiente.",
          meta: "Reduzir a ocorrência deste problema em 50% nos próximos 30 dias.",
          planoAcao: "1. Realizar reunião de alinhamento.\n2. Criar checklist de conferência.\n3. Treinar a equipe no novo procedimento."
        });
      }, 2000); // Espera 2 segundos para parecer que está pensando
    });
  }

  // --- MODO REAL (GOOGLE GEMINI) ---
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um Consultor Especialista em PDCA e Lean Manufacturing.
      Analise o seguinte relato de problema operacional: "${textoProblema}"

      Retorne APENAS um objeto JSON (sem crase, sem markdown) com a seguinte estrutura:
      {
        "titulo_sugerido": "Um título curto e profissional (max 50 chars)",
        "categoria": "Escolha uma: 'Quebra / perda de produto', 'Atraso / tempo', 'Comunicação / alinhamento', 'Organização / processo', 'Segurança / risco', 'Outro'",
        "prioridade": "Classifique em: 'Baixa', 'Média', 'Alta' ou 'Crítica'",
        "causas": "Lista formatada em texto das 3 prováveis causas raízes baseadas nos 6M",
        "meta": "Sugira uma meta SMART (Específica, Mensurável, Atingível, Relevante, Temporal)",
        "planoAcao": "Sugira 3 passos práticos para resolver (Quem, Onde, Quando)"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpeza para garantir que venha apenas o JSON (remove formatação Markdown se houver)
    const jsonString = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro ao chamar a IA:", error);
    alert("Houve um erro ao conectar com a IA. Verifique o console.");
    throw error;
  }
}