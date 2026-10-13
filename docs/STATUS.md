# Andamento

Atualizado em 13/10/2026.

## Pagamentos reaparecendo após atualização da lista — 13/10/2026

- Diagnóstico confirmado nos logs e no Supabase: a action executou `PATCH /rest/v1/bills` com resposta 200; o registro verificado está `status = paid` e tem `paid_at` preenchido.
- A causa visível era o filtro vazio da rota `/boletos`, que significava todos os estados. Após recarregar, boletos pagos apareciam novamente na aba “Todos”, embora estivessem pagos no banco.
- A lista agora abre em “Em aberto”; o filtro “Todos” continua disponível explicitamente e os filtros “Pagos” e “Cancelados” continuam acessíveis. Ao marcar pago, a tela volta para `/boletos` para aplicar o filtro inicial.
- Validação executada: lint, typecheck, 30 testes unitários e build passaram. A revisão de navegador visual continua pendente porque o Chromium do Playwright não está instalado e o download do executável foi bloqueado com HTTP 403.

## Gate de QA obrigatório — 13/10/2026

- Criada a skill `.agents/skills/qa/SKILL.md` para exigir revisão de diff, testes automatizados, fluxos críticos, autorização, persistência e responsividade antes de commits de comportamento e merges na `main`.
- Atualizado `AGENTS.md` para tornar a skill obrigatória e exigir que PRs registrem testes aprovados e pendências.
- A suíte encontrou e corrigiu um teste desatualizado que ainda esperava extração automática do fornecedor, comportamento removido por decisão de produto.
- Verificações executadas: `npm run lint`, `npm run typecheck`, `npm test` (27 testes) e `npm run build`, todas aprovadas. O build mantém apenas o aviso conhecido de convenção `middleware` do Next.js.

## Câmera leitora e PDFs com revisão e original privado — 11/10/2026

- **Tarefa 1:** câmera traseira com enquadramento, leitura ITF automática, validação de código, captura JPG e encerramento do vídeo; alternativa de fotografar sem código ou enviar foto. Valor vem do código válido; beneficiário depende de OCR/entrada manual e data ambígua exige conferência.
- **Tarefa 2:** PDF.js lê PDFs digitais e percorre as páginas; Tesseract em português processa fotos e páginas incompletas/escaneadas. Recursos servidos pelo próprio app. O fluxo principal deixa de depender do n8n; a rota legada foi preservada e protegida.
- Revisão simples com beneficiário, valor, vencimento e código editáveis. Falha/cancelamento mantém o original e os dados parciais; campos ausentes podem ser preenchidos. Limites: PDF/JPG/PNG de até 10 MB, leitura de até três minutos, sem garantia de extração para senha, corrupção ou conteúdo ilegível. Não combina boletos diferentes encontrados no mesmo arquivo.
- Salvamento com UUID/caminho estáveis permite repetir upload/vínculo na mesma tela sem novo boleto. O servidor verifica loja, boleto e arquivo existente antes de vincular. Fechar/recarregar após falha não retoma automaticamente o arquivo. Originais só são enviados ao confirmar.
- **Correção aplicada no Supabase conectado:** migração aditiva `20261011162936_compatibilidade_leitura_boletos.sql`, com três colunas ausentes (`beneficiary_document`, `digitable_line`, `extraction_status`), verificadas por consulta após aplicação. Bucket já era privado; não foram alteradas políticas ou dados financeiros.
- **Verificações:** 27 testes unitários/actions; 8 testes Chromium com PDF digital, foto OCR, PDF escaneado em segunda página, vídeo sintético ITF, câmera negada, PDF inválido, cancelamento e falha/repetição de upload. Componente conferido visualmente em 375/1280 px, sem overflow. Build, tipos e lint passaram; lint mantém um warning preexistente em faltas. `git diff --check` passou.
- Teste SQL transacional real com duas lojas sintéticas, owner/member, anônimo e vínculos cruzados passou; fixtures revertidos. Confirma isolamento de boletos/metadados, não dos bytes do Storage. Advisors antes/depois mantiveram os mesmos avisos preexistentes; detalhes em `docs/LEITURA_BOLETOS.md`.
- **Validação pendente:** publicação do frontend, câmera física Android/iPhone, amostras anonimizadas de fornecedores e upload/download autenticado completo (nos testes de navegador, persistência é simulada). Não afirmar conclusão do piloto nem validação integral do armazenamento.
- **Entrega local:** implementação e documentação em commits na branch `feat/leitura-boletos-foto-pdf`. O envio ao repositório público foi bloqueado pela revisão automática por exigir autorização explícita de publicação; nenhum PR foi criado.
- **Próximo passo:** obter autorização para enviar a branch e abrir PR, publicar preview e conferir os dois caminhos no celular com uma sessão real. Guia técnico e comandos: `docs/LEITURA_BOLETOS.md`.

