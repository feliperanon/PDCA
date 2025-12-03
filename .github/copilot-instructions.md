## Instruções rápidas para agentes de código

Este repositório contém uma pequena aplicação PDCA construída com Vite + React e também uma versão legada em JavaScript puro. Abaixo há informações práticas para ser imediatamente produtivo aqui.

- Ponto de entrada (legacy): `src/main.js` -> chama `initPdcaApp()` em `src/pdcaApp.js`.
- Ponto de entrada (React): `src/react-main.jsx` -> monta `ReactApp` (`src/ReactApp.jsx`) com rotas definidas em `src/pages/*`.

Build & dev
- Use os scripts do `package.json`: `npm install` e `npm run dev` (Vite, serve em http://localhost:5173 por padrão). `npm run build` e `npm run preview` disponíveis.

Firebase / dados
- Conexão Firebase central em `src/firebase.js`. O projeto usa Firestore e Auth.
- Coleção principal: `pdcas` — observe campos usados por ambos os códigos: `codigo`, `titulo`, `status`, `plan` (objeto), `do`, `check`, `act`, `criadoEm`, `atualizadoEm`.
- Exemplo (estrutura esperada): em `src/pdcaApp.js` o documento contém `plan.problema`, `plan.prioridade`, `plan.area`, `plan.dataAlvo`.

Convenções e valores importantes
- Status (strings textuais): "Planejando", "Executando", "Checando", "Padronizado" — preservá-los ao alterar lógica de fluxo.
- Prioridades comuns: "Baixa", "Média" / "Media", "Alta", "Crítica" / "Critica". Classes CSS mapeadas em `pdcaApp.js` via `mapPrioridadeClasse`.
- Datas: em partes do projeto as datas são ISO strings (`criadoEm` em `pdcaApp.js` é ISO) e em outras páginas (React) usam timestamps Firestore (`criadoEm.seconds`). Tenha atenção ao formato quando ler/escrever.

UI / patterns
- Componentes React principais: `src/components/PdcaListWithFilters.jsx` (lista + visões salvas), `src/components/Menu.jsx` (navegação), páginas em `src/pages/*` (ex.: `PdcaDashboardPage.jsx`).
- Exportação CSV: utilitário em `src/utils/exportPdcasToCsv.js` — usa `;` como separador e faz escape de aspas.

Integrações e pontos de atenção
- Firestore queries padrão: `collection(db, 'pdcas')` e `orderBy('criadoEm','desc')` — evitar renomear `criadoEm` sem migrar dados.
- Autenticação: `src/firebase.js` exporta `auth` e `db`; funções em `src/pdcaApp.js` usam `onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`.

Edição segura
- Ao alterar fluxos, mantenha compatibilidade com ambos os frontends (legacy e React) ou remova explicitamente o legacy primeiro.
- Ao renomear campos do Firestore, atualize todas as consultas em: `src/pdcaApp.js`, `src/pages/*` e `src/components/*`.

Como validar localmente
- Rodar `npm run dev` e abrir `http://localhost:5173`. Use a UI para criar um PDCA (Plan) e verificar a coleção `pdcas` no Firebase Console.
- Teste export CSV usando um conjunto de PDCAs carregados e função `exportPdcasToCsv` — ver `src/utils/exportPdcasToCsv.js`.

Contato e revisão
- Se faltar alguma convenção ou houver regras de estilo internas, me peça para atualizar este arquivo com exemplos adicionais (ex.: formato exato do documento Firestore, sample payloads, scripts de deploy).

Resumo rápido (contrato)
- Inputs: documentos Firestore em `pdcas` com campos `plan`, `do`, `check`, `act`.
- Outputs esperados: UI (React ou legacy) que exibe status por etapa, CSV exportável.
- Erros comuns: formatos de data incompatíveis; renomear campos sem migrar consultas; alterar strings de status.
