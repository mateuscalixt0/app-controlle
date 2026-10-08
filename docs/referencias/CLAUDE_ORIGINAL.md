> Arquivo histórico, não operacional. Para desenvolver, siga o `AGENTS.md` da raiz.

# CLAUDE.md — Organizador de Compras e Boletos (nome temporário)

> Este arquivo é lido pelo Claude Code no início de cada sessão. Mantenha curto e atualizado. O plano detalhado está em `PLANO_MVP.md`.

## 1. O que é o projeto
SaaS web (PWA, mobile-first) para pequenos lojistas de **material de construção**, com dois módulos:
1. **Financeiro:** cadastrar boletos, alertar vencimentos, mostrar/copiar a linha digitável, marcar como pago e anexar comprovante.
2. **Compras:** lista de compras + histórico de preços por item e fornecedor, mostrando quem vendeu mais barato. Preços entram por **XML de NF-e** ou digitação manual.

**Diferencial (o que justifica a mensalidade):** o app diz "você economizou R$ X comprando do fornecedor certo". O financeiro é a porta de entrada para o uso diário.

## 2. Quem é o usuário
- Dono de loja pequena (1 a 3 pessoas usam o sistema). Pouco tempo, pouca paciência com tecnologia.
- Usa o celular o dia todo. Hoje controla tudo em agenda de papel e pasta.
- Cliente inicial: uma loja de material de construção real onde o fundador trabalhou (~10 boletos/mês).

## 3. Como o Claude deve trabalhar comigo
- O fundador **não é desenvolvedor sênior**. Explique decisões em linguagem simples, em poucas linhas.
- **Pequenos passos:** uma funcionalidade por vez, rodando e testável antes da próxima.
- **Antes de codar algo grande**, proponha o plano em 5 linhas e espere minha confirmação.
- **Não adicionar funcionalidades fora do escopo do MVP** (seção 5). Se achar que algo falta, sugira e pergunte.
- Prefira solução simples e conhecida a solução "elegante". Evite dependências desnecessárias.
- Escreva **testes** para os parsers (boleto e XML). Erro neles = dinheiro errado na tela.
- Interface e textos **em português do Brasil**. Datas dd/mm/aaaa, moeda R$ 1.234,56.
- Ao terminar uma tarefa, atualize o checklist da seção 9 e diga qual é o próximo passo.

## 4. Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, configurado como PWA.
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Row Level Security).
- **Hospedagem:** Vercel.
- **Notificações:** e-mail (Resend) no MVP; push/WhatsApp só depois de validar.
- **Parser de XML:** `fast-xml-parser`.
- **Testes:** Vitest.
- Cada loja é um *tenant*: **todo dado pertence a uma `store_id`** e é protegido por RLS.

## 5. Escopo do MVP
**Dentro:**
- Login (e-mail + senha ou link mágico) e cadastro da loja.
- Fornecedores (nome, categoria, telefone/WhatsApp).
- Boletos: cadastrar colando a linha digitável (ou digitando), anexar PDF/foto, ver lista por vencimento.
- Painel "Hoje / Esta semana / Este mês" com total a pagar.
- Botão copiar linha digitável; botão "marcar como pago" (caixa ou app do banco) + anexo de comprovante.
- Alerta por e-mail de vencimento (1 dia antes e no dia).
- Itens: o lojista cria os itens ("torneira jardim 1/2 cromada").
- Lista de compras com itens e quantidades; ao lado de cada item, o **menor preço recente e o fornecedor**.
- Histórico de preços: entrada manual e importação de XML de NF-e.
- Vínculo "produto da nota → item do lojista" feito uma vez e lembrado (`item_aliases`).

**Fora (não fazer agora):**
- Pagar boleto dentro do app, integração bancária ou DDA.
- Leitura de boleto por OCR/foto (só colar código ou PDF depois).
- Integração com ERP, controle de estoque, emissão de nota, fluxo de caixa completo, conciliação.
- Match automático de produtos por IA entre fornecedores.
- App nativo (iOS/Android). Cobrança automática (usar Pix manual na fase de teste).

