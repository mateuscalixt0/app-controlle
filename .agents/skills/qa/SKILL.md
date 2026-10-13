---
name: qa-release-gate
description: QA obrigatório antes de criar ou integrar commits do App Controle. Use para testar fluxos críticos, regressões, permissões, estados de erro e responsividade.
---

# QA Release Gate

Esta skill deve ser aplicada antes de cada commit que altere comportamento e antes de cada merge para `main`. Nenhuma funcionalidade pode ser considerada pronta apenas porque compila.

## Ordem obrigatória

1. Ler o diff e listar os fluxos diretamente afetados.
2. Executar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` quando houver código aplicável.
3. Testar manualmente os caminhos de sucesso, erro, carregamento, vazio e cancelamento.
4. Conferir autorização, isolamento por loja, duplicidade e persistência no banco nas operações que gravam dados.
5. Conferir as telas afetadas em 375px e desktop, incluindo navegação, teclado e ausência de rolagem horizontal.
6. Registrar comandos, resultado e limitações no resumo do commit/PR.

## Checklist de boleto

- Adicionar por PDF, imagem e câmera mantém o arquivo original e permite preencher dados ausentes.
- Beneficiário/fornecedor pode ser selecionado, criado e reutilizado sem recarregar a página.
- Código, valor e vencimento são validados antes de salvar.
- Copiar código funciona; baixar documento exige autorização e usa URL temporária.
- Editar abre um formulário com o boleto correto e salva as alterações.
- Cancelar grava `status = cancelled` e impede marcar como pago.
- Marcar como pago grava `status = paid` e `paid_at`, atualiza a lista e não cria duplicidade.
- Falhas de rede ou banco exibem erro e não mostram sucesso falso.

## Resultado

O relatório deve separar `PASSOU`, `FALHOU` e `PENDENTE`. Se algum teste crítico falhar ou não puder ser executado, não fazer merge silencioso: corrigir ou registrar a pendência e pedir decisão explícita.
