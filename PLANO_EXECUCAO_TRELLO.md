> Importado para o GitHub em 08/10/2026. O quadro foi criado em https://trello.com/b/gY23LQ8z conforme registro da sessão anterior. Este documento preserva o planejamento inicial; consulte `docs/STATUS.md` para andamento e `docs/DECISOES.md` para decisões posteriores.

# Plano de execução — Organizador de Compras e Boletos
Versão inicial: 07/10/2026. Base: CLAUDE.md e PLANO_MVP.md fornecidos pelo gestor.

## Linha inicial para o quadro
Construir e validar um aplicativo para pequenos lojistas controlarem boletos e planejarem compras com histórico de preços por fornecedor, com o Codex responsável pelo desenvolvimento técnico e Mateus responsável pela gestão do produto.

## Organização no Trello
Um único quadro: **App Controle — Construção do MVP**.
Etiquetas: **Gestão de Boletos** (azul) e **Gestão de Produtos** (verde).
Tarefas comuns recebem as duas etiquetas. “Gestão de Produtos” cobre cadastro, lista de compras, preços e XML; não inclui controle de estoque.

Listas, nesta ordem:
1. Referências e decisões — objetivo, escopo, arquitetura e decisões registradas.
2. Backlog — tudo que está previsto, ordenado por dependência.
3. Esta semana — cartões que já têm condições de começar.
4. Em desenvolvimento — preferencialmente uma entrega principal por vez.
5. Em testes — implementação pronta para verificação técnica.
6. Aguardando validação do gestor — entrega testada e acessível para conferir.
7. Concluído — critérios cumpridos, evidências e documentação atualizadas.
8. Impedimentos — motivo, responsável pela resolução e ação necessária.

Título de cartão: **[D01] Definir o MVP e organizar o trabalho**.
Descrição: objetivo, trabalho técnico, entrega verificável, dependências, participação do gestor e evidências.
Prioridade na descrição: P0 = segurança, dinheiro incorreto, perda de dados ou uso bloqueado; P1 = necessário ao MVP; P2 = melhoria posterior.
Código feito não significa tarefa concluída. Cartão sem teste executado deve informar o que falta.

## Responsabilidades e ritmo
**Codex:** propor e documentar arquitetura; implementar; criar migrações; proteger dados; testar; corrigir; preparar/publicar quando autorizado e com acesso; manter documentação e informar custos, riscos e impedimentos. Decisões técnicas rotineiras ficam com o Codex.
**Mateus:** priorizar problemas; validar experiência; conseguir exemplos e acesso ao piloto; decidir preço, gastos, lançamento e mudanças de escopo; conectar contas quando a ação exigir o titular.
**Loja piloto:** usar o produto e fornecer retorno sobre a rotina.
Não há necessidade de Mateus escrever código nem prescrever arquitetura.

Ao começar: escolher o cartão pronto de maior prioridade, revisar dependências e apresentar objetivo do dia.
Ao terminar: informar o que foi entregue, testes executados, link/forma de conferir, impedimentos e próximo cartão.
O trabalho ocorre nas sessões de execução; este plano não inicia trabalho automático em dias futuros.
Falhas críticas têm prioridade sobre a próxima funcionalidade. Mudança de escopo entra no backlog antes de alterar o compromisso da semana.

## Premissas do calendário
40 dias de trabalho como previsão inicial: 30 de preparação/construção e 10 de piloto, aproximadamente 8 semanas se houver trabalho em cinco dias por semana. Reservar mais 1–2 semanas para ajustes se necessário. Não é uma promessa de prazo.
“Dia” é um bloco planejado de trabalho, não garantia de que qualquer funcionalidade caberá em uma sessão.
Disponibilidade do gestor sugerida: 20–30 minutos por dia para decisões e validações, além de entrevistas e testes maiores. Capacidade técnica e duração real serão recalibradas ao fim da primeira semana.
Não foram definidas datas de vencimento: dependem da data de início, contas conectadas e disponibilidade.
Se um cartão levar mais tempo, dividir em partes verificáveis e mover os dias seguintes. Nunca pular testes para manter uma data.
Validar problema e disposição de uso com a loja durante as semanas iniciais. Antes de continuar além da base, registrar se os fluxos fazem sentido para o piloto; interromper investimento em funcionalidades sem valor confirmado.