## 6. Modelo de dados (resumo)
- `stores` (id, name, cnpj, created_at)
- `store_members` (store_id, user_id, role: owner|member)
- `suppliers` (id, store_id, name, cnpj, category, phone)
- `bills` (id, store_id, supplier_id, description, amount_cents, due_date, barcode_line, status: open|paid, paid_at, paid_method: cash|bank_app, invoice_id nullable)
- `bill_attachments` (id, bill_id, kind: boleto|receipt, file_path)
- `items` (id, store_id, name, unit, category)
- `item_aliases` (id, store_id, supplier_id, supplier_product_code, supplier_product_name, item_id)
- `invoices` (id, store_id, supplier_id, number, issued_at, total_cents, xml_path)
- `price_records` (id, store_id, item_id, supplier_id, unit_price_cents, quantity, date, source: xml|manual, invoice_id nullable)
- `shopping_list_items` (id, store_id, item_id, quantity, status: pending|bought)

Regras: valores **sempre em centavos (inteiro)**. Datas de vencimento como `date`, sem horário.

## 7. Regras de negócio críticas
**Linha digitável de boleto bancário (47 dígitos):**
- Aceitar com ou sem pontos/espaços; validar os dígitos verificadores (módulo 10 nos campos 1-3, módulo 11 no DV geral).
- Fator de vencimento = dígitos 34 a 37; valor = dígitos 38 a 47, em centavos.
- **Atenção ao fator de vencimento:** a contagem original (base 07/10/1997) chegou a 9999 em 21/02/2025 e **reinicia em 1000 a partir de 22/02/2025**. Implementar e testar as duas bases; na dúvida, escolher a data mais próxima de hoje. Confirmar a regra vigente na documentação da FEBRABAN antes de fixar.
- Boleto de arrecadação/convênio (48 dígitos, começa com 8): no MVP guardar o código e pedir valor e vencimento manualmente.
- Valor zero no código = boleto sem valor definido; pedir valor manual.

**XML de NF-e:**
- Fornecedor: `emit/xNome`, `emit/CNPJ`. Data: `ide/dhEmi`.
- Itens: `det/prod` → `cProd`, `xProd`, `uCom`, `qCom`, `vUnCom`.
- **Vencimentos:** `cobr/dup` → `nDup`, `dVenc`, `vDup`. Usar para sugerir a criação dos boletos.
- Na importação, para cada produto sem vínculo, perguntar "a qual item seu isso corresponde?" e salvar em `item_aliases`.

## 8. Convenções de código
- TypeScript estrito. Funções puras para parsers em `src/lib/` com testes ao lado.
- Componentes pequenos, nomes em inglês no código, textos de interface em português.
- Mobile-first: testar sempre em tela de 375px. Botões grandes, poucos campos por tela.
- Segredos só em variáveis de ambiente (`.env.local`), nunca no repositório.
- Commits pequenos e descritivos em português ou inglês (escolher um e manter).

## 9. Status (atualizar a cada tarefa)
- [ ] Fase 0: Validação (entrevistas + protótipo) — ver `PLANO_MVP.md`
- [ ] Setup do projeto (Next.js + Supabase + Vercel)
- [ ] Auth + cadastro da loja + RLS
- [ ] Fornecedores
- [ ] Boletos: cadastro, parser da linha digitável, lista, painel
- [ ] Marcar como pago + comprovante
- [ ] Alertas por e-mail
- [ ] Itens + lista de compras
- [ ] Histórico de preços manual + comparativo
- [ ] Importação de XML de NF-e + vínculo de itens
- [ ] Beta com a loja real
- [ ] Teste de pré-venda e preço

## 10. Comandos úteis
```
npm run dev      # ambiente local
npm run test     # testes (Vitest)
npm run build    # build de produção
```
