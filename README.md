# 🚀 PDCA Operations Manager

> **Plataforma de Inteligência Operacional & Gestão de Melhoria Contínua**

Este projeto é uma solução "End-to-End" para gerenciamento de Centros de Distribuição (CDs) e Operações Logísticas. Ele combina o rigor do método **PDCA** com **Inteligência Artificial (IA)** e **Gamificação** para engajar equipes e prevenir falhas.

---

## 🗺️ Mapa Completo da Aplicação

O sistema é composto por 10 módulos principais, cada um com uma função estratégica:

### 1. 🏠 Dashboard Principal (`HomePage`)
*O centro de comando da operação.*
- **Visão Geral**: Cards com contagem de projetos em cada etapa (Plan, Do, Check, Act).
- **✨ Copiloto IA**: Campo de "texto livre" onde o usuário descreve um problema (ex: "Empilhadeira quebrou na expedição") e a IA estrutura automaticamente um PDCA completo (Causa Raiz, Meta, Plano de Ação).
- **Status do Ciclo**: Listas rápidas dos projetos que precisam de atenção.

### 2. 🎮 Diário de Operações (`OperationsLogPage`)
*Registro de ocorrências com gamificação para engajamento.*
- **Sistema de Vidas ❤️**: A operação começa o dia com 5 corações. Cada erro registrado remove meio coração. Se a saúde cair muito, o sistema entra em alerta "Coach Bad".
- **Coach Virtual 🏆**: Um componente visual que parabeniza ("Excelente Trabalho!") ou alerta ("Atenção à Operação!") dependendo do desempenho do dia.
- **Registro Rápido Inteligente**: O sistema categoriza automaticamente o texto digitado (ex: "Falta de luz" -> Categoria: Infraestrutura).
- **Tags Rápidas**: Botões para marcar "Erro", "Ideia", "Alerta" com um clique.

### 3. 📋 Espelho Operacional (`DailyOperationsPage`)
*Gestão rotineira de turno e equipe (Líderes).*
- **Controle de Headcount**: Check-in/Check-out de funcionários por setor. Mostra visualmente o déficit de pessoas (ex: "Expedição: -2 Pessoas").
- **Logística Reversa**: Input de horários críticos (Chegada Caminhão, Término) e Tonelagem.
- **Avaliação 5 Estrelas ⭐**: O líder avalia a qualidade do turno ao encerrar.
- **Trava de Segurança**: Turnos encerrados tornam-se "Read-Only" (Apenas Leitura) para auditoria.

### 4. 🧠 Central de Inteligência (`AnalyticsDashboard`)
*Dashboard Analítico para tomadas de decisão de alto nível.*
- **Fronteira de Capacidade**: Gráfico de dispersão ($Ton/Pessoa$ vs Horário) que revela o limite físico da operação.
- **Algoritmo de Risco**: Diagnóstico automático (🟢 Alta Performance, 🟡 Sobrecarga, 🔴 Risco Crítico).
- **Metas Dinâmicas**: Comparativo visual entre Realizado vs Meta por setor.

### 5. 🔄 Ciclo PDCA (`CreatePdcaPage` & `PdcaDetailPage`)
*Gestão profunda de melhoria contínua.*
- **Criação Manual ou via IA**: Formulários detalhados para estruturar a resolução de problemas.
- **Gestão por Etapas**:
    - **Plan**: Definição de metas e causas.
    - **Do**: Registro de execução.
    - **Check**: Comparativo Antes x Depois.
    - **Act**: Padronização ou lições aprendidas.
- **Cálculo de Prazos**: O sistema sugere datas alvo baseadas na prioridade (Crítica = 4 dias, Baixa = 7 dias).

### 6. 📊 Relatórios & Histórico (`OperationsDatabasePage`)
*O "Cérebro Histórico" da operação.*
- **Smart Ranking**: Classifica os turnos por eficiência real ($Kg/Pessoa/Hora$).
- **Insights Curiosos**: Cards como "Custo de Oportunidade" e "Recordista do Mês".
- **Banco de Dados**: Tabela completa pesquisável de todos os fechamentos anteriores.

### 7. 👥 Cadastros (`CadastroPage`)
*Gestão de ativos e pessoas.*
- **Gestão de Colaboradores**: CRUD completo de funcionários.
- **Importação Excel 📤**: Funcionalidade para importar centenas de funcionários via planilha de uma só vez.
- **Hub de Cadastros**: Ícones rápidos para Máquinas, Processos, Clientes e Fornecedores.

### 8. 🔐 Acesso & Segurança
- **Login (`LoginPage`)**: Autenticação via Firebase Auth.
- **Controle de Sessão**: Redirecionamento automático e proteção de rotas.

---

## 🎨 Design System (Mixpanel Style)

O projeto utiliza uma identidade visual proprietária:
- **Motion-First**: Animações de entrada (`FadeIn`, `SlideUp`) em todas as páginas.
- **Clean Data**: Uso de espaços em branco e tipografia `Inter` para facilitar a leitura de dados densos.
- **Feedback Visual**: Cores semânticas (Verde = Meta Batida, Vermelho = Erro) consistentes em toda a aplicação.

---

## 🛠️ Tecnologias

- **Frontend**: React 18, Vite.
- **Database**: Firebase Firestore (NoSQL).
- **Design**: CSS Modules, Lucide Icons, Recharts.
- **IA**: Integração com serviços de LLM para geração de PDCA.

---

## 🚀 Como Rodar

```bash
# Instalar dependências
npm install

# Rodar servidor local
npm run dev
```

Acesse: `http://localhost:5173`