## Envio de documento para leitura via n8n — 11/10/2026

- Removido o OCR e o leitor de código executados no navegador, que podiam deixar o envio preso no celular.
- Arquivo e câmera agora enviam PDF/JPG/PNG para `/api/boletos/extract`; a rota encaminha o arquivo binário ao webhook n8n em `multipart/form-data`, no campo `file`, com nome, MIME e tamanho como campos auxiliares.
- A resposta do n8n preenche a revisão do boleto e aceita objetos aninhados (`json`, `body`, `data`, `result` ou `output`) e nomes de campos em português ou inglês.
- Mantidos a conferência humana, o salvamento no Supabase e o upload privado do documento somente depois de salvar o boleto.
- Removidas as dependências locais de OCR, PDF e ZXing, sem alteração de schema, RLS ou middleware.
- Verificações: `npm run lint` passou com um warning preexistente; `npm run typecheck`, `npm run build` e `git diff --check` passaram.

## Responsividade e leitura local de boletos — 10/10/2026

- Removida a opção “Preencher manualmente” da tela de adicionar boleto, mantendo o fluxo de arquivo/foto com conferência antes de salvar.
- Corrigido o seletor de XML para ocultar o controle nativo que ultrapassava o card em telas pequenas; ajustadas larguras flexíveis e reservas de espaço da navegação inferior.
- Reduzida a altura artificial da tela de adicionar boleto, com compactação adicional em telas baixas.
- Adicionados `tesseract.js` e `pdfjs-dist` carregados sob demanda: fotos e PDFs escaneados passam por OCR local no dispositivo; PDFs digitais continuam usando extração de texto antes do OCR.
- O processamento exibe progresso, permite selecionar novamente o mesmo arquivo e mantém revisão humana; campos não reconhecidos continuam vazios.
- Limitação: a primeira execução do OCR pode baixar o worker/modelo em português e consumir mais tempo, memória e bateria no celular. A qualidade ainda precisa ser validada com boletos reais.
- Otimização posterior: o worker/modelo do OCR agora é reutilizado durante a sessão e não é reinicializado para cada página do PDF, reduzindo a demora após o primeiro carregamento.
- OCR ajustado para usar apenas a primeira página de PDF escaneado, limitar imagens a 1800 px, tentar código de barras/QR com ZXing e falhar com mensagem após 30 segundos em vez de permanecer carregando indefinidamente.
- Fluxo principal de boletos reorganizado para leitura de código: câmera abre leitor ZXing, arquivo/PDF tenta localizar o código e há entrada manual para 44, 47 ou 48 dígitos; valor e vencimento são derivados após validação do código.
- Verificações: `npm run lint` passou com um warning preexistente; `npm run typecheck`, `npm run build` e `git diff --check` passaram.

## Otimização de navegação e sessão — 10/10/2026

- Criados estados de carregamento para as rotas principais, com esqueleto visual e `aria-busy`, evitando que a tela anterior permaneça parada durante a navegação.
- Navegação após importação de boleto passou a usar `router.push` e `router.refresh`, sem recarga completa.
- Criado helper cacheado de sessão usando `auth.getClaims()`, com resolução única do usuário e da loja por requisição; páginas, actions e rota de documento foram migradas.
- Boletos agora carregam o nome do fornecedor na mesma consulta por relação, sem segunda consulta de fornecedores.
- Verificações: `npm run lint` passou com um warning preexistente de variável não usada; `npm run typecheck`, `npm run build` e `git diff --check` passaram.
- O middleware foi preservado para continuar renovando a sessão com `getUser()`.
- Próximo passo: confirmar o deploy de produção e validar a navegação autenticada no domínio publicado.

## Publicação e responsividade do login — 10/10/2026

- PR #4 foi mesclado à `main`; a correção limita a largura do formulário em telas grandes e adapta espaçamentos, tipografia e campos para mobile e paisagem.
- As variáveis públicas de conexão do Supabase foram configuradas no Vercel para `Production`; o build de produção ficou `Ready` no commit `4c99b36`. A rota `/login` abriu no domínio publicado.
- Não foi realizado login com credenciais do usuário. A verificação visual se limitou à rota de login; as demais páginas e fluxos ainda não passaram por uma revisão responsiva abrangente.
- A regra geral para páginas futuras está em `AGENTS.md`: conferir telas afetadas em 375px e desktop, além de evitar cortes e rolagem horizontal.

## Diagnóstico do build do PR — 09/10/2026.

