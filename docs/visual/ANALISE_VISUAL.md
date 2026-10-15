# Análise visual e proposta — 14/10/2026

> Proposta visual rejeitada pelo usuário por parecer genérica/com “cara de IA”. Não usar a direção abaixo como referência aprovada. A direção atual está em `REFERENCIA_ESCOLHIDA.md`.

Aplicada a skill local `interface-design`. Escopo: análise do código das telas e proposta visual; sem alterar a aplicação. A liberdade visual concedida permite recomendar mudanças de identidade e composição. A prévia usa apenas dados fictícios.

## Direção recomendada: balcão organizado

Pessoa: lojista que alterna atendimento, conferência de documentos e reposição. A interface deve permitir encontrar o próximo compromisso e registrar uma falta rapidamente, transmitindo clareza e confiança.

- Domínio: balcão, fornecedores, vencimentos, boletos, notas fiscais, unidades de compra, reposição.
- Mundo de cores: branco do papel, cinza do cimento, grafite das impressões, verde das etiquetas, âmbar de atenção e vermelho de urgência.
- Assinatura proposta: vencimento como etiqueta de calendário junto ao fornecedor, valor alinhado e ações progressivamente reveladas. Aplicável à lista, resumo, detalhe, conferência e estados de vencimento; esta prévia demonstra apenas a lista.
- Substituir cartões iguais com muitos botões por lista de leitura rápida; moldura de celular no desktop por área de trabalho ampla; cores decorativas por cores com significado.
- Paleta candidata: papel `#F5F4EF`, superfície `#FFFFFF`, grafite `#222C29`, texto secundário `#626C67`, ação `#175B48`, borda `#DCE1D9`. Âmbar para vencimento próximo; vermelho para atraso/erro; verde para confirmação. Sempre incluir texto, sem depender só da cor.

O rosa atual não é um erro. A troca por verde é uma proposta de identidade, motivada pelo caráter operacional da loja; a maior melhoria virá da hierarquia, independentemente da cor escolhida.

## Achados e alterações sugeridas

| Prioridade | Evidência no código | Recomendação e efeito |
|---|---|---|
| Alta | `globals.css`: `.app-frame` e `.bottom-nav-inner` limitados a 480 px em todas as larguras | Desktop com navegação lateral e conteúdo até 1.280 px; mobile com navegação inferior. Aproveitar a tela sem aumentar desnecessariamente os formulários. |
| Alta | `bottom-nav.tsx`: cinco destinos, textos longos; CSS com fonte de 9 px, chegando a 8 px | Quatro áreas: Início, Boletos, Faltas e Compras. Adicionar boleto vira ação evidente na página. Rótulos de 12 px ou mais e alvos de toque de pelo menos 44 px como meta de usabilidade. |
| Alta | `app-shell.tsx`: sino decorativo com indicador; botão de perfil executa `signOut` | Remover a falsa notificação e expor uma ação claramente chamada “Sair”; mostrar identificação da loja quando disponível. |
| Alta | `boletos/page.tsx` e CSS: código sempre visível, cartões grandes e ações repetidas | Priorizar fornecedor, vencimento e valor. Abrir detalhes para código, documento e ações. Aceitar que esconder ações acrescenta um toque: validar se “Copiar código” merece acesso direto pelo uso real. |
| Alta | Todos os status de boleto usam `.status-pill` com a mesma cor | Diferenciar aberto, pago, cancelado e atraso com texto e tratamento visual. Atraso deve ser calculado com data civil de São Paulo e apenas para boletos abertos; exige implementação e testes próprios. |
| Alta | `page.tsx`: saudação, data e resumos fixos, com aviso de demonstração | Manter identificação clara da demonstração. Um painel real com “Vence hoje” depende de dados reais e é trabalho funcional separado. Não prometer que o redesenho implementa esse painel. |
| Média | `globals.css`: rosa quente no conjunto, fundo azulado específico nos boletos, múltiplos raios e sombras | Unificar superfícies e tokens; raios de 8 px para controles e 12 px para listas; separação por bordas discretas e espaço, sem sombra em cada item. |
| Média | Textos auxiliares de 9–11 px em diversas classes | Corpo 16 px, apoio 14 px, metadados 12 px; títulos 28/32 px. Números financeiros com algarismos tabulares. Tipografia candidata: Source Sans 3 local; prévia usa fontes do sistema, sem download. |
| Média | `boletos/novo/page.tsx`: ilustração e instrução de envio renderizadas inclusive na edição | Mostrar apoio ilustrado apenas no estado inicial; durante leitura, revisão e edição, priorizar o estado atual e seus campos. Reduzir ilustração de 250 px para não competir com a tarefa. |
| Média | `login/page.tsx`: texto explica Supabase Auth e usuário administrativo | Trocar explicação técnica por orientação útil sobre acesso da loja, sem inventar recuperação de senha ou atendimento que ainda não existe. |
| Média | Faltas repetem “Sem histórico” em todo cartão; Compras promete preços futuros | Destacar produto, quantidade e prioridade; explicar ausência de histórico no contexto adequado. Manter limites funcionais visíveis sem dominar cada linha. |
| Média | Menu de boleto sem tamanho mínimo explícito; busca remove `outline` | Reservar 44×44 px para opções, usar `:focus-within` na busca, testar foco/teclado, textos longos e estados de erro. Contraste precisa ser medido na implementação. |

## Prévia e limites

- `proposta-interface.html`: composição candidata responsiva, com busca por descrição e detalhes expansíveis. Demais ações são ilustrativas; não acessam dados nem executam pagamentos. A seleção de filtros e os destinos da navegação ainda não estão implementados nesta prévia.
- `atual-reconstituido.html`: recorte estático baseado no CSS e na marcação da lista atual, com dados fictícios. Não é uma captura da aplicação autenticada e não reproduz todas as ações ou navegação.
- Intenção da prévia: encontrar contas rapidamente. Hierarquia: fornecedor e valor, seguidos de vencimento e descrição. Superfícies: papel + branco, bordas discretas, sem elevação decorativa. Espaçamento em múltiplos de 4 px; linhas com 16/24 px de preenchimento.
- Verificação realizada: inspeção do código e geração dos arquivos; `git diff --check`. A renderização não foi validada: Chromium falhou no ambiente (`setsockopt: Operation not permitted`) e o navegador do Playwright não está instalado. Não foram feitos login, testes de persistência ou revisão visual em produção.
- Antes de integrar: conferir 375 px e 1280 px, teclado, contraste, zoom, fornecedores longos, valores altos, lista vazia, busca sem resultado, erro e carregamento. A implementação deverá preservar as ações reais e passar pelo gate de QA do projeto.

## Sequência recomendada

1. Aplicar tokens e estrutura responsiva, começando pela lista de boletos como tela de referência.
2. Padronizar navegação e estados da captura/revisão.
3. Propagar o padrão para faltas, compras e login.
4. Implementar o resumo financeiro real como tarefa funcional separada.

Esta proposta não define um sistema aprovado. Os padrões podem ser salvos em `.interface-design/system.md` quando a direção for adotada.
