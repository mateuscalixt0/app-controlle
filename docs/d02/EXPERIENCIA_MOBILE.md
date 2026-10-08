# D02 — Experiência no celular
Revisado em 08/10/2026 após retorno de Mateus: visual inicial rejeitado; cadastro deve priorizar arquivo/foto. **Aguardando validação de Mateus e verificação visual em 375px.**

## Como conferir
Baixe `prototipo.html` desta pasta e abra no navegador. É um arquivo autônomo, sem instalação ou serviços. A seleção de arquivo e a prévia de imagens ficam apenas na memória do navegador; nada é enviado ou gravado. No computador, use a visualização responsiva com largura de 375px; no celular, abra o arquivo baixado. A página de código do GitHub não executa o HTML.

Todos os dados são fictícios. Data de referência fixa: 08/10/2026. Botões de confirmação demonstram a revisão; não gravam boletos nem enviam mensagens.

## Fluxos e decisões propostas
1. **Vencimentos:** entrada pela visão Hoje, com total das contas abertas; filtros Semana, Mês e Vencidas; ação Cadastrar boleto. Hoje é 08/10; semana de segunda a domingo, 05–11/10; mês civil, 01–31/10; vencidas antes de hoje. Pagas ficam fora. Períodos se sobrepõem e não são somados. O cartão da demonstração é um resumo ilustrativo, não uma listagem individual completa.
2. **Cadastro por documento:** escolher Enviar arquivo (PDF/JPG/PNG) ou Tirar foto → selecionar/capturar → leitura proposta → conferir/editar → revisar → salvar. Beneficiário, CPF/CNPJ quando disponível, fornecedor vinculado, linha digitável, descrição, valor e vencimento ficam na revisão. Manual é alternativa. Informação faltante precisa de preenchimento; resultado ambíguo exige confirmação. A leitura real não está implementada. “Ver exemplo de leitura” preenche dados fictícios independentes do arquivo; “Ver falha de leitura” apresenta recuperação. O protótipo não testa códigos nem identifica boletos reais.
3. **Lista:** conferir produto equivalente e unidade, ajustar quantidade, consultar comparação. O exemplo usa cimento CP II, saco de 50 kg e quantidade inteira. Produtos com quantidade fracionária terão precisão decimal na implementação. Não há estoque. Pesquisa, inclusão, remoção e listas múltiplas serão construídas em cartões posteriores.
4. **Comparação:** cartões verticais por fornecedor, preço por unidade, total para a quantidade, fonte e data. Janela de 90 dias. Economia potencial = (referência − menor preço compatível) × quantidade. Exemplo: (36,50 − 34,00) × 20 = R$ 50,00. Frete e condições ficam fora; histórico não garante cotação atual. Sem preço compatível, não estimar economia; unidade diferente exige conversão confirmada.

Navegação proposta: Boletos, Lista de compras, Comparação. Cadastro pertence a Boletos. Loja identificada no topo. Formulários em uma coluna; ações de pelo menos 44px; rodapé fixo com espaço no conteúdo e safe area.

## Estados e comportamento previsto
O seletor de demonstração alterna Com dados, Vazio, Carregando e Erro em cada tela.
- Vencimentos vazio: orientação para cadastrar; filtro sem resultados deve preservar a possibilidade de trocar período.
- Cadastro vazio: escolhas de arquivo/foto, com alternativa manual. Campo inválido: mensagem associada ao campo, manter conteúdo e foco no primeiro problema.
- Lista vazia: orientação para adicionar produto. A ação de adicionar é prevista, ainda não implementada neste desenho.
- Comparação vazia: orientar cadastro de preço com fonte/data/unidade; não exibir ranking nem economia sem base.
- Carregando: mensagem visível, sem ações dependentes dos dados. Na gravação real, desabilitar confirmação enquanto processa para evitar repetição.
- Erro/rede: mensagem explícita e tentativa novamente; nunca indicar gravação concluída. Na aplicação, preservar formulário após falha, confirmar o estado da gravação antes de repetir quando houver resposta incerta.
- Sessão expirada/acesso negado: encaminhar para login ou informar falta de acesso sem exibir dados privados. Não simulados neste protótipo.
- Cadastro de fornecedor ainda ausente: orientar cadastro em Fornecedores, retornando ao boleto sem perder campos; fluxo compartilhado a detalhar em D07.

A demonstração de erro é um cenário controlado, não um teste de rede. Não há rascunho persistente nem edição offline. A interação de quantidade apenas demonstra os cálculos com centavos inteiros; não substitui a lógica fiscal decimal do produto.

