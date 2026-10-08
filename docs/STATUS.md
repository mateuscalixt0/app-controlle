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
- Protótipo estático publicado na Vercel a pedido de Mateus; sem backend ou dados reais.
- Regras de extração/OCR definidas anteriormente continuam documentadas; não implementadas nesta tarefa.

## Publicação para conferir no celular — 08/10/2026

- URL: https://app-controlle-layout.vercel.app
- Projeto Vercel: `app-controlle-layout` (`prj_xsN35L4kWRUWvbvt9xsicKI2J9Lh`).
- Deployment: `dpl_B1yzecJTP9zBf96f2FbpdECsxRtx`, estado READY.
- Publicado somente o HTML de `docs/d02/prototipo.html` como `index.html`, mais robots.txt com orientação para não indexar. Documentos internos não foram enviados.
- Publicação por envio direto de arquivos: não configura deploy automático do GitHub. Próximas revisões precisam de nova publicação.
- Verificado HTTP 200 sem autenticação na URL principal e presença do conteúdo esperado. Alias com sufixo de conta exige autenticação; usar a URL principal acima.
- Hospedagem do desenho não conclui D03 nem D30. Dados permanecem fictícios e as funcionalidades continuam demonstrativas. Validação visual no celular depende do aceite de Mateus.
