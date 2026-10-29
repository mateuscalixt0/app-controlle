# Andamento

## Espaçamento do catálogo nas faltas — 29/10/2026

- Lista de produtos com 12px entre opções, preenchimento interno e texto que quebra em linhas. Duas colunas no desktop e uma até 600px; rolagem interna limitada a 320/260px para preservar os demais campos do formulário.
- PASSOU: lint, typecheck, 39 testes unitários e dois cenários de seleção/relatório em 375/1280px. Publicação Netlify ainda depende de confirmação do deploy Git.

## Seleção de produto nas faltas e relatório de preços — 27/10/2026

- Implementada a busca no catálogo tanto em `/faltas/novo` quanto na janela de anotar falta. A gravação valida o produto na loja da sessão e salva `product_id`, nome e unidade do catálogo. Nome livre continua disponível para itens sem cadastro.
- Detalhes da falta consultam preços reais do produto, na mesma unidade, nos últimos 90 dias, ordenados por preço unitário (até 100 registros), com fornecedor, data e menor preço histórico. A API exige sessão, filtra por loja e não permite cache público.
- PASSOU: lint, tipos, build, 39 testes unitários e 17 cenários Playwright. Cenários de catálogo e relatório no navegador em 375/1280 px usam respostas simuladas; validação de persistência com conta real e publicação continuam pendentes. Nenhuma migração necessária.

## Revisão somente para produtos realmente parecidos — 27/10/2026

- Implementada a regra de três resultados para itens de NF-e: GTIN/descrição exata/erro de uma letra reaproveitam o produto; variações próximas de qualificador pedem decisão; medida, unidade ou modelo diferentes criam outro produto automaticamente.
- A tela consulta e exibe somente até três candidatos persistidos para cada origem. Com um candidato, pergunta diretamente se o produto recebido é o mesmo produto encontrado. Itens sem candidato não aparecem na revisão.
- A primeira nota de uma loja sem catálogo forma a base inicial automaticamente. Pendências posteriores passam pela mesma classificação; desfazer um vínculo recalcula os candidatos e uma associação automática por erro de digitação continua disponível para correção.
- **PASSOU:** matriz transacional no PostgreSQL com os 12 exemplos definidos pelo gestor, incluindo `arco/aro`, `profissional`, `costa`, medidas, unidades, `sold/soldável`, `bisnaga` e GTIN. A migração completa passou em transação revertida; teste com registros sintéticos confirmou persistência de candidatos, reaproveitamento de erro de digitação e separação por medida.
- **PASSOU:** lint, typecheck, build Next.js, 39 testes Vitest, 15 cenários Playwright/Chromium em 375/1280 px e revisão NF-e sem overflow.
- **PASSOU:** migração aplicada ao Supabase atual. Conferência posterior: 23 produtos preservados, nenhuma origem pendente e nenhum candidato pendente.
- **PENDENTE:** confirmar o deploy Git e testar a importação autenticada no site publicado.

## Preparação e correção do deploy Netlify — 27/10/2026

- Projeto Netlify criado pelo gestor em `controle-app.netlify.app`, conectado ao GitHub sem alterar o domínio de produção da Vercel nem o banco Supabase atual.
- Corrigido o conflito do adaptador OpenNext entre as rotas `/api/boletos/[billId]/documentos/[documentId]` e `/api/boletos/[id]/download`: ambas agora usam o mesmo slug dinâmico `[billId]`.
- Adicionado `netlify.toml` com `npm run build`, saída `.next` e Node 22.13.0. O diretório local `.netlify/` foi incluído no `.gitignore`.
- O código precisa somente de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Credenciais Postgres e chaves administrativas da integração Vercel não devem ser copiadas para a Netlify.
- **PASSOU:** lint, typecheck, build Next.js, 39 testes Vitest, 15 cenários Playwright/Chromium em 375/1280 px e `git diff --check`.
- **PENDENTE:** confirmar o novo deploy Git da Netlify como `Ready`, configurar as duas variáveis públicas nos escopos Builds e Functions se a rota continuar em `/configurar-supabase`, entrar novamente no domínio Netlify e testar `/compras` com um XML sintético enviado anteriormente.

## Reteste da leitura XML e revisão de produtos — 27/10/2026