## Diagnóstico do build do PR — 09/10/2026

- A captura da Vercel identifica erro de TypeScript em `src/app/boletos/page.tsx:52`: o tipo de `bill.suppliers` foi inferido como `never` e a leitura de `.name` falhava.
- A causa é a consulta aninhada numa relação de FK composta, com cliente Supabase sem tipos gerados. A listagem agora busca a página de boletos e consulta os fornecedores referenciados separadamente, sempre filtrando ambos pelo `store_id` da sessão; associa os nomes pelo `supplier_id` e mantém o estado de fornecedor removido.
- Também foi corrigida a inferência opcional do filtro de prioridade em `src/app/faltas/page.tsx`, erro de tipo adicional que impedia a validação completa.
- Validação na branch `fix/bill-supplier-relation`, baseada no commit `c0f94bf4f089011341b276c3904417bd286ccfcd`: `npm run typecheck` e `npm run build` aprovados. `git diff --check` aprovado.
- Correção enviada à branch `work` no commit `132b734`. Próximo passo: aguardar o novo deploy de preview na Vercel e confirmar que o build publicado passou.

## Ajuste pontual do protótipo HTML — Lista de faltas, 09/10/2026

- Removidos apenas os campos Tipo de produto e Empresa de referência de Anotar produto; preservados Produto, Quantidade, Unidade e os botões existentes.
- Ver faltantes mantém busca, filtros, ícones, nomes, empresas e quantidades. Acrescentadas faixas laterais vermelha, laranja e azul-claro conforme a referência e preços unitários fictícios em reais.
- Conferido no Chromium com Playwright em 375px: campos removidos, quatro preços, ausência de rolagem horizontal, troca de abas, filtros combinados e busca sem resultados. Nenhum erro JavaScript observado. Captura da consulta inspecionada visualmente.
- Alteração enviada ao GitHub no PR #2. Mateus fará a publicação manual na Vercel usando `docs/d02/prototipo.html` como `index.html`. A publicação desta revisão ainda não foi confirmada.
- Próximo passo: publicação manual e aceite visual de Mateus. Não conclui D02 nem implementa gravação real.

O ajuste acima refere-se somente ao HTML. A aplicação Next.js e suas verificações registradas abaixo foram preservadas na integração; seus componentes não foram alterados neste PR.

## Entrega atual — telas e navegação mobile para validação (D02)

- Design mobile preservado: fundo claro, cartões arredondados, ações em rosa e largura máxima de 480px.
- Rodapé reorganizado com cinco destinos: Adicionar boleto, Boletos a pagar, Início central, Lista de faltas e Compras e preços.
- Telas de validação criadas para início, boletos, envio por foto/documento, lista de faltas, anotação simplificada e compras/preços.
- Lista fictícia demonstra prioridades com cor e texto, menor preço registrado, ausência de histórico, busca e filtros combinados em memória.
- Detalhes fictícios abrem em modal mobile, recebem foco no fechamento, fecham com `Esc`, têm rolagem e mostram estados com zero, um ou mais registros sem inventar tendência.
- Todos os dados de exemplo e interações sem persistência estão identificados como protótipo. Upload e botões de gravação permanecem desativados.

**Status de D02:** telas prontas para validação de produto por Mateus. Não considerar anotação, filtros, histórico, OCR, XML ou cadastro de boleto concluídos: ainda não existe persistência, login, banco de negócio ou processamento de arquivos.

## Verificações desta entrega

- `npm run lint` e `npm run typecheck`: aprovados.
- Navegador Chromium em 375×812: seis rotas responderam HTTP 200, exibiram os cinco itens de navegação, não apresentaram rolagem horizontal nem erros no console.
- Modal: abriu pelo cartão, colocou foco no botão “Fechar detalhes” e fechou com `Esc`.
- Busca e filtros combinados foram exercitados apenas sobre dados fictícios em memória; recarregar restaura os exemplos.
- `npm run build`: aprovado com webpack; oito rotas estáticas geradas. O build usa webpack porque o Turbopack deste ambiente não consegue abrir a porta interna usada pelo processador CSS.

## Como conferir esta entrega

1. Execute `npm run dev` e abra `http://localhost:3000`.
2. Percorra os cinco destinos do rodapé, mantendo Início no centro.
3. Em Lista de faltas, combine busca, prioridade e “Sem classificação”; toque em um item e teste o fechamento do modal.
4. Confira a ordem visual enviar → ler → conferir → salvar em Adicionar boleto.
5. Valide textos, campos e organização. Nenhuma ação desta entrega deve ser usada para cadastrar dados reais.

## Próxima tarefa

