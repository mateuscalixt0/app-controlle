# D02 — Revisão do layout

Revisado em 08/10/2026. Pedido: trabalhar somente no layout; funcionalidades virão depois. Mantidos fundo branco, cartões arredondados e ações rosa escuro da direção visual anterior.

## Como conferir

Baixe `prototipo.html` e abra no navegador. Arquivo autônomo, sem dependências externas. A página de código do GitHub não executa o HTML. Todos os dados são fictícios; referência fixa em 08/10/2026.

## Navegação

Quatro destinos no rodapé: Adicionar boleto, Boletos a pagar, Início e Lista de faltas. O ícone de casa fica exatamente no centro; dois acessos à esquerda e o acesso à lista na área da direita. XML e histórico são subtelas de Produtos, sem um quinto botão principal.

## Telas

1. **Início:** abre no resumo do mês. Total pago com seletor Semana/Mês/Ano, próximos boletos e colunas dos valores pagos por empresa. O gráfico soma o mesmo total do período selecionado. Semana: 05–11/10; mês: outubro; ano: janeiro–outubro de 2026. Os cartões a pagar em outubro e em atraso têm períodos próprios explicitados e não mudam junto com o filtro dos pagamentos. Não somar períodos sobrepostos.
2. **Adicionar boleto:** preservado o desenho anterior de Enviar arquivo/Tirar foto, prévia local, exemplo fictício de leitura, revisão e alternativa manual. Nada é enviado ou gravado; não executa OCR. Arquivos locais podem ser selecionados apenas para visualizar a prévia já existente.
3. **Boletos a pagar:** contas individuais, empresa, descrição, vencimento, valor, código mascarado e botões Copiar código/Baixar boleto. Filtros Todos/Hoje/Próximos/Vencidos operam apenas sobre exemplos fixos. Copiar e baixar exibem aviso; não copiam códigos fictícios nem produzem arquivos simulando boletos reais.
4. **Lista de faltas:** campos para nome livre, quantidade, unidade, categoria e empresa opcional. “Adicionar à lista” apenas informa a limitação. “Ver faltantes” alterna a área de consulta na mesma tela. Consulta com busca e filtros combinados por empresa e categoria (Encanamento, Elétrica, Construção), incluindo estado sem resultados. Empresa é referência opcional, não compromisso de compra nem controle de estoque.
5. **Importar compra (subtela):** acesso pela lista; mostra a proposta selecionar XML → conferir produtos → importar. Botão explica que seleção/importação virão depois. XML alimentará histórico de produtos/preços e não gera linha digitável.
6. **Histórico de preços (subtela):** gráfico ilustrativo do cimento por saco de 50 kg (agosto R$ 38; setembro R$ 36,50; outubro R$ 34), empresas com data/origem e economia potencial para 20 sacos. Não há consulta real nem dados fiscais persistidos.

## Limites

Somente navegação e interações de demonstração. Sem banco, login, backend, importação, geração/download de boleto ou gravação de produtos. Cadastro de documentos mantém a interação local preexistente. Nenhum serviço contratado, publicação realizada ou cartão do Trello movimentado.

A futura implementação de leitura de PDF/foto requer validação dos campos extraídos, revisão obrigatória, tratamento de erros e ambiguidade, arquivos privados e avaliação de custo/privacidade já registrada em DECISOES.md e AGENTS.md. Este layout não altera essas regras.

## Roteiro de aceite

- Abrir em 375px e conferir a casa no centro e os quatro destinos legíveis.
- Alternar semana/mês/ano e conferir que total pago corresponde às colunas por empresa.
- Conferir a diferença entre pagos, a pagar e atrasados.
- Abrir Adicionar boleto e conferir se mantém a experiência anterior.
- Abrir Boletos a pagar e localizar data, código e download.
- Na lista, escrever um produto, abrir faltantes e combinar empresa/categoria; conferir também nenhum resultado.
- Abrir XML e histórico dentro da lista; voltar usando rodapé ou botão Voltar.
- Alternar estados Com dados/Vazio/Carregando/Erro e retornar sem expor painéis ocultos do formulário.
- Navegar por teclado e conferir foco, rodapé e rolagem no celular.

## Verificação

Sintaxe JavaScript aprovada em `node --check`. Verificações de estrutura/interações registradas em `../STATUS.md`. Verificação visual real em 375px ainda pendente: Chromium não está instalado e o download retornou arquivo inválido neste ambiente. Não afirmar validação visual, câmera ou acessibilidade completa. D02 aguarda aceite de Mateus.