- Corrigida a expressão de abertura do XML, que rejeitava `<NFe>` sem prefixo de namespace.
- Os três arquivos fictícios enviados pelo gestor (`nota_teste_1_alfa.xml`, `nota_teste_2_beta.xml` e `nota_teste_3_gama.xml`) foram lidos com 20 itens em cada nota, chaves ausentes aceitas e cabeçalhos/totais preservados. A migração amplia `unit_price` para `numeric(20,10)` para conservar as dez casas decimais permitidas em `vUnCom`.
- A validação de GTIN rejeitou os códigos sintéticos com dígito verificador incorreto; apenas os GTINs dos itens 7 e 14 são válidos nos três arquivos. Isso segue a regra de não usar código de barras inválido como evidência de equivalência.
- **PASSOU:** lint, typecheck, build, 39 testes Vitest e 15 cenários Playwright/Chromium. A revisão NF-e foi conferida em 375 e 1280 px sem overflow; a suíte também preservou os fluxos existentes de boletos.
- **PASSOU:** migração completa em transação revertida no Supabase conectado e cenário transacional com importação sem chave, bloqueio de duplicidade, preço retido até confirmação, confirmação idempotente, reutilização do vínculo e isolamento entre duas lojas.
- **PASSOU:** migração aplicada ao projeto Supabase conectado em 27/10/2026 e estrutura conferida após a aplicação: três tabelas, cinco RPCs e políticas de leitura/proteção de preços presentes.
- Código integrado à `main`. O primeiro acionamento da Vercel falhou antes do build com `Resource provisioning failed`; uma nova publicação foi solicitada pelo commit deste registro. O reteste autenticado pelo gestor no endereço publicado continua pendente.

## Importação segura e vínculo manual de produtos NF-e — 26/10/2026

- Parser passou a aceitar NF-e com ou sem declaração XML e tags com namespace; preserva número do item, código do fornecedor, descrição original, GTIN válido, NCM, unidade e valores decimais. Normalização textual é determinística e serve apenas para sugerir candidatos; unidades e medidas incompatíveis não entram nas sugestões.
- Chave de acesso deixou de ser obrigatória: o parser lê a chave do atributo `Id` ou do protocolo quando presente. Se estiver ausente, a importação usa CNPJ do fornecedor, modelo, série, número e data como impressão digital de duplicidade.
- A migração `20261026120000_associacao_manual_produtos_nfe.sql` cria a identidade do item por loja/fornecedor, guarda itens importados sem produto principal e libera preços no catálogo somente após confirmação. Código do fornecedor não é global. Vínculos confirmados são reutilizados nas próximas importações; mudanças incompatíveis criam uma nova origem pendente e preservam o histórico anterior.
- `/compras` apresenta itens pendentes, sugestões textuais sem seleção automática, associação a produto existente, cadastro como produto separado ou rejeição. A RPC deriva a loja da sessão, checa os vínculos no banco e preserva a importação transacional e a unicidade por chave de acesso.
- Rejeições são registradas por par de origem e candidato. GTIN ambíguo deixa de gerar sugestão e o banco bloqueia a confirmação do mesmo GTIN para produtos diferentes. O vínculo confirmado pode ser desfeito pela tela, removendo somente os preços gerados pelos itens NF-e vinculados.
- **LIMITES DESTA ENTREGA:** histórico ainda não tem tela de comparação; faltas ainda não exibem os preços associados. O navegador usa serviços simulados e não comprova sessão real, embora as RPCs tenham sido exercitadas em transação no banco conectado.
- Importações feitas antes desta migração não são reclassificadas automaticamente: o esquema anterior não permite distinguir com segurança quais preços foram associados por nome. Esses registros históricos exigem revisão separada antes de serem usados como equivalências confirmadas.
- Próximo passo: confirmar a nova execução do deploy e repetir a importação autenticada com os três XMLs enviados.

Atualizado em 27/10/2026.

## Lista local de fornecedores no cadastro de boleto — 16/10/2026

- Ao abrir o campo de beneficiário, a tela requisita todos os fornecedores da loja uma única vez. A rota autenticada percorre páginas de 500 registros, mantém o recorte por `store_id` e devolve a relação em ordem alfabética estável.
- A digitação agora filtra essa lista no navegador, sem novas consultas. O seletor exibe aproximadamente cinco itens e permite rolar os demais. Um fornecedor criado entra na lista local já ordenada e fica selecionado sem reiniciar a tela.
- **PASSOU:** `npm run lint`, `npm run typecheck`, `npm test` (35 testes), `npm run build` e 9 cenários Playwright da importação em Chromium. O cenário de fornecedor comprova a ordem alfabética, a rolagem e uma única requisição mesmo após digitar e criar um novo nome.
- **PENDENTE:** enviar a atualização da PR #22 e validar em sessão autenticada com fornecedores reais. A `main` não será alterada sem novo pedido de Mateus.

