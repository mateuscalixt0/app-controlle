# Andamento

Atualizado em 08/10/2026.

## Entrega atual — D02, revisão exclusiva de layout

- [Protótipo navegável](d02/prototipo.html) atualizado conforme o pedido de Mateus; [roteiro de aceite](d02/EXPERIENCIA_MOBILE.md).
- Rodapé com quatro destinos: Adicionar boleto, Boletos a pagar, casa central (Início) e Lista de faltas.
- Início com próximos boletos, total pago por semana/mês/ano e colunas por empresa.
- Cadastro por arquivo/foto e alternativa manual preservados.
- Boletos individuais com vencimento, valor, código mascarado e ações de copiar/baixar demonstrativas.
- Lista com anotação, consulta na mesma tela, busca e filtros combinados por empresa/categoria.
- Área de importação XML e histórico de preços como subtelas de Produtos.
- Somente dados fictícios e interações de apresentação. Sem backend, gravação, OCR real, importação ou download real.

**D02 aguarda validação visual e aceite de Mateus.** Nenhuma funcionalidade de aplicação foi declarada concluída.

## Verificações executadas

- Leitura da versão atual da branch, AGENTS.md, decisões, status, protótipo e cartão D02.
- `node --check`: sintaxe JavaScript aprovada.
- Verificação estática do HTML: IDs únicos, quatro botões principais, seis telas, destinos válidos, labels vinculados, seletores JS existentes e painel de estados em todas as telas.
- Conferência da soma dos exemplos de pagamentos e separação das contas abertas/atrasadas.
- Protótipo autônomo sem scripts/fontes/estilos externos.
- **Não executada verificação visual/interativa no navegador:** Chromium indisponível; instalação tentou baixar arquivo, mas recebeu ZIP inválido. O roteiro Playwright não chegou a abrir a página. Não alegar layout em 375px, teclado ou interações testados em navegador.
- Sem build de aplicativo, testes de banco, parser ou segurança: esses componentes ainda não existem.

## Próximo passo

Mateus conferir o HTML no navegador, especialmente casa central, painel, consulta de faltantes e posição do XML. Corrigir o visual conforme retorno e executar a conferência em celular/375px. Funcionalidades ficam para depois da validação, conforme pedido atual.

## Dependências e limitações preservadas

- D01: confirmar disponibilidade da loja piloto e obter exemplos anonimizados.
- D03: projeto executável, ambientes, versões, custos e verificações automáticas ainda pendentes.
- Branch: `d02-experiencia-mobile`; PR em rascunho #1.
- Trello não movimentado nesta revisão.
- Sem publicação, contratação de serviços ou dados reais.
- Regras de extração/OCR definidas anteriormente continuam documentadas; não implementadas nesta tarefa.
