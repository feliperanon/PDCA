# 🌱 Sistema PDCA NL

> **Gestão de melhoria contínua para operações de FLV – Plan · Do · Check · Act**

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![License](https://img.shields.io/badge/Licença-Privada-red)
![Tech](https://img.shields.io/badge/Tech-React_%7C_Vite_%7C_Firebase-blue)

O **Sistema PDCA NL** é uma aplicação web criada para estruturar, acompanhar e consolidar melhorias dentro da operação. Além da metodologia PDCA tradicional, o sistema integra **Inteligência Artificial** e **Gamificação** para engajar a equipe e fornecer insights em tempo real.

---

## 📊 Visão Geral e Inovações

### 🧠 Intelligence Operations Center (NOVO)
Um painel de inteligência que monitora a saúde operacional em tempo real:
- **Health Score Operacional:** Indicador visual (0-100%) baseado na frequência de erros diários.
- **Análise de Tendências:** Gráficos interativos (Recharts) mostrando o desempenho dos últimos 7 dias.
- **Insights Automáticos:** Mensagens inteligentes geradas com base na análise dos logs do dia.
- **Streak de Proteção:** Gamificação para incentivar dias consecutivos sem falhas.

### 🎮 Gamificação Operacional
- **Painel do Treinador:** Feedback visual imediato (Coach Good / Coach Bad) dependendo do desempenho do dia.
- **Sistema de Vidas:** A operação "perde vidas" conforme erros críticos são registrados (visualização de corações).
- **KPIs Dinâmicos:** Cards que mudam de cor e status instantaneamente para categorias (Expedição, Recebimento, etc.).

---

## 🧩 Modúlos Principais

### 1. Diário de Operações (Logbook)
O coração da rotina diária.
- **Registro Rápido:** Interface otimizada para lançar ocorrências sem atrito.
- **Auto-Categorização (IA):** O sistema identifica automaticamente categoria, cliente e tipo de problema pelo texto digitado.
- **Histórico:** Timeline completa de eventos com filtros de data.

### 2. Gestão PDCA
Ciclo completo de melhoria contínua seguindo os 4 passos:
- **Plan (Planejamento):** Definição de problema, causas, metas e plano de ação.
- **Do (Execução):** Registro de evidências e controle de prazos.
- **Check (Verificação):** Validação dos resultados alcançados.
- **Act (Padronização):** Encerramento ou reabertura de ciclo para melhoria contínua.

---

## 🧱 Estrutura de Telas

* **🏠 Início:** Dashboard geral com status dos projetos.
* **� Diário de Operações:** Onde a mágica acontece (Logs + Inteligência + Gamificação).
* **� Projetos PDCA:** Fluxo kanban ou lista dos ciclos em andamento.
* **⚙️ Configurações:** Gestão de parâmetros e usuários.

---

## 🛠 Tecnologias Utilizadas

Este projeto foi construído com ferramentas modernas para garantia de performance e experiência de usuário premium:

* **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* **Linguagem:** JavaScript (ES6+)
* **Visualização de Dados:** [Recharts](https://recharts.org/) (Gráficos performáticos)
* **Estilização:** CSS Moderno (Glassmorphism, Animações, Responsivo)
* **Backend / Database:** [Firebase](https://firebase.google.com/) (Firestore + Authentication)
* **Ícones:** Lucide React

---

## 🚀 Como rodar o projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v16+)
* [Git](https://git-scm.com/)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/feliperanon/PDCA.git
   cd pdca
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**
   O projeto estará rodando em `http://localhost:5173`.

---

© 2025 Felipe Ranon - Desenvolvido para Excelência Operacional
