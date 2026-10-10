# Comece aqui — App Controle

## Resumo do projeto

Aplicativo web mobile-first para pequenos lojistas de material de construção organizarem boletos e faltas de produtos e, em etapas futuras, planejarem compras com histórico de preços. O produto usa Next.js, TypeScript e Tailwind, com Supabase para autenticação e dados e Vercel para hospedagem. A interface é pt-BR e trabalha com reais e datas brasileiras.

## Situação atual conhecida

- A aplicação Next.js está no repositório e conectada ao Supabase.
- Login por e-mail/senha, criação da loja no primeiro acesso, anotação de faltas e cadastro/listagem manual de boletos estão implementados.
- A aplicação foi publicada na Vercel; o registro mais recente confirma o deploy de produção e abertura da página de login, mas não confirma um login real com a conta do titular.
- OCR, envio e armazenamento de arquivos, histórico de preços e dashboard ainda são etapas futuras.
- O estado de deploy, verificações e pendências pode mudar: confira o início de `docs/STATUS.md` antes de afirmar o que está publicado ou validado.

## Onde está cada informação

| Preciso saber... | Consulte |
|---|---|
| Regras de trabalho para o Codex, segurança e verificações | `AGENTS.md` |
| Resumo e mapa da documentação | Este arquivo |
| Situação mais recente, evidências e próximo passo | Apenas o início de `docs/STATUS.md`, sobretudo “Atualizado em” e “Próxima tarefa” |
| Decisão de produto relevante à tarefa | Seção correspondente em `docs/DECISOES.md` |
| Critérios de uma entrega planejada | Somente o cartão correspondente em `PLANO_EXECUCAO_TRELLO.md` |
| Detalhes da experiência mobile D02 | `docs/d02/EXPERIENCIA_MOBILE.md` |
| Instalação e execução local | Seções de setup do `README.md` |
| Plano original / contexto legado | `PLANO_MVP.md` e `docs/referencias/CLAUDE_ORIGINAL.md` — fontes históricas, não começar por elas |

## Como iniciar uma nova conversa

1. Leia este resumo e `AGENTS.md`.
2. Identifique o pedido atual e os arquivos da área afetada.
3. Confira apenas o topo de `docs/STATUS.md` para estado atual; não leia seu histórico inteiro.
4. Abra somente a decisão e o cartão que se aplicam à tarefa. Não leia os 40 cartões do plano inteiro por padrão.
5. Leia código e documentação adicionais apenas se forem necessários para executar ou verificar o pedido.
6. Se os registros divergirem, priorize instruções atuais do usuário, depois decisões atuais e evidências recentes; registre ou explique a divergência.

## Escopo em uma frase

Gestão de boletos e lista de faltas hoje; compras e preços com OCR/importação e histórico são etapas futuras. Segurança e isolamento entre lojas são requisitos desde a base. Não apresentar protótipo ou registro documental como funcionalidade validada.
