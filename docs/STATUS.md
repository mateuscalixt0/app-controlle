# Andamento

Atualizado em 09/10/2026.

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

Integrar as telas aos dados reais (começando por lista de faltas) e testar isolamento com duas lojas. IA de classificação permanece explicitamente pendente.

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
- `.env.local` local foi preenchido com URL e chave publicável do projeto; arquivo ignorado pelo Git. Não publicar `service_role`.
- Pendências: conta Auth precisa ser criada pelo titular; habilitar proteção contra senhas vazadas (o advisor avisou que está desligada); testes de login/RLS ainda não rodaram; UI de produtos/boletos/lista continua com exemplos em memória.
- Lint/typecheck/build não executados: dependência `zod-validation-error` não estava disponível no cache offline e npm não conseguiu baixar sem rede. Push não foi feito.

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
