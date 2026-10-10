# App Controle

Aplicativo para pequenos lojistas de material de construção organizarem boletos e planejarem compras com histórico de preços por fornecedor.

**Estado:** aplicação Next.js conectada ao Supabase, com login e alguns fluxos de boletos e faltas implementados. O registro de `docs/STATUS.md` confirma publicação de produção e abertura da página de login, mas não confirma login real com a conta do titular. OCR, arquivos, histórico de preços e dashboard continuam pendentes. Consulte [Comece aqui](docs/COMECE_AQUI.md) para o resumo e mapa da documentação.

## Gestão e desenvolvimento

- Mateus administra o produto, prioridades, orçamento e validação na loja.
- Codex cuida de arquitetura, código, banco, segurança, testes e documentação.
- Quadro: [App Controle — Construção do MVP](https://trello.com/b/gY23LQ8z).
- Etiquetas: Gestão de Boletos (azul) e Gestão de Produtos (verde); tarefas compartilhadas recebem ambas.

## Por onde começar

1. Leia [docs/COMECE_AQUI.md](docs/COMECE_AQUI.md) para entender o projeto e encontrar a documentação certa.
2. Siga [AGENTS.md](AGENTS.md) para as regras de trabalho.
3. Consulte apenas o trecho relevante de [docs/STATUS.md](docs/STATUS.md), [docs/DECISOES.md](docs/DECISOES.md) e [PLANO_EXECUCAO_TRELLO.md](PLANO_EXECUCAO_TRELLO.md). Não é necessário ler o plano ou o histórico inteiro em toda tarefa.

[PLANO_MVP.md](PLANO_MVP.md) preserva o plano original com ressalvas sobre decisões posteriores. A orientação original para Claude está arquivada em `docs/referencias/CLAUDE_ORIGINAL.md`; o arquivo operacional para Codex é `AGENTS.md`.

## Escopo

**Boletos:** fornecedores, cadastro manual ou por linha digitável, vencimentos, painel, anexos privados, registro de pagamento, comprovantes e lembretes por e-mail.

**Produtos:** itens, lista de compras, preços manuais, comparação de preços recentes e importação de XML de NF-e com vínculo confirmado de produtos.

Comparações exibem **economia potencial**. Gestão de produtos não inclui estoque. Não há pagamento bancário dentro do aplicativo.

## Arquitetura de referência

Next.js 16, React 19, TypeScript 6 e Tailwind 4; Supabase para banco, autenticação e arquivos; Vercel para hospedagem; Resend para e-mails; Vitest para lógica. As dependências instaladas usam versões fixas e o `package-lock.json` deve permanecer versionado.

O projeto Supabase conectado usa a chave publicável moderna. Chaves secretas e `service_role` não são necessárias nesta base e nunca devem ser adicionadas a variáveis `NEXT_PUBLIC_*`.

## Como executar

Requer Node.js 20.9 ou superior. Copie `.env.example` para `.env.local` e preencha somente a URL e a chave publicável do projeto Supabase. Depois execute:

```bash
npm install
npm run dev
```

Verificações disponíveis:

```bash
npm run lint
npm run typecheck
npm run build
```

O arquivo `.env.local` é ignorado pelo Git. As migrações versionadas do banco e as políticas RLS ficam em `supabase/migrations`. Para preparar o banco local com exemplos fictícios, instale o [Supabase CLI](https://supabase.com/docs/guides/cli), execute `supabase init` caso ainda não exista configuração e depois `supabase start` e `supabase db reset`. O `db reset` aplica migrações e o `supabase/seed.sql`; os dados são somente de demonstração e não devem ser aplicados em produção. Login, cadastro de loja, anotação de faltas e cadastro manual/listagem paginada de boletos usam o Supabase. OCR, arquivos, histórico de preços e dashboard ainda são etapas futuras.

## Ritmo de entrega

Uma tarefa por vez: definir resultado, implementar, verificar, registrar evidências e apresentar ao gestor. Concluir o cartão exige cumprir seus critérios e obter validação de produto quando aplicável. Os dias D01–D40 são blocos estimados, sem execução automática ou datas fixas.