## Busca e criação de fornecedor no cadastro de boleto — 16/10/2026

- Corrigida a consulta de fornecedores: a aplicação pedia a coluna inexistente `document`, o que fazia a lista e a criação poderem falhar.
- Ao digitar no beneficiário, a tela informa que está buscando e mostra fornecedores da loja atual. Sem nome equivalente, exibe “Criar fornecedor”; após criar, seleciona o nome novo no mesmo campo, sem recarregar a tela.
- **PASSOU:** `npm run lint`, `npm run typecheck`, `npm test` (35 testes), `npm run build` e 9 cenários do Playwright na importação, incluindo fornecedor existente, criação em tela e fluxos PDF/câmera. A consulta no Supabase confirmou que a tabela possui somente `id`, `store_id`, `name` e `created_at`; leitura limitada à loja permanece na rota e na ação.
- Próximo passo: publicar no mesmo projeto Vercel e validar no navegador do gestor com fornecedores reais.

## Atualização no projeto Vercel existente — 16/10/2026

- Publicação concluída: PR #21 integrada à `main`, commit `ed72be8731c463ea5ae73a6dfb7fbd28fbc160d5`. Status da Vercel confirmado como `success` no deploy https://vercel.com/cm-tech1/app-controlle/729Xq7Ne1mTnmXW6CEkMDQgKzFJz . Endereço de uso: https://app-controlle.vercel.app/boletos/novo . Este registro posterior ao deploy está no workspace local.
- Mateus esclareceu e autorizou a substituição do visual no mesmo endereço `https://app-controlle.vercel.app`, mantendo backend e conexão existentes. A orientação anterior de criar outro projeto de hospedagem foi desnecessária e está substituída.
- A integração GitHub confirmou deploy bem-sucedido da branch de design no projeto Vercel `cm-tech1/app-controlle`. Não é necessário criar projeto nem recadastrar variáveis.
- Incorporada a correção atual da `main` que inicia a lista somente com boletos pendentes; filtros e paginação continuam disponíveis com os novos cartões.
- Revalidados lint, tipos e 35 testes unitários; quatro testes do visual no Chromium passaram em 375/1280 px, incluindo cópia, download, cancelamento e erro. APIs, ações de gravação, autenticação e migrações não diferem da `main`.
- A publicação no projeto existente foi solicitada expressamente após informar as pendências. Validação com sessão real, persistência e câmera física permanece pendente, sem alegação de aprovação desses testes. Acesso HTTP direto ao domínio retorna 403 neste ambiente; a confirmação do deploy deve usar o status da Vercel no GitHub.


## Integração do design aprovado ao aplicativo — 15/10/2026

- Mateus aprovou o protótipo inteiro e autorizou integração. Implementação preparada na branch de homologação `feat/design-aprovado`; não houve merge nem publicação da aplicação real em produção nesta etapa.
- Aplicada identidade cinza/branco/preto/lima, cartões arredondados e espaçamento do protótipo. Navegação lateral no desktop e inferior no celular: Início, Boletos, Faltas e Minha loja. Login, formulários e importadores herdam os mesmos padrões.
- Início substitui exemplos por consultas da loja autenticada: soma em centavos dos boletos pendentes (incluindo vencidos), próximos vencimentos e contagem de faltas. Leitura paginada evita truncar totais pelo limite de linhas da API; falhas geram erro, não saldo fictício.
- Boletos: detalhes em diálogo, copiar na lista e nos detalhes, download pela rota privada existente, editar, registrar pago/cancelado com erro e carregamento. Sem novo fluxo de pagamento bancário ou alteração de políticas de dados.
- Faltas: ordem recente/antiga e filtro por empresa de referência anotada, com filtros preservados na paginação; detalhes exibem inclusão, quantidade e referências reais. Comparação de vendedores/menor preço ainda não conectada, explicitada na interface. Minha loja mostra conta e loja reais e abre a importação XML já existente.
- Contrato visual criado em `docs/DESIGN.md`: referência aprovada, tokens, fonte, raios, espaçamentos, layouts, telas, estados, acessibilidade e limites. `AGENTS.md`, mapa documental e referência apontam para ele.
- **PASSOU:** `npm run lint`, `npm run typecheck`, `npm test` (33 testes), `npm run build` e `git diff --check`. Build mantém aviso conhecido sobre convenção `middleware` do Next.js.
- **PASSOU:** 12 cenários distintos de Playwright/Chromium, em execução principal mais reexecução direcionada após correções. Início, lista/detalhes de boletos, faltas e login renderizados com componentes reais e fixtures em 375/1280 px, sem overflow ou erros JavaScript; foco/Enter/Escape, ocultar total, clipboard, falha e sucesso de download, ausência de documento, pago/cancelado e falha sem sucesso falso. Leitura PDF digital/escaneado/foto, recuperação de upload, cancelamento e câmera sintética também passaram. Capturas de início desktop/mobile e login mobile inspecionadas.
- Ajustados mocks do harness e expectativas antigas de fornecedor automático nos testes de leitura para a decisão vigente de preenchimento manual; nenhuma mudança no parser. Falhas iniciais de configuração do harness e dessas expectativas foram corrigidas; nenhum teste foi removido.
- **PENDENTE para liberação:** login com conta real, persistência e isolamento com duas lojas, download de arquivo privado real, câmera física e navegação autenticada completa (incluindo Minha loja, criação da loja, XML e cadastro/edição). Testes de UI usam serviços simulados e não comprovam essas integrações. Sem alterações de schema/RLS nesta tarefa.
- Próximo passo: executar o gate autenticado em ambiente de homologação antes de commit/merge/publicação. O endereço Sites continua sendo o protótipo independente; não representa o estado de deploy do Next.js.

