# Decisões do projeto

## Ajuste pontual de lista — 09/10/2026

Pedido de Mateus: preservar o layout da Lista de faltas, retirando Tipo de produto e Empresa de referência somente do formulário Anotar produto. Na consulta Ver faltantes, manter os filtros e a disposição existente, acrescentando cores laterais conforme a referência e preços. Preços do protótipo são exemplos fictícios por unidade de compra; cores são detalhes visuais, sem regra de prioridade definida. Esta decisão substitui os campos de categoria/empresa antes previstos no formulário do protótipo.

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

## Revisão de produto — D02, 08/10/2026

Mateus rejeitou o visual inicial e solicitou cadastro prioritário por arquivo ou câmera, identificando código, nome da loja/beneficiário, vencimento e demais dados disponíveis. Esta orientação inclui OCR no escopo, substituindo sua exclusão anterior. Mantém cadastro manual como alternativa. Não autoriza novos gastos.

Fluxo: enviar documento ou fotografar → leitura → conferir/editar informações → confirmar cadastro. Dados ausentes, divergentes ou ambíguos nunca são inventados. Beneficiário do boleto é distinto da loja usuária; vínculo ao fornecedor deve ser conferido. Documento não prova pagamento.

Proposta inicial de formatos: PDF, JPG e PNG, um documento por vez, até 10 MB. Limite e suporte real serão confirmados na implementação; Mateus confirmou PDF de boleto e fotos como formatos habituais. XML de NF-e permanece em fluxo próprio e não fornece linha digitável.

O protótipo atualizado seleciona arquivo local e oferece captura via navegador compatível. Não executa OCR, upload para servidor ou gravação. Exemplos de leitura são fictícios e acionados separadamente. Mateus confirmou visual claro e simples com botões grandes e enviou referência: fundo branco, cartões arredondados, bordas suaves, ações rosa escuro e navegação inferior com ícones. Protótipo adaptado a essa direção; aceite da tela final ainda pendente.

Antes de implementar extração: definir leitor de PDF textual e OCR de imagens/PDF digitalizado, custo por documento, privacidade/retensão, limites de páginas/resolução e testes com exemplos anonimizados. Seleção de serviço pago exige aprovação de custo. Replanejar esforço dos cartões de captura/parser antes de assumir prazo. Limites financeiros, validação de códigos e segurança continuam obrigatórios.

## Revisão de layout — navegação e painel, 08/10/2026

Pedido atual de Mateus: alterar apenas o layout; funcionalidades serão implementadas depois. Esta revisão substitui a navegação anterior por quatro destinos: Adicionar boleto, Boletos a pagar, Início (casa central) e Lista de faltas. Com quatro acessos, a casa ocupa a coluna central, dois botões ficam à esquerda e Lista de faltas ocupa a área à direita.

- Início: próximos boletos, total pago por semana/mês/ano e colunas de valores pagos por empresa. Contas a pagar e atrasadas são indicadores separados dos pagamentos realizados.
- Adicionar boleto: preservar visual e fluxo de arquivo/foto, com alternativa manual.
- Boletos a pagar: lista com empresa, valor, vencimento, código e ação de baixar documento. Códigos mascarados no protótipo; download real ainda ausente.
- Lista de faltas: anotação com quantidade/unidade/categoria e empresa opcional; botão na mesma tela para consultar faltantes com filtros combinados por empresa e categoria, além de busca.
- XML: acesso dentro de Produtos, associado à compra e ao histórico de preços, sem acrescentar outro destino ao rodapé. A importação já prevista no MVP permanece futura; não há leitura de arquivo ou persistência de XML nesta revisão.
- Histórico: exemplo de gráfico de preços por produto/unidade, comparação por fornecedor e origem/data. Exemplos não são cotações nem economia realizada.

A navegação, troca de período e filtros apenas demonstram a apresentação com dados fixos. Não adicionar backend, integração, gravação ou novos gastos nesta tarefa.
