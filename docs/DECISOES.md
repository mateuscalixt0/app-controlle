# Decisões do projeto

Registro inicial: 08/10/2026. Base: plano original, plano de execução e orientações de Mateus.

| Assunto | Decisão atual |
|---|---|
| Responsabilidades | Mateus: produto, prioridades, validação, orçamento e lançamento. Codex: desenvolvimento e verificação técnica. |
| Organização | Um quadro Trello, 40 blocos estimados, etiquetas Boletos e Produtos. Sem datas fixas. |
| Escopo | Organizador de boletos e compras; gestão de produtos sem estoque. Cadastro de boletos prioritariamente por PDF/imagem ou foto com extração assistida e revisão; manual como alternativa. |
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

## Revisão de produto — D02, 08/10/2026

Mateus rejeitou o visual inicial e solicitou cadastro prioritário por arquivo ou câmera, identificando código, nome da loja/beneficiário, vencimento e demais dados disponíveis. Esta orientação inclui OCR no escopo, substituindo sua exclusão anterior. Mantém cadastro manual como alternativa. Não autoriza novos gastos.

Fluxo: enviar documento ou fotografar → leitura → conferir/editar informações → confirmar cadastro. Dados ausentes, divergentes ou ambíguos nunca são inventados. Beneficiário do boleto é distinto da loja usuária; vínculo ao fornecedor deve ser conferido. Documento não prova pagamento.

Proposta inicial de formatos: PDF, JPG e PNG, um documento por vez, até 10 MB. Limite e suporte real serão confirmados na implementação; formato habitual da loja ainda não informado. XML de NF-e permanece em fluxo próprio e não fornece linha digitável.

O protótipo atualizado seleciona arquivo local e oferece captura via navegador compatível. Não executa OCR, upload para servidor ou gravação. Exemplos de leitura são fictícios e acionados separadamente. Visual claro com botões grandes é proposta ainda sem aceite.

Antes de implementar extração: definir leitor de PDF textual e OCR de imagens/PDF digitalizado, custo por documento, privacidade/retensão, limites de páginas/resolução e testes com exemplos anonimizados. Seleção de serviço pago exige aprovação de custo. Replanejar esforço dos cartões de captura/parser antes de assumir prazo. Limites financeiros, validação de códigos e segurança continuam obrigatórios.