## Etapas e marcos
| Etapa | Dias | Marco |
|---|---|---|
| Produto e fundação | 1–7 | Fluxos definidos, login e isolamento testados, fornecedores funcionando |
| Gestão de boletos | 8–15 | Cadastrar, acompanhar, anexar, pagar e receber lembretes |
| Gestão de produtos | 16–20 | Produtos, lista, preços equivalentes e economia potencial |
| Importação XML | 21–25 | Nota conferida, importação sem duplicidade e contas sugeridas |
| Preparação operacional | 26–30 | PWA, testes, recuperação e beta restrito |
| Piloto e decisão | 31–40 | Evidências de uso, correções e decisão comercial |

## Arquitetura de referência
Manter a base prevista nos documentos: Next.js com TypeScript e Tailwind; Supabase para Postgres, autenticação e arquivos; Vercel para hospedagem; Resend para e-mails; Vitest para lógica e testes adicionais de integração/fluxo conforme necessário. Versões, compatibilidade, limites dos planos e custos serão verificados no setup, antes de contratar.
Uma aplicação modular, com áreas de boletos e produtos compartilhando login, lojas e fornecedores. Não há necessidade inicial de microsserviços.
O navegador apresenta a interface. Operações validam sessão, permissão e dados no servidor quando aplicável; o banco também aplica isolamento por loja. Verificações de tela sozinhas não protegem os dados.
Alterações de banco entram em migrações versionadas. Desenvolvimento/teste e produção usam dados e credenciais separados.
Arquivos ficam privados; acesso temporário autorizado; upload com limite e validação de formato.
Lembretes usam execução agendada, registro de tentativas e proteção contra duplicidade; escolha do agendador depende do ambiente e plano verificados no setup.
PWA inicialmente depende de conexão para operações financeiras; falha de rede deve ser explícita. Não prometer edição financeira offline.

### Decisões técnicas necessárias que assumirei
- Isolamento: toda entidade de negócio precisa pertencer a uma loja; conferir também vínculos entre tabelas e arquivos, inclusive tentativas de trocar identificadores.
- Autorização: criar papéis mínimos owner/member e documentar ações permitidas; criação de proprietário e mudanças de acesso não podem depender de dados enviados livremente pelo cliente.
- Dinheiro: totais de boletos em centavos; quantidade e preço unitário fiscal com precisão decimal suficiente, sem arredondamento precoce. Definir regra de arredondamento ao calcular totais.
- Datas: vencimento como data civil; referência de operação da loja em America/Sao_Paulo. Hoje/semana/mês têm intervalos explícitos; esses blocos podem se sobrepor e não devem ser somados.
- Boleto: verificar especificação oficial na implementação. Não escolher silenciosamente uma data pelo fator quando houver ambiguidade. Códigos de arrecadação e valor zero exigem dados manuais no escopo inicial.
- XML: identidade da NF-e por chave de acesso e loja; confirmar antes de gravar; rejeitar arquivo malformado; impedir repetição e importação parcialmente concluída.
- Comparação: só itens equivalentes e unidades compatíveis; janela inicial de 90 dias; mostrar origem e data. Preço registrado não garante preço de uma cotação atual.
- Economia: exibir **potencial** com referência explícita. Não alegar economia realizada sem compra, referência e quantidade verificáveis; medição realizada pode ficar para etapa posterior.
- Operação: logs sem códigos financeiros ou XML integral, registro mínimo de alterações críticas, backups com cobertura de banco e arquivos, ensaio de restauração e procedimento de reversão.
- Privacidade: prever informações ao usuário, retenção e remoção/exportação assistidas. Textos e adequação jurídica exigem validação própria antes de comercialização.

Essas são decisões e critérios de implementação; não são uma afirmação de que o aplicativo já existe ou está seguro.