## Preparação da homologação — 16/10/2026

- Branch `feat/design-aprovado` enviada ao repositório remoto no commit `c154e0fcb4904b32e2d4d05356c3c1e70915e1b4`: https://github.com/mateuscalixt0/app-controlle/tree/feat/design-aprovado . Produção não foi alterada.
- A criação de PR pelo ambiente foi recusada pela permissão atual da API do GitHub. A PR pode ser aberta pelo link sugerido pelo próprio GitHub: https://github.com/mateuscalixt0/app-controlle/pull/new/feat/design-aprovado .
- Não existe configuração local do projeto Vercel, credencial Vercel nem `.env.local` de homologação. A CLI confirmou sessão desconectada. Não foi criado deploy temporário sem as variáveis do Supabase, pois ele não permitiria validar login ou dados reais.
- Próximo passo: conectar o repositório/branch à Vercel (ou fornecer acesso à conta/projeto de homologação) e configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do projeto Supabase de teste. Depois disso, publicar a prévia e executar o roteiro autenticado.

## Detalhes e filtros de faltas no protótipo — 15/10/2026

- Publicado no mesmo Site privado: commit `8616e0d83a47472d4fd5976f42d4ce22efb52885`, deploy confirmado como `succeeded`.
- Minha loja: botão “Importar XML de produtos” abre aviso de recurso futuro; nenhum arquivo é selecionado, enviado ou processado.
- Faltas: cada produto abre modal com data/hora de inclusão, quantidade, situação, lojas e preços fictícios por unidade, com destaque ao menor preço registrado. Novos produtos sem referência mostram estado sem preços.
- Filtros combináveis de loja e ordenação por mais recentes/mais antigos; seleção de comprado permanece independente da abertura dos detalhes.
- Verificado com Chromium/Playwright em 375/1280 px: ordenação, filtro por loja, menor preço, novo produto sem preços, seleção de comprado, teclado/Enter/Escape, modal de XML e ausência de overflow/erros JavaScript. Capturas mobile inspecionadas.
- Dados são demonstrativos em memória. Preços registrados não garantem disponibilidade/oferta atual e não incluem frete ou condições de pagamento. Aplicação real não alterada. Próximo passo: avaliação do usuário.

## Copiar código e baixar PDF no protótipo — 15/10/2026

- Publicada atualização privada no mesmo endereço: https://controle-prototipo-mateus.quickmorel1.chatgpt.site/#boletos . Commit `b106a03d1563063cedee8b0f29fbeabfd131af72`; deploy confirmado como `succeeded`.
- Detalhes do boleto agora mostram linha digitável fictícia, botão de copiar e download de PDF demonstrativo. Lista de boletos tem ícone de copiar independente da abertura dos detalhes.
- Verificações realizadas antes da interrupção: clipboard na lista e nos detalhes, falha de permissão, download e leitura do PDF, layout sem overflow em 375/1280 px; capturas mobile inspecionadas. Publicação retomada após limite de uso interromper a aprovação automática.
- Código e PDF identificados como exemplos sem validade para pagamento. Alterações restritas ao protótipo; aplicação real preservada. Próximo passo: avaliação do usuário.

