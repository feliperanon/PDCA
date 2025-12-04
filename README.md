# 📌 **README.md**

Copie tudo abaixo e cole em `README.md` na raiz do seu projeto:

---

```md
# 🌱 Sistema PDCA NL  
Gestão de melhoria contínua para operações de FLV – Plan · Do · Check · Act

O Sistema PDCA NL é uma aplicação web criada para estruturar, acompanhar e consolidar melhorias dentro da operação.  
Serve para dar clareza, disciplina e rastreabilidade aos processos, transformando problemas do dia a dia em soluções organizadas.

---

## 📊 Visão Geral

O sistema permite:

- Criar projetos PDCA completos
- Controlar avanço de etapas (bloqueio para garantir sequência correta)
- Acompanhar prioridades, áreas, categorias e responsáveis
- Visualizar os últimos PDCAs criados por fase (Plan / Do / Check / Act)
- Consultar histórico completo: concluídos, cancelados e em andamento
- Registrar tempo entre as etapas
- Finalizar ciclos e abrir novos quando necessário
- Exportar dados (PDF / CSV)
- Atualização em tempo real com Firebase

---

## 🧩 Funcionalidades principais

### ✔ **Plan**
- Descrição detalhada do problema  
- Análise por área  
- Definição da prioridade  
- Categoria da ocorrência  
- Data alvo inicial  
- Gatilho para travar avanço até que o Plan esteja concluído  

### ✔ **Do**
- Ações executadas  
- Responsáveis  
- Datas e comprovações  
- Travamento até conclusão  

### ✔ **Check**
- Verificação da eficácia  
- Registros, evidências e ajustes  

### ✔ **Act**
- Padronização do que funcionou  
- Encerramento do ciclo  
- Reabertura automática caso o resultado falhe (novo PDCA baseado no anterior)  

---

## 🧱 Estrutura de Telas

```

Início
├── Últimos PDCAs por fase
├── Cards do ciclo PDCA com explicações lúdicas
└── Acesso rápido para criar novos projetos

PDCA
├── Plan  → obrigatório antes de avançar
├── Do    → habilitado apenas após Plan
├── Check → habilitado após Do
└── Act   → habilitado após Check

Dashboard
├── Quatro colunas (Plan / Do / Check / Act)
├── Filtros rápidos (prioridade, área, cliente, responsáveis)
├── Cards inteligentes com status e prazos
└── Indicadores: tempo de ciclo, áreas críticas, prioridades mais frequentes

Histórico
├── Concluídos
├── Cancelados
└── Linha do tempo completa do PDCA selecionado

Operações adicionais
├── Editar PDCA
├── Cancelar PDCA
├── Excluir PDCA
└── Exportar PDF / CSV

````

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js instalado
- Git instalado
- VS Code instalado

### Passo a passo

```bash
npm install
npm run dev
````

Acesse:

```
http://localhost:5173
```

---

## 🛠 Tecnologias utilizadas

* **React + Vite**
* **Firebase (Firestore + Authentication)**
* **JavaScript ES6+**
* **CSS moderno**
* **Git + GitHub**

---

## 🧱 Arquitetura do projeto

```
pdca-nl/
 ├── public/
 ├── src/
 │    ├── components/
 │    ├── pages/
 │    ├── services/   → conexão com Firestore
 │    ├── hooks/
 │    ├── styles/
 │    └── utils/
 ├── .gitignore
 ├── package.json
 ├── vite.config.js
 └── README.md
```

---

## 🔥 Roadmap (próximas melhorias)

* [ ] IA para análise automática de padrões dos PDCAs
* [ ] Ranking de áreas por criticidade
* [ ] Sistema de meta semanal por equipe
* [ ] Painel de responsáveis com PDCAs atrasados
* [ ] Timeline visual da vida do PDCA
* [ ] Geração automática de plano de ação baseado no histórico
* [ ] Notificações por e-mail / WhatsApp
* [ ] Dashboard com gráficos (Pizza, Pareto, Linha do Tempo)
* [ ] Modo offline
* [ ] Permissões avançadas por cargo (Admin / Supervisor / Operação)

---

## 📦 Exportação

O sistema permite exportar:

* PDF do PDCA
* Histórico completo
* CSV dos dados para análise externa

---

## 📝 Convenção de commits

Padrão recomendado para organizar seu histórico:

```
feat: cria nova funcionalidade
fix: corrige bug
docs: altera documentação
style: ajustes visuais
refactor: melhora código sem mudar funcionalidade
perf: otimização
build: alterações de build
chore: tarefas internas
```

---

## 👤 Autor

Projeto desenvolvido por **Felipe Ranon**, voltado para melhoria contínua, gestão operacional e excelência em processos dentro do FLV.

---

## 📄 Licença

Uso interno e restrito.