## Escopo preservado
Dentro: cadastro prioritário de boletos por PDF/imagem ou foto, extração assistida e revisão obrigatória (incluído por Mateus em 08/10/2026); manual como alternativa; login/loja, fornecedores, boletos, painel, anexos e comprovantes, lembretes por e-mail, produtos, lista de compras, preços manuais, comparação e XML com vínculo manual lembrado.
Fora: pagamento bancário no app, DDA, ERP, estoque, emissão fiscal, conciliação, IA para associação automática, app nativo, cobrança de assinatura automatizada, push e WhatsApp.
Não chamar o sistema de ERP nem acrescentar estoque porque a etiqueta se chama Gestão de Produtos.

## Cartões por dia
Dependência geral: o cartão anterior deve estar suficientemente concluído para liberar a próxima entrega. Coleta de exemplos, entrevistas e conexão de contas podem acontecer em paralelo. Dependências externas são registradas em Impedimentos.

### [D01] Definir o MVP e organizar o trabalho
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Registrar escopo, critérios do beta e decisões pendentes; adaptar orientações para AGENTS.md.
- **Critério de conclusão:** Escopo e responsabilidades documentados; backlog ordenado.
- **Sua participação:** Confirmar loja piloto e prioridades.
- **Dependência:** Documentos iniciais disponíveis.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D02] Desenhar a experiência no celular
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Preparar telas de vencimentos, cadastro de boleto prioritariamente por arquivo/foto com revisão e alternativa manual, lista de compras e comparação. Visual inicial rejeitado pelo gestor; validar versão revisada.
- **Critério de conclusão:** Fluxos compreensíveis em 375px; estados vazios e erros previstos.
- **Sua participação:** Validar os fluxos e pedir exemplos à loja.
- **Dependência:** D01 e informações da loja piloto.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D03] Preparar repositório e ambientes
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Criar projeto, GitHub, verificação automática e ambiente de testes; documentar custos e acessos necessários.
- **Critério de conclusão:** Projeto executa e build passa; segredos fora do repositório; teste separado de produção.
- **Sua participação:** Criar/conectar contas necessárias e definir teto de gasto.
- **Dependência:** D01–D02 e contas/acessos disponibilizados pelo titular.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D04] Construir banco e regras de acesso
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Modelar lojas, membros e entidades dos dois módulos; criar migrações e restrições de vínculo por loja.
- **Critério de conclusão:** Banco recriável; tabelas e arquivos com política de acesso definida.
- **Sua participação:** Conhecer o resumo das decisões; sem decisão técnica exigida.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D04.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D05] Implementar login e cadastro da loja
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Login, logout, recuperação de acesso e criação segura de loja e proprietário.
- **Critério de conclusão:** Usuário entra, recupera acesso e sai; conta sem sessão não acessa dados.
- **Sua participação:** Testar entrada e recuperação.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D05.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D06] Testar isolamento e arquivos privados
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Testar duas lojas, permissões de membro, URLs de arquivos e tentativas de alterar identificadores.
- **Critério de conclusão:** Loja A não lê nem altera dados ou anexos da loja B; chaves privilegiadas fora do navegador.
- **Sua participação:** Conferir demonstração dos testes.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D06.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D07] Cadastrar fornecedores
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Criar cadastro, edição, pesquisa e arquivamento que preserve o histórico.
- **Critério de conclusão:** Fornecedor pode ser usado nos dois módulos sem apagar registros relacionados.
- **Sua participação:** Cadastrar três fornecedores de exemplo.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D07.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D08] Cadastrar contas manualmente
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Fornecedor, descrição, valor, vencimento e status; validar campos no servidor.
- **Critério de conclusão:** Conta válida salva; valores inválidos bloqueados; datas não mudam por fuso.
- **Sua participação:** Cadastrar três boletos de teste.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D08.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D09] Interpretar linha digitável

> Revisão solicitada pelo gestor em 08/10/2026: incluir captura por arquivo/câmera e extração assistida de PDF/imagem. Dividir esta etapa em entregas verificáveis: entrada privada de documentos; extração de texto/OCR; validação e revisão; duplicidade e recuperação. Antes de implementar, definir limites, serviço/custo e atualizar estimativa. OCR não está implementado; gastos continuam sujeitos à aprovação. Nenhuma tarefa adicional foi criada no Trello.

- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Confirmar especificação vigente; validar 47 dígitos, valor e fatores de vencimento; prever entrada de 48 dígitos.
- **Critério de conclusão:** Testes cobrem código inválido, valor zero e ciclos de vencimento; data ambígua exige confirmação.
- **Sua participação:** Conferir valores e datas com exemplos anonimizados.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D09.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D10] Listar vencimentos e copiar código
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Pesquisar e filtrar contas; destacar vencidas; copiar linha digitável com retorno visual.
- **Critério de conclusão:** Código copiado confere; lista diferencia abertas, vencidas e pagas.
- **Sua participação:** Testar pelo celular.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D10.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D11] Montar painel financeiro
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Hoje, semana e mês; total apenas de contas abertas; documentar intervalos e sobreposição.
- **Critério de conclusão:** Totais conferem com conjunto conhecido; vencidas aparecem separadas.
- **Sua participação:** Conferir os totais e a leitura do painel.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D11.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D12] Anexar boletos com proteção
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Upload privado de PDF/imagem com limites de tamanho e tipo; acesso temporário autorizado.
- **Critério de conclusão:** Arquivo inválido recusado; anexo acessível apenas à loja correta.
- **Sua participação:** Anexar e abrir PDF/foto.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D12.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D13] Marcar pagamento e anexar comprovante
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Registrar data e método; anexar comprovante; permitir corrigir marcação com histórico mínimo.
- **Critério de conclusão:** Duplo clique não duplica ação; pago sai do total em aberto; correção é rastreável.
- **Sua participação:** Simular pagamento e correção.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D13.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D14] Implementar lembretes por e-mail
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Agendar D-1 e dia do vencimento; conferir status antes do envio; registrar tentativas e evitar duplicidade.
- **Critério de conclusão:** Testes simulam datas, pagamento e reexecução; destinatário validado; falhas visíveis.
- **Sua participação:** Validar texto e destinatário; autorizar envio real quando necessário.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D14.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D15] Validar o módulo financeiro
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Testar cadastro até pagamento; corrigir falhas e revisar acesso aos anexos.
- **Critério de conclusão:** Fluxo completo funciona no celular e testes críticos passam.
- **Sua participação:** Executar roteiro com os boletos da loja piloto.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D15.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D16] Cadastrar produtos e unidades
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Criar itens específicos, categorias e unidades; editar e arquivar preservando histórico.
- **Critério de conclusão:** Produtos de especificações diferentes ficam separados; unidade é obrigatória.
- **Sua participação:** Cadastrar dez produtos reais.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D16.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D17] Registrar preços manualmente
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Fornecedor, data, quantidade e preço; definir precisão decimal para frações e arredondamento.
- **Critério de conclusão:** Valores fracionários preservados; entrada inválida recusada; data e origem registradas.
- **Sua participação:** Registrar exemplos de preços de dois fornecedores.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D17.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D18] Construir lista de compras
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Adicionar itens e quantidades; editar, remover e marcar como comprado.
- **Critério de conclusão:** Lista persiste; quantidade fracionária funciona quando aplicável; ação duplicada não corrompe dados.
- **Sua participação:** Montar uma lista real.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D18.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D19] Comparar preços equivalentes
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Mostrar menor preço registrado nos últimos 90 dias, fornecedor, data e unidade.
- **Critério de conclusão:** Não compara caixa com unidade sem conversão confirmada; informa ausência de preço recente.
- **Sua participação:** Validar comparações de cinco itens.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D19.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D20] Exibir histórico e economia potencial
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Histórico por item; comparação com referência explícita e quantidade; informar exclusões de frete e condições.
- **Critério de conclusão:** Cálculo reproduzível; rótulo economia potencial; nenhum valor apresentado como economia realizada.
- **Sua participação:** Validar explicação e referência de comparação.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D20.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D21] Ler XML de NF-e com segurança
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Extrair emitente, chave, produtos, unidades, preços e duplicatas; limitar arquivo e rejeitar conteúdo não suportado.
- **Critério de conclusão:** Testes com XML simples, múltiplos itens, namespaces e inválidos; preserva precisão.
- **Sua participação:** Fornecer notas anonimizadas de diferentes fornecedores.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D21.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D22] Conferir e vincular produtos da nota
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Prévia da importação; associar produto do fornecedor ao item da loja e salvar vínculo.
- **Critério de conclusão:** Primeiro vínculo exige confirmação; próximo XML reconhece vínculo na mesma loja.
- **Sua participação:** Conferir correspondências e unidades.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D22.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D23] Importar sem duplicar ou salvar parcialmente
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Persistir nota e preços com chave única por loja; tratar reenvio, falha e concorrência.
- **Critério de conclusão:** Reimportação não duplica nota/preços; falha não deixa importação incompleta como concluída.
- **Sua participação:** Reimportar uma nota e conferir resultado.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D23.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D24] Sugerir contas a partir das duplicatas
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Prévia de valores/vencimentos; criação somente após confirmação; separar duplicata de linha digitável.
- **Critério de conclusão:** Contas não recebem código inventado; repetição não duplica parcelas; vínculo com nota mantido.
- **Sua participação:** Conferir uma nota parcelada.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D24.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D25] Validar compras e XML de ponta a ponta
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Importar, vincular, comparar e montar lista; tratar equivalências e produtos sem histórico.
- **Critério de conclusão:** Casos reais conferem; unidades incompatíveis ficam bloqueadas; erros são compreensíveis.
- **Sua participação:** Usar uma nota real e uma lista de compra.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D25.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D26] Ajustar PWA, acessibilidade e conexão
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Instalação quando suportada, navegação, contraste, teclado e mensagens de rede; revisar cache e logout.
- **Critério de conclusão:** Sem dados sensíveis em cache compartilhado; falha de rede não informa gravação falsa.
- **Sua participação:** Testar no celular usado pela loja.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D26.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D27] Revisar segurança e observabilidade
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Revisar autorização por ação, RLS, uploads, dependências, limites e logs sem conteúdo sensível.
- **Critério de conclusão:** Tentativas de acesso entre lojas bloqueadas; erros investigáveis; falhas críticas corrigidas.
- **Sua participação:** Receber relatório curto de riscos resolvidos e pendentes.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D27.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D28] Preparar recuperação e operação
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Procedimentos de backup/restauração de banco e arquivos, reversão de versão e migrações, exportação/remoção assistidas.
- **Critério de conclusão:** Restauração ensaiada em teste; manual informa cobertura e limitações reais do plano contratado.
- **Sua participação:** Confirmar quem atende suporte e valida documentos de privacidade.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D28.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D29] Executar aceite completo
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Rodar testes de fluxos críticos, moeda/datas, permissões e celular; registrar pendências.
- **Critério de conclusão:** Sem falha crítica de acesso, dinheiro ou perda de dados; checklist com evidências.
- **Sua participação:** Executar o roteiro de aceite e registrar ajustes.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D29.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D30] Publicar beta restrito
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Configurar produção, domínio quando disponível, HTTPS, variáveis e monitoramento; cadastrar piloto e orientar uso.
- **Critério de conclusão:** Fluxo essencial testado em produção; recuperação documentada; acesso restrito ao piloto.
- **Sua participação:** Liberar uso piloto e participar da apresentação.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D30.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D31] Acompanhar o primeiro cadastro real
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Observar cadastro dos boletos e dificuldades; corrigir bloqueios.
- **Critério de conclusão:** Primeiros boletos conferidos com a loja.
- **Sua participação:** Acompanhar o lojista e registrar dúvidas.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D31.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D32] Acompanhar a primeira compra real
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Observar lista e consulta de histórico sem orientar cada clique.
- **Critério de conclusão:** Lista usada; pontos de confusão registrados.
- **Sua participação:** Coletar relato do lojista.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D32.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D33] Corrigir os maiores bloqueios do piloto
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Priorizar falhas por impacto; verificar lembretes e importações.
- **Critério de conclusão:** Falhas que impedem uso corrigidas e retestadas.
- **Sua participação:** Definir prioridade entre melhorias de experiência.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D33.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D34] Medir alimentação do histórico
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Conferir notas/preços cadastrados e tempo gasto para importar.
- **Critério de conclusão:** Registro de uso real, tempo e pontos de abandono.
- **Sua participação:** Conversar sobre dificuldade de alimentar o app.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D34.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D35] Fazer revisão da primeira semana
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Consolidar uso, erros e solicitações; revisar cronograma e escopo.
- **Critério de conclusão:** Decisão documentada sobre correções da semana seguinte.
- **Sua participação:** Escolher prioridades de produto.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D35.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D36] Conferir rotina financeira continuada
- **Etiquetas:** Gestão de Boletos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Verificar vencimentos, lembretes, pagamentos e comprovantes reais.
- **Critério de conclusão:** Totais conferem; falhas de entrega tratadas sem duplicar e-mails.
- **Sua participação:** Confirmar confiança do lojista no painel.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D36.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D37] Conferir valor das comparações
- **Etiquetas:** Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Revisar preços, unidades, datas e economia potencial com o lojista.
- **Critério de conclusão:** Exemplos de utilidade ou falta de valor documentados.
- **Sua participação:** Avaliar se comparação ajuda a decidir compras.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D37.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D38] Testar interesse e preço
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Preparar roteiro de oferta e controle manual de pagamento; registrar interesse e objeções.
- **Critério de conclusão:** Oferta e condições claras; evidência de aceitação ou recusa.
- **Sua participação:** Conduzir conversa comercial e decidir preço.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D38.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D39] Concluir correções prioritárias
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Resolver falhas do beta; repetir verificações afetadas e atualizar documentação.
- **Critério de conclusão:** Pendências críticas encerradas; outras priorizadas.
- **Sua participação:** Validar as correções visíveis.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D39.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