## Protótipo navegável com Taste Skill — 14/10/2026

- Criado protótipo separado em `/workspace/sites/controle-prototipo`, seguindo a referência Neobank: cinza-claro, branco, preto, verde-lima e cartões arredondados. Aplicada a skill `redesign-existing-projects` da coleção Taste Skill, com as preferências do usuário prevalecendo.
- Telas: início, boletos, adicionar/conferir boleto, faltas e minha loja. Busca, filtros, detalhes, registro simulado de pagamento e inclusão/conclusão de faltas funcionam em memória; recarregar restaura os exemplos. Câmera/PDF são simulações explícitas, sem upload nem extração.
- Verificação: JavaScript validado; Chromium/Playwright conferiram cinco rotas em 375/1280 px sem overflow e os fluxos de busca vazia, filtro, cadastro/pagamento simulado e inclusão/conclusão de falta; sem erros JavaScript. Capturas do início inspecionadas em mobile e desktop.
- Publicação privada no Sites confirmada (`succeeded`): https://controle-prototipo-mateus.quickmorel1.chatgpt.site — projeto `appgprj_6acfe0d301588191b6d07dad968c68a8`, commit `26d32105eb7ef8ada865aae0bab4ba51043fa749`. Código enviado ao repositório privado e pacote gerado manualmente porque os helpers Sites não estavam disponíveis no ambiente.
- Próximo passo: colher a avaliação visual do usuário antes de adaptar a aplicação real. O protótipo não valida dados, login ou operações de produção.

## Troca para Taste Skill e referência escolhida — 14/10/2026

- Instalada a coleção de `Leonxlnx/taste-skill` em `.agents/skills/`, na revisão `f624f37a8c650b9cc550253104925efe4c8de246`, por cópia manual via integração GitHub. Removida a skill anterior `interface-design`; preservada a skill de QA.
- Atualizado `AGENTS.md` para orientar o uso das novas skills e priorizar a imagem Neobank escolhida pelo usuário. Registradas as preferências em `docs/visual/REFERENCIA_ESCOLHIDA.md`.
- A proposta anterior “balcão organizado” foi rejeitada; seus arquivos permanecem apenas como histórico, com aviso na análise.
- Verificações: hashes Git dos 45 arquivos originais, leitura dos JSONs e `git diff --check`. Scripts auxiliares não executados. A descoberta automática das novas skills pode exigir uma nova sessão; os arquivos estão disponíveis para leitura direta.
- Próximo passo: adaptar as telas à referência escolhida. Nenhuma alteração visual da aplicação ou publicação foi feita nesta troca de skills.

## Análise visual com interface-design — 14/10/2026

- Analisados estilos, navegação, início, boletos, captura, faltas, compras e login. Recomendações e evidências em `docs/visual/ANALISE_VISUAL.md`.
- Criadas prévia HTML da direção “balcão organizado” e reconstrução parcial da lista atual, ambas com dados fictícios. Aplicativo não alterado nesta análise.
- Verificação: inspeção de código e `git diff --check`. Renderização pendente: Chromium falhou por restrição do ambiente e o executável do Playwright está ausente. Nenhuma alegação de validação visual ou funcional em produção.
- Próximo passo recomendado: implementar e verificar a lista de boletos como referência visual; depois expandir para as demais telas.

## Skill de interface instalada — 14/10/2026

- Instalada localmente em `.agents/skills/interface-design/`, com `SKILL.md`, metadados do Codex, referências e licença MIT do repositório `Dammyjay93/interface-design`.
- Origem fixada na revisão `2f9be3206855bcb2d1d0af262c8bae25cba6658d`; instalação manual pela integração GitHub devido à indisponibilidade do proxy do terminal.
- Registrado em `AGENTS.md` o uso da skill nas próximas tarefas de interface. Nenhuma tela ou comportamento do aplicativo foi alterado.
- Validação: conferência dos arquivos contra os hashes Git da origem e revisão de whitespace. Testes da aplicação não se aplicam à instalação documental.
- Próximo passo: aplicar a skill à próxima tarefa de interface solicitada. O catálogo de skills pode exigir uma nova sessão para exibir a instalação; o arquivo já pode ser lido diretamente.

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