## Roteiro de validação do gestor
- Em 375px, localizar o que vence hoje e separar contas vencidas.
- Abrir Cadastro; testar seletor de arquivo, escolha de imagem local e remoção. Nenhum arquivo é enviado.
- No celular, testar “Tirar foto”. O atributo capture solicita a câmera traseira, mas suporte depende do navegador; a galeria é alternativa.
- Acionar “Ver exemplo de leitura”, conferir beneficiário/fornecedor/valor/data; notar código ausente; corrigir campos e revisar. Confirmar demonstração não grava.
- Testar “Ver falha de leitura” e a alternativa manual.
- Mudar 20 para 30 sacos: referência R$ 1.095,00; menor histórico R$ 1.020,00; economia potencial R$ 75,00.
- Explicar por que o menor histórico pode não ser a melhor compra após frete.
- Alternar os estados nas quatro telas; navegar com Tab/Shift+Tab/Enter; verificar foco e ausência de conteúdo coberto pelo rodapé.
- Registrar pontos confusos e confirmar se a navegação corresponde à rotina da loja.

## Evidências e limites
- Leitura de AGENTS.md, STATUS.md, DECISOES.md e cartão D02 no plano executada via conector GitHub.
- `node --check` executado com sucesso no JavaScript extraído do HTML.
- Tentativa com Playwright/Chromium falhou antes de abrir a página: restrição de socket no ambiente (Operation not permitted / SIGTRAP). **Layout em 375px, teclado e interações ainda não foram verificados no navegador.**
- Revisão documental de datas, períodos sobrepostos, moeda, rótulos fictícios e fórmula do exemplo realizada.
- Sem build de aplicação, testes de persistência, permissões, parser ou integração. D03 ainda criará a aplicação.
- Loja piloto e exemplos anonimizados continuam pendentes de D01.
- Trello não movimentado. Status recomendado: **Aguardando validação do gestor**, com verificação visual pendente.
- Não considerar D02 concluída antes do aceite e da verificação em 375px.

## Próximo passo
Revisar este desenho com Mateus e a loja, registrar ajustes/aceite e executar a verificação visual. Depois, D03 prepara o projeto e os ambientes dentro do escopo aprovado.

## Novo visual e entrada por documento

Direção confirmada por Mateus: claro e simples, com botões grandes. A referência enviada orienta fundo branco, cartões de bordas suaves e cantos arredondados, ações rosa escuro e navegação inferior com ícones e indicador. Enviar arquivo e Tirar foto aparecem lado a lado como ações principais. Aceite das telas finais ainda pendente. As quatro telas receberam a nova aparência; o cadastro recebeu a mudança principal.

### Extração a implementar em cartões posteriores
- PDF textual: tentar extrair texto; PDF escaneado e imagem: usar OCR; confrontar texto e código reconhecidos antes de sugerir campos.
- Ler linha digitável/código de barras, beneficiário e documento, valor, vencimento e demais campos identificáveis. Nome da loja usuária não deve ser confundido com beneficiário. Não prometer preenchimento integral de qualquer documento.
- Validar dígitos, tipo de código, valor e data com parser; ambiguidade/divergência deve ser visível e bloquear confirmação dos campos afetados até correção.
- Não reconhecido: destacar campo para preencher, nunca inventar código/nome/data. Revisão sempre obrigatória antes de persistir.
- Arquivo ilegível: pedir outra foto ou PDF, preservando campos já conferidos. Câmera negada/cancelada: permitir galeria e manual. Leitura indisponível: tentar novamente ou manual.
- Mais de um boleto em PDF: não salvar silenciosamente o primeiro. Identificar páginas/itens e exigir escolha/revisão, ou recusar com orientação, conforme capacidade definida na implementação.
- Arquivo protegido, corrompido ou não suportado: erro claro sem gravação. Detecção de formato no servidor e limites de páginas/pixels/tempo serão necessários; accept/MIME no cliente não garantem segurança.
- Evitar duplicidade de cadastro e repetição de processamento; confirmação com resposta incerta deve consultar o resultado antes de tentar novamente.
- PDFs/imagens privados por loja, acesso autorizado, sem documentos financeiros em logs. Serviços externos e retenção precisam ser definidos antes de enviar dados reais.
- Formatos e limite de 10 MB são proposta inicial; no desenho há rejeição local de tipo/tamanho e prévia para imagens. Isso não constitui validação de conteúdo nem segurança de upload.

### Evidências da revisão
JavaScript revisado passou em node --check. O navegador Chromium alternativo do Playwright não está instalado; permanece a restrição anterior do Chromium do sistema. Captura real em celular, layout em 375px e interações continuam pendentes. Não foram executados testes de extração, pois ela ainda não existe. A mudança de escopo foi registrada em DECISOES.md, AGENTS.md e no plano; custo e prazo precisam ser reavaliados antes da implementação.

## Retorno do gestor — referência visual
Mateus confirmou PDF de boleto e fotos como entradas habituais. O visual foi atualizado conforme a imagem enviada, adaptando a linguagem visual ao controle de boletos/compras. Não há saldos bancários, promoções ou pagamento de boleto no escopo. Sintaxe JavaScript conferida novamente com node --check; verificação visual em 375px e câmera continuam pendentes.