Executar validações com dependências instaladas; configurar variáveis do Supabase na hospedagem; cadastrar conta Auth, habilitar proteção contra senhas vazadas e testar isolamento. Depois habilitar upload privado/OCR e histórico de preços conforme prioridade.

## Entrega atual — esquema inicial Supabase (D04, parcial)

- Criadas migrações reproduzíveis para lojas, membros, fornecedores, boletos, produtos, faltas e histórico de preços.
- Valores de boletos usam centavos inteiros; preços unitários usam decimal fixo; vencimento/preço são datas civis.
- Chaves estrangeiras compostas evitam vínculos de negócio entre lojas. RLS habilitado nas tabelas e operações de negócio limitadas a membros autenticados da loja.
- Seed SQL contém somente registros sintéticos, identificados como demonstração.
- Nenhuma migração foi aplicada ao projeto remoto; `.env.local`/segredos não foram acessados ou gravados.

**Limitações na entrega inicial:** a função de cadastro da loja, autenticação e testes de isolamento ainda não existiam. A atualização abaixo registra o que foi implementado desde então.

**Verificações desta entrega:** não executadas nesta sessão; Supabase CLI e ambiente com credenciais locais não foram conferidos. Próximo passo é validar migração/seed em Supabase local, corrigir eventuais erros e então testar as políticas.

## Atualização — Supabase e autenticação

- Aplicadas ao projeto Supabase de desenvolvimento `nmuiczryoqcospdithdx` as migrações de esquema/RLS, criação segura de owner e restrição de execução RPC pública. Tabelas confirmadas com RLS habilitado; dados ainda vazios.
- Criada tela de login por e-mail/senha e primeiro cadastro de loja após autenticação. O usuário não pode escolher seu UUID ou atribuir a si mesmo um papel via formulário.
- Integradas anotações e consulta paginada da lista de faltas, com busca e filtro por prioridade aplicados na consulta do servidor.
- Integrados cadastro manual e consulta paginada de boletos, com valores em centavos no banco e busca/status no servidor.
- Branch enviada ao GitHub: `work`; commits `a741cd7` e `da97dd0`. Não foi aberto PR porque a autenticação do GitHub CLI está inválida; a URL de criação é https://github.com/mateuscalixt0/app-controle/pull/new/work.
- `.env.local` local foi preenchido com URL e chave publicável do projeto; arquivo ignorado pelo Git. Não publicar `service_role`.
- Pendências: conta Auth precisa ser criada pelo titular; variáveis precisam estar no ambiente da hospedagem; habilitar proteção contra senhas vazadas; painel inicial, anexos/OCR e histórico de preços ainda não estão implementados.
- Migrações confirmadas no projeto remoto: esquema, loja/owner e endurecimento das funções/políticas; RLS está habilitado. Arquivos locais usam as mesmas versões registradas pelo Supabase. Não foram criados dados fictícios no banco remoto para não deixar uma loja sem owner acessível.
- Lint/typecheck/build não executados: npm não conseguiu instalar as dependências de forma íntegra no ambiente; o cache/registry retornou tarballs corrompidos. `git diff --check` aprovado.

## Integrações e limitações

- Quadro de referência: https://trello.com/b/gY23LQ8z.
- Os cartões não foram atualizados nesta entrega; status do arquivo não implica movimentação no Trello.
- Supabase conectado; Vercel e Resend ainda não foram conectados a este repositório.
- Existe somente o projeto principal informado pelo titular; ambiente Supabase separado para testes ainda não foi definido.
- Existe um layout anterior na Vercel, mas esta versão não foi publicada.
- Sem tabelas de negócio, login, persistência, leitura OCR/XML ou dados reais no repositório ou banco.

## Entrega anterior — integração inicial com Supabase (parte de D03)

- Projeto Next.js 16 com TypeScript estrito, React 19 e Tailwind 4.
- Projeto Supabase `nmuiczryoqcospdithdx` ativo e conectado por chave publicável moderna; banco vazio, PostgreSQL 17.11.
- Clientes separados para navegador e servidor; `.env.local` ignorado pelo Git.
- Build, consulta autenticada e advisors do Supabase aprovados na entrega.

## Sincronização com GitHub — 09/10/2026

- Integrado o histórico remoto até `bd4583a`, incluindo o protótipo HTML anterior e suas decisões.
- O site https://app-controlle-layout.vercel.app foi publicado por envio direto de arquivos, conforme registro remoto. Não há deploy automático do GitHub configurado nessa publicação.
- Publicação da aplicação Next.js continua pendente de acesso à Vercel; salvar no GitHub não confirma atualização do site.
- `.env.local` permanece fora do Git. No Mac, clonar o repositório e executar os comandos do README dentro da pasta clonada.
