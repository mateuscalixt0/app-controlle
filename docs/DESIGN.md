# Design do App Controle

Aprovado por Mateus em 15/10/2026. Este documento orienta novas telas e alterações da interface real.

## Referência e intenção

A referência principal é o [protótipo aprovado](https://controle-prototipo-mateus.quickmorel1.chatgpt.site), revisão `8616e0d83a47472d4fd5976f42d4ce22efb52885`, inspirado na imagem Neobank escolhida pelo usuário. A coleção Taste Skill auxilia a execução; as preferências aprovadas prevalecem sobre presets da skill. A proposta anterior “balcão organizado” foi rejeitada.

O aplicativo deve parecer simples, organizado e confortável: fundo cinza claro, cartões brancos, texto escuro, botões pretos e verde-lima pontual. Manter espaço entre grupos, poucos elementos decorativos e informações financeiras fáceis de ler. Evitar gradientes, vidro, sombras fortes, excesso de cores, ilustrações genéricas e cartões dentro de cartões sem necessidade.

## Cores

Fonte de implementação: `src/app/globals.css`, variáveis de `:root`.

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#f3f4f4` | Fundo geral e áreas secundárias |
| `--surface` | `#ffffff` | Cartões, diálogos e navegação |
| `--foreground` / `--primary` | `#212322` | Texto e ação principal |
| `--muted` | `#626862` | Legendas e informação complementar |
| `--accent` | `#d1f66a` | Destaque de faltas, prioridade e identidade |
| `--line` | `#e4e6e3` | Divisórias e contornos discretos |
| `--focus` | `#638300` | Foco visível pelo teclado |
| `--danger` | `#a62d27` | Erros e ação de cancelamento |
| `--warning` | `#875116` | Atenção |
| `--success` | `#315d29` | Confirmação |

Usar texto escuro sobre verde-lima e branco sobre botão preto. Cor sempre acompanha texto ou ícone; não deve ser a única indicação de estado. Os aliases antigos `--pink` e similares apenas preservam compatibilidade de componentes; não representam a identidade atual.

## Texto, bordas e espaçamentos

- Fonte atual: Arial, Helvetica, sans-serif, sem download externo obrigatório. Texto base de 16 px; campos de formulário de 16 px para legibilidade no celular.
- Títulos: 30 px no desktop, 26 px no celular; títulos de seção aproximadamente 20–21 px. Valores principais entre 35 e 43 px, com números tabulares.
- Textos secundários normalmente 13–14 px. Evitar caixa alta em títulos principais; escrever em português natural.
- Cartões: raio de 26 px, aproximadamente 22–25 px de preenchimento. Cartões de lista: raio de 22 px. Campos: raio de 14 px. Botões principais e filtros: formato de pílula.
- Espaçamentos recorrentes: 8, 12, 16, 20, 24, 28 e 40 px; escolher conforme a hierarquia, sem compactar grupos independentes.
- Contornos de 1 px apenas quando necessários. Elevação discreta na navegação móvel; superfícies brancas se distinguem principalmente pelo fundo cinza.

## Layout e navegação

No desktop, o contêiner tem até 1280 px, navegação lateral de 200 px e conteúdo com 40 px de margem interna. O início organiza resumo e próximos boletos em duas colunas.

Até 800 px, o layout passa a uma coluna com largura máxima de 500 px, margem interna de 18–22 px e navegação inferior fixa. Reservar espaço para ela e para a área segura do aparelho. As quatro entradas são Início, Boletos, Faltas e Minha loja; Compras pertence à área Minha loja. Ações de cadastro ficam dentro da própria tela.

Diálogos têm até 480 px de largura, margem externa mínima de 14 px e altura máxima de 85% da área visível, com rolagem interna. Em telas estreitas, valores e descrições podem quebrar em linhas sem criar rolagem horizontal.

## Telas e comportamento

| Tela | Padrão |
|---|---|
| Login | Cartão central branco, marca `c.`, campos cinza e botão preto; erros junto ao formulário |
| Início | Total real de boletos pendentes, incluindo vencidos, opção de ocultar, faltas em cartão lima e três primeiros vencimentos pendentes |
| Seus boletos | Busca, filtros e lista com data, fornecedor, descrição, valor, estado e ícone de copiar |
| Detalhes do boleto | Diálogo com dados, linha digitável selecionável, copiar, baixar original, editar e registrar pago/cancelado |
| Cadastro/edição | Mesma linguagem visual aplicada aos formulários existentes; leitura por câmera/PDF e revisão preservadas |
| Faltas | Busca, prioridade, ordem recente/antiga, empresa de referência e cartões que abrem detalhes |
| Detalhes do produto | Data/hora de inclusão, quantidade, unidade, categoria e referência; estado sem comparação conectada |
| Minha loja | Nome e conta reais, acesso à importação XML existente e saída da sessão |
| Compras/XML | Fluxo existente de arquivo, revisão e confirmação, adaptado à identidade visual |

## Estados e acessibilidade

- Todo controle precisa de nome acessível; ícones isolados recebem rótulo. Área de toque mínima de 44 px.
- Foco visível, navegação por teclado e fechamento de diálogos com Escape. Diálogos usam o elemento nativo `dialog` para modalidade e contenção de foco.
- Falhas de gravação mantêm o estado anterior e mostram mensagem; ações em andamento ficam desabilitadas. Não transformar falha de consulta em total zero.
- Código ausente desabilita copiar; original ausente desabilita baixar e explica o motivo. Falha de clipboard permite selecionar manualmente a linha digitável.
- Estados vazios distinguem lista sem registros de busca sem resultado. Datas civis não mudam por fuso; instantes de inclusão usam America/Sao_Paulo.
- Respeitar preferência de movimento reduzido. Não depender de animação para explicar estado.

## Dados reais e limites

O protótipo usa exemplos; o aplicativo não deve importar seus números, nomes, códigos, PDFs ou preços fictícios. O início consulta apenas a loja autenticada, soma centavos inteiros e pagina a leitura para evitar truncamento pelo limite de linhas do serviço.

Registrar um boleto como pago é apenas registro gerencial, sem transação bancária. Downloads continuam passando pela rota autenticada e por arquivos privados existentes.

A lista de faltas exibe e filtra somente fornecedores realmente vinculados ao produto por registros do histórico de preços da própria loja. Isso indica onde o produto já foi comprado, não uma oferta ou disponibilidade atual; não inventar vendedores nem apresentar preço histórico como cotação garantida. Faltas antigas sem produto associado podem manter o texto legado de empresa de referência. O botão XML abre a importação já existente. Comparação futura exige equivalência, unidade, fonte e data.

## Manutenção e verificação

Reutilizar `AppShell`, `HomeDashboard`, `BillCard`, `MissingList`, `LoginView`, `PageHeading` e os ícones existentes. Alterar os tokens centrais antes de introduzir estilos pontuais. Manter moeda BRL e datas pt-BR nos helpers `src/lib/presentation.ts`.

A cada evolução, verificar 375 px e desktop, conteúdo longo, teclado, vazio, erro e carregamento. Testes de componentes usam dados sintéticos exclusivamente em `tests/browser/harness`. Eles não substituem login real, persistência, isolamento entre lojas ou câmera física. Evidências e pendências atuais ficam no início de `docs/STATUS.md`.
