# D02 — Experiência no celular
Preparado em 08/10/2026. **Aguardando validação de Mateus e verificação visual em 375px.**

## Como conferir
Baixe `prototipo.html` desta pasta e abra no navegador. É um arquivo autônomo, sem instalação, rede, armazenamento ou serviços. No computador, use a visualização responsiva com largura de 375px; no celular, abra o arquivo baixado. A página de código do GitHub não executa o HTML.

Todos os dados são fictícios. Data de referência fixa: 08/10/2026. Botões de confirmação demonstram a revisão; não gravam boletos nem enviam mensagens.

## Fluxos e decisões propostas
1. **Vencimentos:** entrada pela visão Hoje, com total das contas abertas; filtros Semana, Mês e Vencidas; ação Cadastrar boleto. Hoje é 08/10; semana de segunda a domingo, 05–11/10; mês civil, 01–31/10; vencidas antes de hoje. Pagas ficam fora. Períodos se sobrepõem e não são somados. O cartão da demonstração é um resumo ilustrativo, não uma listagem individual completa.
2. **Cadastro:** fornecedor → descrição → valor → vencimento → conferir → confirmar. Valor positivo, obrigatório, com duas casas; data exibida em dd/mm/aaaa na revisão. Linha opcional; interpretação real será D09. Para código de 48 dígitos e valor zero, informar dados manualmente; em data ambígua, exigir confirmação antes de salvar. Na aplicação, linha inválida deve ter erro no campo e nunca preencher uma data escolhida silenciosamente.
3. **Lista:** conferir produto equivalente e unidade, ajustar quantidade, consultar comparação. O exemplo usa cimento CP II, saco de 50 kg e quantidade inteira. Produtos com quantidade fracionária terão precisão decimal na implementação. Não há estoque. Pesquisa, inclusão, remoção e listas múltiplas serão construídas em cartões posteriores.
4. **Comparação:** cartões verticais por fornecedor, preço por unidade, total para a quantidade, fonte e data. Janela de 90 dias. Economia potencial = (referência − menor preço compatível) × quantidade. Exemplo: (36,50 − 34,00) × 20 = R$ 50,00. Frete e condições ficam fora; histórico não garante cotação atual. Sem preço compatível, não estimar economia; unidade diferente exige conversão confirmada.

Navegação proposta: Boletos, Lista de compras, Comparação. Cadastro pertence a Boletos. Loja identificada no topo. Formulários em uma coluna; ações de pelo menos 44px; rodapé fixo com espaço no conteúdo e safe area.

## Estados e comportamento previsto
O seletor de demonstração alterna Com dados, Vazio, Carregando e Erro em cada tela.
- Vencimentos vazio: orientação para cadastrar; filtro sem resultados deve preservar a possibilidade de trocar período.
- Cadastro vazio: formulário inicial. Campo inválido: mensagem associada ao campo, manter conteúdo e foco no primeiro problema.
- Lista vazia: orientação para adicionar produto. A ação de adicionar é prevista, ainda não implementada neste desenho.
- Comparação vazia: orientar cadastro de preço com fonte/data/unidade; não exibir ranking nem economia sem base.
- Carregando: mensagem visível, sem ações dependentes dos dados. Na gravação real, desabilitar confirmação enquanto processa para evitar repetição.
- Erro/rede: mensagem explícita e tentativa novamente; nunca indicar gravação concluída. Na aplicação, preservar formulário após falha, confirmar o estado da gravação antes de repetir quando houver resposta incerta.
- Sessão expirada/acesso negado: encaminhar para login ou informar falta de acesso sem exibir dados privados. Não simulados neste protótipo.
- Cadastro de fornecedor ainda ausente: orientar cadastro em Fornecedores, retornando ao boleto sem perder campos; fluxo compartilhado a detalhar em D07.

A demonstração de erro é um cenário controlado, não um teste de rede. Não há rascunho persistente nem edição offline. A interação de quantidade apenas demonstra os cálculos com centavos inteiros; não substitui a lógica fiscal decimal do produto.

## Roteiro de validação do gestor
- Em 375px, localizar o que vence hoje e separar contas vencidas.
- Cadastrar um boleto fictício, conferir fornecedor/valor/data e entender que a demonstração não grava.
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
