# Andamento

Atualizado em 08/10/2026.

## Entrega atual — D02, revisão após retorno de Mateus

- Protótipo navegável: [docs/d02/prototipo.html](d02/prototipo.html).
- Fluxos, estados, limites e roteiro de aceite: [EXPERIENCIA_MOBILE.md](d02/EXPERIENCIA_MOBILE.md).
- Visual inicial rejeitado por Mateus. Mateus confirmou visual claro com botões grandes e enviou referência. Quatro telas adaptadas com fundo branco, cartões arredondados, ações rosa escuro e navegação com ícones.
- Cadastro prioriza Enviar arquivo e Tirar foto; seleção local e prévia de imagem disponíveis no protótipo. Manual permanece como alternativa.
- Exemplo de leitura demonstra revisão de beneficiário, fornecedor, código, valor e vencimento; não extrai informações reais do arquivo.
- Inclusão de extração/OCR no escopo registrada em DECISOES.md, AGENTS.md e plano. Custos, serviço e esforço da implementação ainda não definidos.
- Dados fictícios identificados; sem gravação, pagamentos, integrações ou envio de e-mail.
- Estados de vazio, carregamento e erro selecionáveis para demonstração.

**Status de D02:** desenho preparado; aguarda verificação visual em 375px e validação de Mateus/loja. Não considerar concluído.

## Verificações desta entrega

- Lidos AGENTS.md, DECISOES.md, STATUS.md e cartão D02 do plano.
- JavaScript revisado do protótipo passou em `node --check`.
- Chromium alternativo do Playwright não instalado. Extração, upload ao servidor e gravação não implementados nem testados.
- Revisão documental dos períodos, moeda, dados fictícios e economia potencial.
- Tentativa Playwright/Chromium bloqueada antes de abrir a página por restrição de socket do ambiente. Layout em 375px, teclado e interações permanecem pendentes de execução no navegador.
- Sem build de aplicação ou testes de banco, segurança, parser e persistência; aplicativo ainda não implementado.

## D01 e dependências preservadas

Preparação documental de D01 pronta; confirmação da loja piloto e validação de produto ainda pendentes. Protótipo usa dados fictícios enquanto se aguardam exemplos anonimizados. Referências e plano de 40 tarefas preservados.

## Próximo passo

Validar o novo visual e o fluxo arquivo/foto → leitura → revisão. Formatos habituais confirmados por Mateus: PDF de boleto e fotos. Conferir em 375px e câmera no celular; registrar ajustes e aceite. Após validar D02, seguir com D03: projeto executável, verificações automáticas, ambientes, versões e custos. Não provisionar serviços pagos sem decisão do gestor.

## Integrações e limitações

- Repositório: `mateuscalixt0/app-controlle`; entrega proposta na branch `d02-experiencia-mobile`.
- Git via shell indisponível por falha do proxy; leitura e alterações feitas pelo conector GitHub.
- Quadro: https://trello.com/b/gY23LQ8z. Nenhum cartão movimentado; status a registrar: Aguardando validação do gestor, com verificação visual pendente.
- Supabase, Vercel e Resend não verificados/conectados.
- Sem aplicação publicada, dados reais ou funcionalidades completas. Arquivo HTML é protótipo local, não beta.
