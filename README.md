# App Controle

Aplicativo para pequenos lojistas de material de construção organizarem boletos e planejarem compras com histórico de preços por fornecedor.

**Estado:** preparação documental. Ainda não existe aplicação executável, banco configurado ou publicação.

## Gestão e desenvolvimento

- Mateus administra o produto, prioridades, orçamento e validação na loja.
- Codex cuida de arquitetura, código, banco, segurança, testes e documentação.
- Quadro: [App Controle — Construção do MVP](https://trello.com/b/gY23LQ8z).
- Etiquetas: Gestão de Boletos (azul) e Gestão de Produtos (verde); tarefas compartilhadas recebem ambas.

## Por onde começar

1. Leia [AGENTS.md](AGENTS.md), as instruções permanentes de desenvolvimento.
2. Consulte [PLANO_EXECUCAO_TRELLO.md](PLANO_EXECUCAO_TRELLO.md) para as 40 entregas planejadas.
3. Leia [docs/DECISOES.md](docs/DECISOES.md) para as decisões atuais e pendências.
4. Retome de [docs/STATUS.md](docs/STATUS.md), que registra evidências e próximo passo.

[PLANO_MVP.md](PLANO_MVP.md) preserva o plano original com ressalvas sobre decisões posteriores. A orientação original para Claude está arquivada em `docs/referencias/CLAUDE_ORIGINAL.md`; o arquivo operacional para Codex é `AGENTS.md`.

## Escopo

**Boletos:** fornecedores, cadastro manual ou por linha digitável, vencimentos, painel, anexos privados, registro de pagamento, comprovantes e lembretes por e-mail.

**Produtos:** itens, lista de compras, preços manuais, comparação de preços recentes e importação de XML de NF-e com vínculo confirmado de produtos.

Comparações exibem **economia potencial**. Gestão de produtos não inclui estoque. Não há pagamento bancário dentro do aplicativo.

## Arquitetura de referência

Next.js, TypeScript e Tailwind; Supabase para banco, autenticação e arquivos; Vercel para hospedagem; Resend para e-mails; Vitest para lógica. Compatibilidade, versões, custos e limites serão verificados em D03. Nenhum serviço foi contratado ou conectado nesta preparação.

## Como executar

Ainda não há `package.json` nem comandos de aplicação. D03 criará o projeto e documentará os comandos realmente disponíveis. D02 prepara antes a experiência mobile para validação.

## Ritmo de entrega

Uma tarefa por vez: definir resultado, implementar, verificar, registrar evidências e apresentar ao gestor. Concluir o cartão exige cumprir seus critérios e obter validação de produto quando aplicável. Os dias D01–D40 são blocos estimados, sem execução automática ou datas fixas.
