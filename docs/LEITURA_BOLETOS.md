# Leitura de boletos por câmera e documento

## Fluxo implementado

1. **Câmera:** pede câmera traseira, mostra faixa de enquadramento e decodifica ITF de 44 dígitos continuamente. Aceita apenas códigos com DV válido. Ao reconhecer, captura o quadro completo em JPG e encerra o vídeo. Também permite fotografar sem reconhecer o código; câmera negada tem alternativa pelo botão Arquivo.
2. **Arquivo:** PDF digital, PDF escaneado, JPG ou PNG, até 10 MB. PDF.js percorre todas as páginas sequencialmente, lendo texto e renderizando a página para procurar o código. Páginas com campos incompletos passam pelo Tesseract em português. Fotos recebem leitura do código e OCR.
3. **Conferência:** beneficiário, valor, vencimento e código editáveis; descrição/CPF/CNPJ opcionais. O usuário precisa confirmar. Campos não encontrados permanecem vazios. Código pode ser digitado, validado e usado para preencher valor; data ambígua exige conferência do impresso.
4. **Salvar:** boleto em centavos e documento original no bucket privado `bill-documents`. Nome, MIME, tamanho, caminho, loja e vínculo ao boleto são persistidos. O servidor confere associação à loja e a existência/conteúdo básico do arquivo antes de vincular. A rota de download já existente emite URL assinada de 60 segundos após autorização. O botão de download na listagem não faz parte desta entrega.

O beneficiário não é obtido do código de barras: depende do texto/OCR ou preenchimento manual. Não há consulta bancária nem pagamento. Linhas de 47 dígitos e códigos de 44 têm DVs conferidos. Arrecadação de 44/48 dígitos é validada, mas valor e vencimento continuam manuais conforme a regra do MVP. Valor aberto também é manual.

## Privacidade, recursos e limites

- A leitura principal ocorre no navegador, sem enviar o documento ao n8n. A rota legada permanece, agora com autenticação explícita, validação de cabeçalho e resposta sem cache; não é chamada por este fluxo.
- `predev`/`prebuild` copiam os workers PDF/Tesseract, fontes e modelo português das dependências fixadas para `public/readers`. O navegador busca os recursos no próprio aplicativo; não depende de CDN de OCR. Arquivos gerados não vão ao Git.
- OCR sequencial, canvas limitado a 2200 px no maior lado e limite total de três minutos. Não há corte silencioso na primeira página. Ao atingir o tempo ou interromper, permanecem o original e os dados parciais para conferência. Trabalhos concluídos ou cancelados encerram workers/câmera.
- Não há garantia de extração universal: senha, corrupção, manuscrito, baixa resolução, fonte/layout incomum e documentos sem dados de boleto podem exigir preenchimento manual. Arquivos de outro formato ou com MIME/cabeçalho incompatível são rejeitados.
- Vários códigos de boletos diferentes no mesmo arquivo não são combinados: formulário em branco e aviso para separar/preencher um boleto. Campos rotulados divergentes não são resolvidos por suposição.
- O original só é enviado ao confirmar. Na câmera, o original é o quadro capturado; enquadre a folha toda para arquivar mais que o código. Não há armazenamento persistente local de fotos/documentos antes de salvar.
- Gravação de banco e Storage não é uma transação única. Repetições **na mesma tela** usam UUID e caminho estáveis e não criam outro boleto. Falha de upload/vínculo mantém mensagem e tentativa de recuperação; o arquivo não é apagado após uma resposta ambígua. Se a página for fechada durante falha, a retomada automática do arquivo não está implementada; não recadastre o boleto sem conferir a lista.

## Banco

A inspeção do projeto `app-controle` em 11/10/2026 encontrou bucket privado e tabelas, mas não `bills.beneficiary_document`, `bills.digitable_line` ou `bill_documents.extraction_status`. A migração `compatibilidade_leitura_boletos` adiciona apenas essas colunas, é idempotente com a migração de importação anterior e foi aplicada ao projeto conectado. Não altera valores, políticas ou funções.

## Verificação reproduzível

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:browser
# Em ambiente com Chromium instalado:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

- Testes unitários: DVs, 44/47/48 dígitos, ciclos de vencimento, dinheiro, conflitos, dados ausentes, arquivos inválidos, autorização nas actions e idempotência.
- Playwright: componentes reais e bibliotecas de leitura reais com **actions/Storage simulados**; PDF digital, foto com OCR, PDF escaneado de duas páginas, câmera com vídeo sintético ITF, câmera negada, PDF corrompido, cancelamento, upload com falha e mesmo ID na repetição. Larguras 375/1280 px sem overflow no componente. Não equivale a teste da página inteira autenticada.
- `tests/rls-boletos.sql`: teste transacional executado no projeto conectado com duas lojas/usuários fictícios, owner/member, anônimo e vínculo cruzado; todos os fixtures revertidos. Verifica tabelas de boletos/metadados, não upload real do Storage.
- Pendente: câmera física Android/iPhone; conjunto anonimizado de boletos dos fornecedores; fluxo autenticado completo de upload/download e isolamento dos bytes no Storage; publicação e aceite do gestor.

Advisors antes da mudança identificaram avisos já existentes para RPCs `SECURITY DEFINER` de associação/criação de loja e proteção de senhas vazadas desabilitada. A migração não modifica esses mecanismos. Referências: [RPCs privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Referências técnicas

- [Manual Banpará, DVs e fator de vencimento, anexos 1–4](https://www.banpara.b.br/PortalImagens/2tdgh54u/manual-de-procedimento-de-impressao-de-boletos-por-terceiros-cobranca-banpara-v1-2.pdf): ciclo antigo e reinício em 22/02/2025 com fator 1000; nunca escolher ciclo pela data mais próxima.
- [ZXing Browser](https://github.com/zxing-js/browser) e [scanner sugerido](https://github.com/georapbox/barcode-scanner).
- [PDF.js](https://mozilla.github.io/pdf.js/examples/) e [Tesseract.js](https://github.com/naptha/tesseract.js/blob/master/docs/api.md). RTesseract é um wrapper Ruby; aqui se usa a versão compatível com o projeto TypeScript, sem infraestrutura Ruby/ImageMagick.
- [Storage privado](https://supabase.com/docs/guides/storage/buckets/fundamentals).
