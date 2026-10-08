# Decisões do projeto

Registro inicial: 08/10/2026. Base: plano original, plano de execução e orientações de Mateus.

| Assunto | Decisão atual |
|---|---|
| Responsabilidades | Mateus: produto, prioridades, validação, orçamento e lançamento. Codex: desenvolvimento e verificação técnica. |
| Organização | Um quadro Trello, 40 blocos estimados, etiquetas Boletos e Produtos. Sem datas fixas. |
| Escopo | Organizador de boletos e compras; gestão de produtos sem estoque. |
| Arquitetura de referência | Next.js/TypeScript/Tailwind, Supabase, Vercel, Resend e Vitest; versões e custos a verificar em D03. |
| Economia | Potencial, com base explícita. Substitui afirmações de economia realizada no plano original. |
| Precisão | Totais de boletos em centavos; preços unitários fiscais e quantidades com precisão decimal. Substitui a regra genérica de todo valor em centavos. |
| Boleto ambíguo | Exigir confirmação da data; não escolher silenciosamente o ciclo mais próximo. |
| Comparação | Histórico inicial de 90 dias, unidade compatível, fonte e data visíveis. |
| PWA | Uso conectado para operações financeiras. Sem promessa de edição offline. |
| Autonomia | Codex executa decisões técnicas rotineiras dentro da tarefa autorizada; gestor decide escopo, gasto e liberação do piloto. |
| Segurança | Isolamento por loja no servidor, banco e arquivos; precisa de testes para ser considerado verificado. |

## Pendências de produto e acesso

- Confirmar disponibilidade da loja piloto e recolher exemplos anonimizados.
- Validar em D02 os fluxos de vencimentos, cadastro de boleto, lista de compras e comparação.
- Definir teto de gasto e conectar contas necessárias antes de provisionar serviços pagos.
- Em D03, registrar versões, limites, estratégia de agendamento dos e-mails e ambientes.
- Detalhar papéis owner/member em D04 conforme as ações necessárias ao MVP.

Essas pendências não impedem a documentação inicial nem o desenho com dados fictícios claramente identificados. As hipóteses comerciais do plano original ainda não foram validadas.
