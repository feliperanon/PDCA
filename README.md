# 🚀 PDCA Operations Manager

> **Plataforma de Inteligência Operacional & Gestão de Melhoria Contínua**

Este projeto é uma solução "End-to-End" para gerenciamento de Centros de Distribuição (CDs) e Operações Logísticas. Ele centraliza o registro de rotinas, controle de equipe, análise de KPIs e o ciclo de melhoria contínua (PDCA) em uma única interface moderna e preditiva.

---

## 🏗️ Mapa da Aplicação

### 🔐 1. Autenticação & Acesso
- **Login (`/login`)**: Acesso seguro via Firebase Authentication. Apenas usuários autorizados podem visualizar os dados sensíveis da operação.
- **Cadastro (`/cadastro`)**: Módulo para registrar novos gestores ou líderes de turno no sistema.

### 🧠 2. Central de Inteligência (`/inteligencia`)
*Dashboard Analítico Premium focado em Risco & Capacidade.*
- **Fronteira de Capacidade ($T/C$ vs Tempo)**: Gráfico de dispersão avançado que relaciona a pressão de carga ($Ton/Pessoa$) com o horário de término real, permitindo identificar o "limite físico" da operação.
- **Algoritmo de Risco**: Diagnóstico automático que classifica cada turno em:
  - 🟢 **Alta Performance**: Fechamento antecipado com alta tonelagem.
  - 🟡 **Sobrecarga**: Cumprimento da meta, mas com pressão excessiva sobre a equipe.
  - 🔴 **Risco Crítico**: Atrasos sistêmicos por falta de mão de obra.
- **Leitura Fria ($Trust Score$)**: Um KPI percentual que indica a confiabilidade da operação em fechar no horário meta (09:00).

### 📋 3. Diário Operacional (`/diario`)
*Interface "Battle-Tested" para uso em chão de fábrica pelos líderes.*
- **Espelho de Ponto Digital**: Gestão visual de presença por setores (Recebimento, Expedição, Câmara Fria, etc).
- **Controle de Absenteísmo**: Registro rápido de Faltas, Atestados e Férias, impactando imediatamente os cálculos de capacidade.
- **Logística Reversa**: Input de horários críticos (Chegada de Mercadoria, Término de Operação) e Tonelagem movimentada.
- **Trava de Segurança (Read-Only)**: Após o encerramento do turno pelo líder, os dados são "congelados" para garantir a integridade histórica e auditoria.
- **Avaliação 5 Estrelas**: Feedback qualitativo imediato sobre o "sentimento" do turno.

### � 4. Relatórios & Banco de Dados (`/relatorios`)
*O "Cérebro Histórico" da operação.*
- **Listagem Cronológica**: Histórico completo de ocorrências ("Logs") e fechamentos de turno.
- **Smart Ranking**: Tabela de liderança que classifica os turnos não apenas por velocidade, mas por Eficiência Real ($Kg/Pessoa/Hora$).
- **Insights Curiosos**: Cards dinâmicos que destacam anomalias, como "Custo de Oportunidade" (horas perdidas por absenteísmo) e recordes de produtividade.

### 🔄 5. Gestão PDCA (`/pdca`, `/criar-pdca`, `/historico-pdca`)
*Solução completa para tratamento de anomalias.*
- **Dashboard Kanban**: Visualização de planos de ação por status (Planejamento, Execução, Verificação, Padronização).
- **Detalhamento**: Página dedicada para cada projeto PDCA, com cronograma, equipe responsável e análise de causa raiz (5 Porquês).
- **Histórico**: Arquivo morto de melhorias implementadas para consulta futura.

### ⚙️ 6. Configurações (`/config`)
- **Metas Operacionais**: Definição dinâmica do "Headcount Ideal" por setor, que alimenta os cálculos de déficit de equipe no Diário.

---

## 🎨 Design System & UX (Mixpanel Style)

O projeto adota uma filosofia de design **"Motion-First"** e **"Clean Data"**:

- **Animações (Framer Motion feel)**: Entradas suaves (`Fade-In`, `Slide-Up`) em todas as páginas para uma sensação de app nativo.
- **Componentes Premium**: Cards com sombras difusas (`box-shadow`), bordas arredondadas e efeitos de hover, inspirados em interfaces SaaS modernas (Linear, Mixpanel, Raycast).
- **Tipografia**: Uso da família `Inter` com pesos calibrados para leitura densa de dados sem cansaço visual.
- **Feedback Visual**: Cores semânticas claras (Verde/Alta Performance, Vermelho/Crítico) para tomada de decisão em milissegundos.

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Core da aplicação (SPA) |
| **Estilização** | CSS Modules + Keyframes | Design System proprietário e animações |
| **Dados** | Recharts | Visualização de dados complexos (Scatter, Composed) |
| **Backend** | Firebase Firestore | Banco de dados NoSQL em tempo real |
| **Auth** | Firebase Auth | Gestão de identidade e segurança |
| **Icons** | Lucide React | Iconografia consistente e leve |

---

## 🚀 Como Executar

1. **Instale as dependências:**
   ```bash
   npm install
   ```
2. **Configure o ambiente:**
   Crie um arquivo `.env` com suas credenciais do Firebase.
3. **Rode o servidor local:**
   ```bash
   npm run dev
   ```
4. **Build para produção:**
   ```bash
   npm run build
   ```

---

Desenvolvido para transformar dados brutos em **Decisões Operacionais Precisas**. �
