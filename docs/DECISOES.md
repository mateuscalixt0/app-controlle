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
| Cadastro assistido de boleto | Fluxo enviar/fotografar → ler → conferir/corrigir → salvar. OCR nunca confirma sozinho, não completa dados por suposição e qualquer serviço externo exige proposta de custo e tratamento documental antes da contratação. |
| Lista de faltas | Cadastro principal pede somente produto, quantidade e prioridade opcional; Normal é o padrão. Categoria, unidade e empresa podem permanecer vazias. |
| Prioridades | Normal azul; Média laranja; Precisa comprar vermelha. Nome sempre acompanha a cor. |
| Classificação por IA | Explicitamente pendente; não implementar nem inferir categoria, unidade ou fornecedor nesta fase. |
| Navegação mobile | Cinco destinos: Adicionar boleto, Boletos a pagar, Início central, Lista de faltas e Compras e preços. |
| Compras e preços | Área própria para XML, histórico, consultas, gráficos e comparações; reimportação não pode duplicar registros e vínculos sem correspondência exigem confirmação. |

## Pendências de produto e acesso

- Confirmar disponibilidade da loja piloto e recolher exemplos anonimizados.
- Validar em D02 os fluxos de vencimentos, cadastro de boleto, lista de compras e comparação.
- Definir teto de gasto e conectar contas necessárias antes de provisionar serviços pagos.
- Em D03, registrar versões, limites, estratégia de agendamento dos e-mails e ambientes.
- Detalhar papéis owner/member em D04 conforme as ações necessárias ao MVP.

Essas pendências não impedem a documentação inicial nem o desenho com dados fictícios claramente identificados. As hipóteses comerciais do plano original ainda não foram validadas.