### [D40] Decidir lançamento e próxima etapa
- **Etiquetas:** Gestão de Boletos + Gestão de Produtos.
- **Responsável técnico:** Codex. **Validação de produto:** Mateus.
- **Prioridade:** P1; qualquer falha crítica identificada vira P0.
- **Trabalho e entrega:** Consolidar resultados, custos, limitações e backlog pós-MVP.
- **Critério de conclusão:** Decisão explícita: ampliar piloto, lançar ou ajustar; próximos cartões definidos.
- **Sua participação:** Decidir lançamento com base no uso real.
- **Dependência:** Entregas anteriores necessárias ao fluxo; revisar ao iniciar D40.
- **Checklist do cartão:** [ ] Implementar/preparar; [ ] Verificar critérios; [ ] Registrar evidências e limitações; [ ] Validar produto quando aplicável; [ ] Atualizar documentação e próximo passo.

## Critério de pronto para o beta
- Login, recuperação e isolamento entre duas lojas testados.
- Valores e datas conferem com os exemplos; parsers têm testes com entradas válidas e inválidas.
- Fluxos principais funcionam no celular da loja; dados persistem e erros não simulam sucesso.
- Upload e download privados, sem exposição de credenciais.
- Importações e reexecuções não duplicam registros.
- Lembretes testados com destinatário de teste antes do uso real.
- Recuperação de banco e arquivos ensaiada; limites de operação registrados.
- Ausência de defeitos críticos conhecidos; demais defeitos priorizados.
- Gestor fez aceite; piloto conhece limitações e canal de suporte.

## O que acompanhar no piloto
Ativação (meta inicial: 5 boletos cadastrados), frequência semanal de uso (hipótese: 3 ou mais dias), notas/preços adicionados, tempo para importar, erros, utilidade das comparações e disposição de pagar. Metas são hipóteses de validação, não garantias.
Contar uso com o mínimo de dados necessário. Conversas com o lojista complementam as métricas.
No D40, decidir pelo uso observado; elogios isolados não comprovam adoção.

## Referências técnicas consultadas
- Supabase: Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase: Storage Access Control — https://supabase.com/docs/guides/storage/security/access-control
- Next.js: Authentication — https://nextjs.org/docs/app/guides/authentication

## Estado deste documento
Plano preparado para organizar o quadro. Nenhuma tarefa de desenvolvimento está concluída por estar descrita aqui. Este arquivo não cria cartões, etiquetas ou prazos no Trello.

