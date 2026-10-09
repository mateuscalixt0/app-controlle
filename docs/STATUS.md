# Andamento

Atualizado em 08/10/2026.

## Entrega atual — telas e navegação mobile para validação (D02)

- Design mobile preservado: fundo claro, cartões arredondados, ações em rosa e largura máxima de 480px.
- Rodapé reorganizado com cinco destinos: Adicionar boleto, Boletos a pagar, Início central, Lista de faltas e Compras e preços.
- Telas de validação criadas para início, boletos, envio por foto/documento, lista de faltas, anotação simplificada e compras/preços.
- Lista fictícia demonstra prioridades com cor e texto, menor preço registrado, ausência de histórico, busca e filtros combinados em memória.
- Detalhes fictícios abrem em modal mobile, recebem foco no fechamento, fecham com `Esc`, têm rolagem e mostram estados com zero, um ou mais registros sem inventar tendência.
- Todos os dados de exemplo e interações sem persistência estão identificados como protótipo. Upload e botões de gravação permanecem desativados.

**Status de D02:** telas prontas para validação de produto por Mateus. Não considerar anotação, filtros, histórico, OCR, XML ou cadastro de boleto concluídos: ainda não existe persistência, login, banco de negócio ou processamento de arquivos.

## Verificações desta entrega

- `npm run lint` e `npm run typecheck`: aprovados.
- Navegador Chromium em 375×812: seis rotas responderam HTTP 200, exibiram os cinco itens de navegação, não apresentaram rolagem horizontal nem erros no console.
- Modal: abriu pelo cartão, colocou foco no botão “Fechar detalhes” e fechou com `Esc`.
- Busca e filtros combinados foram exercitados apenas sobre dados fictícios em memória; recarregar restaura os exemplos.
- `npm run build`: aprovado com webpack; oito rotas estáticas geradas. O build usa webpack porque o Turbopack deste ambiente não consegue abrir a porta interna usada pelo processador CSS.

## Como conferir esta entrega

1. Execute `npm run dev` e abra `http://localhost:3000`.
2. Percorra os cinco destinos do rodapé, mantendo Início no centro.
3. Em Lista de faltas, combine busca, prioridade e “Sem classificação”; toque em um item e teste o fechamento do modal.
4. Confira a ordem visual enviar → ler → conferir → salvar em Adicionar boleto.
5. Valide textos, campos e organização. Nenhuma ação desta entrega deve ser usada para cadastrar dados reais.

## Próxima tarefa

Após o aceite visual de D02, construir D04 e D05 (banco/RLS e login/loja) para então implementar a anotação simplificada com persistência, prioridades e filtros. IA de classificação permanece explicitamente pendente.

## Integrações e limitações

- Quadro de referência: https://trello.com/b/gY23LQ8z.
- Os cartões não foram atualizados nesta entrega; status do arquivo não implica movimentação no Trello.
- Supabase conectado; Vercel e Resend ainda não foram conectados a este repositório.
- Existe somente o projeto principal informado pelo titular; ambiente Supabase separado para testes ainda não foi definido.
- Existe um layout anterior na Vercel, mas esta versão não foi publicada.
- Sem tabelas de negócio, login, persistência, leitura OCR/XML ou dados reais no repositório ou banco.

## Entrega anterior — integração inicial com Supabase (parte de D03)

- Projeto Next.js 16 com TypeScript estrito, React 19 e Tailwind 4.
- Projeto Supabase `nmuiczryoqcospdithdx` ativo e conectado por chave publicável moderna; banco vazio, PostgreSQL 17.11.
- Clientes separados para navegador e servidor; `.env.local` ignorado pelo Git.
- Build, consulta autenticada e advisors do Supabase aprovados na entrega.
