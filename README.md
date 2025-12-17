# 🚀 PDCA Operations Manager

> Sistema de Gestão Operacional e Inteligência Preditiva para Centros de Distribuição.

Este projeto é uma plataforma completa para o ciclo **PDCA (Plan, Do, Check, Act)**, integrando controle diário de operações, gestão de absenteísmo e uma **Central de Inteligência** capaz de diagnosticar riscos operacionais com base em modelos matemáticos de capacidade.

---

## ✨ Funcionalidades Principais

### 🧠 Central de Inteligência 1.0
Dashboard analítico focado em **Risco & Capacidade**. Diferente de dashboards comuns, ele não apenas mostra dados, mas diagnostica a saúde da operação.
- **Fronteira de Capacidade ($T/C$ vs Tempo)**: Gráfico de dispersão que relaciona a pressão de carga ($Ton/Pessoa$) com o horário de término.
- **Leitura Fria (Confiabilidade)**: Calcula a probabilidade matemática da equipe encerrar o turno na meta (09:00).
- **Diagnóstico Automático**: O sistema classifica cada turno como "Alta Performance", "Sobrecarga" ou "Risco Crítico" automaticamente.

### 📋 Diário Operacional (Espelho)
Interface para os líderes de turno registrarem a rotina em tempo real.
- **Gestão de Equipe**: Check-in/Check-out de funcionários por setor (Recebimento, Expedição, etc.).
- **Controle de Absenteísmo**: Registro visual de Faltas, Atestados e Férias.
- **Segurança de Dados**: Turnos encerrados entram em modo **Read-Only** (apenas leitura) para garantir integridade histórica.
- **Avaliação 5 Estrelas**: Feedback qualitativo rápido do líder sobre o turno.

### 📊 Relatórios & Insights
Banco de dados histórico com análise inteligente.
- **Smart Ranking**: Classifica os turnos por eficiência real ($Kg/Pessoa/Hora$).
- **Insights Curiosos**: Destaca "Custo de Oportunidade" (quanto tempo foi perdido por faltas) e padrões de performance.

### 🔄 Ciclo PDCA
Ferramenta para criação e acompanhamento de planos de ação corretivos e preventivos baseados nas anomalias encontradas na operação.

---

## 🎨 Design System & UX (Mixpanel Style)

O projeto utiliza um sistema de design proprietário focado em **Motion** e **Clareza**, inspirado em ferramentas de analytics premium (como Mixpanel/Amplitude).

- **Visual "Clean"**: Tipografia Inter, hierarquia visual forte e uso estratégico de espaço em branco.
- **Motion Design**: Animações de entrada (`Fade-In`, `Slide-Up`, `Scale`) para uma experiência fluida.
- **Micro-interações**: Feedbacks visuais em hovers, cliques e transições de estado.
- **Glassmorphism & Sombras**: Uso de camadas translúcidas e sombras difusas para profundidade (Depth).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js (Vite)
- **Database**: Firebase Firestore (NoSQL)
- **Charts**: Recharts (Customized)
- **Styling**: CSS Modules + Global Design Tokens (Variables)
- **Icons**: Lucide React / SVG Customizados

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` para visualizar a aplicação.

---

Desenvolvido para maximizar a eficiência operacional através de dados. 📈
