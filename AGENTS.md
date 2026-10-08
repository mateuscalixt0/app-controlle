# Instruções para o Codex — App Controle

## Contexto e fontes

Mateus é gestor de produto, não desenvolvedor. Assuma decisões técnicas rotineiras e explique impacto em linguagem simples, em português. Leia `docs/STATUS.md`, `docs/DECISOES.md` e o cartão correspondente em `PLANO_EXECUCAO_TRELLO.md` antes de trabalhar.

As instruções atuais do usuário prevalecem. Para decisões de produto já registradas, use `docs/DECISOES.md` e o plano de execução atual. `PLANO_MVP.md` e `docs/referencias/CLAUDE_ORIGINAL.md` são referências históricas; não reinstaure decisões substituídas. Registre divergências relevantes em vez de inventar requisitos.

## Forma de trabalhar

- Apresente o objetivo e um plano curto, depois execute o trabalho autorizado. Não peça ao gestor decisões técnicas rotineiras.
- Entregue uma funcionalidade verificável por vez. Não implemente todos os 40 cartões de uma vez.
- Mudanças de escopo, novos gastos e liberação do piloto são decisões do gestor. Prepare o resultado concreto antes de solicitar uma decisão necessária.
- Corrija primeiro falhas de acesso, dinheiro incorreto, perda de dados e bloqueios de uso.
- Preserve alterações existentes. Use commits pequenos e descritivos em português; após a preparação inicial, prefira uma branch por tarefa e PR com evidências.
- Não presuma acesso ao histórico do ChatGPT ou ao Trello. Use os documentos do repositório e as integrações realmente disponíveis. Se não puder atualizar um cartão, informe o status a registrar sem afirmar que o moveu.
- Ao terminar, atualize `docs/STATUS.md` com entrega, verificações executadas, limitações, validação pendente e próximo passo. Não confunda documentação com funcionalidade implementada.

## Produto e limites

SaaS web mobile-first, preparado para PWA, para pequenos lojistas de material de construção. Dois módulos: Gestão de Boletos e Gestão de Produtos; login, loja e fornecedores compartilhados.

Dentro: boletos, painel por vencimento, anexos e comprovantes, lembretes por e-mail, produtos, listas, preços, comparação e XML com vínculo manual lembrado.

Fora do MVP: pagamentos bancários, DDA, OCR, ERP, estoque, emissão fiscal, conciliação, associação automática por IA, app nativo, cobrança automática de assinatura, push e WhatsApp.

Interface pt-BR, moeda R$, datas dd/mm/aaaa. Verificar telas em 375px, estados vazios, carregamento, erro e navegação por teclado. Dados fictícios devem ser identificados. Nunca simule sucesso de uma gravação que falhou.

## Arquitetura

Base prevista: Next.js App Router + TypeScript estrito + Tailwind; Supabase Postgres/Auth/Storage; Vercel; Resend; Vitest. Verificar versões e documentação oficial na implementação. Preferir aplicação modular simples, sem microsserviços ou dependências desnecessárias.

Migrações de banco versionadas e reproduzíveis. Separar desenvolvimento/teste de produção. Documentar comandos quando existirem; não relatar build ou teste como executado sem rodá-lo.

## Segurança obrigatória desde a base

- Toda entidade de negócio pertence a uma loja, com autorização no servidor e RLS no banco. Identificadores enviados pelo navegador não comprovam permissão.
- Validar associação do usuário à loja em cada operação. Definir papéis owner/member; criação de proprietário e alteração de permissões não podem permitir autoelevação.
- Proteger também vínculos entre tabelas contra referências a registros de outra loja, com restrições de banco quando aplicável.
- Arquivos privados; validar tamanho, formato e autorização em upload/download. URLs temporárias somente após autorização. Não cachear dados financeiros ou arquivos privados em cache público/compartilhado.
- Segredos apenas em variáveis de ambiente; chaves administrativas nunca no navegador, código, logs ou documentação. `.env.example` conterá apenas nomes e valores fictícios.
- Logs sem XML integral, comprovantes, linhas digitáveis, tokens ou senhas. Exemplos no Git devem ser sintéticos ou anonimizados.
- Testar isolamento real com duas lojas, usuário sem sessão, papéis e tentativa de trocar IDs, inclusive arquivos. RLS só é considerado verificado após executar os testes.
- Antes do beta, verificar dependências, limites de upload, recuperação de banco e arquivos, reversão, acesso do piloto e pendências críticas.

## Regras financeiras e importação

- Totais de boletos em centavos inteiros. Quantidades e preços unitários fiscais exigem precisão decimal, sem arredondamento precoce. Documentar regra de arredondamento; não usar ponto flutuante binário para cálculos monetários exatos.
- Vencimentos são datas civis, sem conversão involuntária de fuso. Referência inicial: America/Sao_Paulo. Definir intervalos Hoje/Semana/Mês e não somar blocos sobrepostos.
- Parser de boleto em função pura, com testes. Conferir especificação oficial vigente antes de implementar os ciclos do fator de vencimento. Data ambígua exige confirmação; não escolher silenciosamente a mais próxima.
- No MVP, códigos de arrecadação de 48 dígitos e boletos com valor zero exigem dados manuais conforme o plano. Nunca inventar uma linha digitável a partir das duplicatas do XML.
- XML é entrada não confiável: limitar tamanho/complexidade, rejeitar estruturas não suportadas e entidades externas/DTD. Não buscar recursos externos do XML. Validar campos extraídos antes da persistência.
- NF-e identificada pela chave de acesso e loja; vínculos de produto também pertencem à loja. Prévia e confirmação antes de gravar. Importação deve ser atômica ou ter recuperação explícita, idempotente e protegida contra concorrência.
- Comparar só produtos equivalentes, unidades compatíveis ou conversão confirmada. Janela inicial: 90 dias; exibir fonte, data e unidade. Preço histórico não é cotação garantida.
- Exibir apenas **economia potencial**, com referência e quantidade explícitas, informando limites como frete e condições de pagamento. Economia realizada exige evidência de compra e ficará fora do MVP inicial.
- Lembretes precisam de autorização, destinatário correto, registro de tentativas e proteção contra duplicidade; testar antes de habilitar para a loja.

## Verificação e conclusão

Testes significativos para parsers, dinheiro/datas, permissões, importações, duplicidade e fluxos críticos. Verificar tipos, lint e build quando o projeto existir. Falta de acesso a um serviço deve ser registrada como verificação pendente, nunca como aprovação.

Fechamento para o gestor: o que funciona, o que foi testado, como conferir, limitações e próximo cartão. Não marcar tarefa como concluída se depender de aceite ainda não dado. Não assumir trabalho agendado entre sessões.
