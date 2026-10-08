> Referência original preservada. As decisões atuais estão em `docs/DECISOES.md`, as instruções do Codex em `AGENTS.md` e a sequência vigente em `PLANO_EXECUCAO_TRELLO.md`. Trechos sobre Claude, economia realizada, precisão monetária e data automática de boleto foram substituídos pelas decisões atuais.

# PLANO COMPLETO — Organizador de Compras e Boletos

## Ficha da Ideia
- **Nome temporário:** Organizador de Compras e Boletos
- **Problema:** lojistas controlam boletos em agenda e pasta, e anotam faltas de estoque por fornecedor em cadernos. Perdem vencimentos e compram sem saber quem vendeu mais barato.
- **Solução:** alertas de vencimento com linha digitável + lista de compras com histórico do menor preço por fornecedor.
- **Cliente inicial:** loja de material de construção onde o fundador trabalhou (~10 boletos/mês).
- **Preço a testar:** R$ 49 a R$ 99+/mês por loja.
- **Viabilidade:** **Média**. Sobe para **Alta** se 2 de 5 lojistas toparem pré-pagar.

---

## 1. Hipóteses a validar (em ordem de risco)
1. O lojista **sente** a dor (já perdeu vencimento, já comprou caro).
2. O lojista **vai alimentar** o app (colar boleto, importar XML). Se não alimentar, a comparação não aparece.
3. A comparação de preços **gera economia perceptível** (pelo menos 2% das compras).
4. O lojista **paga** por isso, e quanto.

O maior risco é a hipótese 2. O plano inteiro existe para testá-la barato.

---

## 2. Fase 0 — Validação (1 a 2 semanas, sem código)

### 2.1 Dados a levantar com o dono da loja
- Quanto compra por mês de fornecedores (R$) e de quantos fornecedores.
- Quantos boletos paga por mês e se já pagou multa ou juros por esquecimento.
- Como recebe as notas: XML por e-mail, papel, ou só o boleto.
- Um exemplo real de diferença de preço entre fornecedores (produto, preços, diferença).

### 2.2 Roteiro de entrevista (30 min, com o dono e com 3 a 5 outros lojistas)
Perguntas sobre o **passado**, não sobre intenção futura:
1. "Me conta como você controla o que vence na semana."
2. "Quando foi a última vez que esqueceu um boleto? O que aconteceu? Quanto custou?"
3. "Como você decide de qual fornecedor comprar cada coisa?"
4. "Quando foi a última vez que descobriu que comprou mais caro que o concorrente do fornecedor?"
5. "Já usou algum app ou sistema pra isso? Por que parou?"
6. "Quanto você paga hoje por sistema, contador, ferramentas?"

Depois de mostrar o protótipo:
7. "Você usaria isso amanhã? O que faltou?"
8. "Quanto você acha que isso vale por mês?" (**sem dar número**)
9. "E se custasse R$ 49? E R$ 99?"
10. "Se eu entregasse em 30 dias, você pagaria o primeiro mês agora?"

### 2.3 Protótipo clicável (Figma ou slides no celular), 3 telas
1. **Vencimentos:** Hoje / Esta semana, total a pagar, botão "copiar código" e "pago".
2. **Lista de compras:** item "torneira" com o fornecedor mais barato ao lado.
3. **Comparativo:** "Krona R$ 100 → Águia R$ 80. Você economiza R$ 20 por unidade."

Use **dados reais da loja** (fornecedores e produtos que ele conhece). Isso converte mais que qualquer tela bonita.

### 2.4 Critério de decisão (definir antes de entrevistar)
- **Construir** se pelo menos 2 de 5 lojistas fizerem pré-pagamento ou assinarem carta de intenção.
- **Ajustar** se muitos elogiarem mas ninguém pagar (rever proposta, preço ou público).
- **Parar ou pivotar** se a dor do boleto e a da compra caras não forem reais.

---

## 3. MVP — Escopo

### Funcionalidades
**Financeiro**
- Cadastrar boleto: colar linha digitável (valor e vencimento preenchidos sozinhos), escolher fornecedor, anexar PDF/foto.
- Painel Hoje / Semana / Mês, com total a pagar.
- Copiar linha digitável com um toque.
- Marcar como pago (caixa ou app do banco) e anexar comprovante.
- Alerta por e-mail 1 dia antes e no dia.

**Compras**
- Fornecedores com categoria (torneira, elétrica, tubulação...).
- Itens criados pelo lojista (específicos: "torneira jardim 1/2 cromada").
- Lista de compras com o **menor preço recente + fornecedor** ao lado de cada item.
- Histórico de preços: manual e via XML.
- Importar XML de NF-e: o app lê fornecedor, itens, preços e **vencimentos das duplicatas**, e sugere criar os boletos.
- Vínculo "produto da nota → item meu" feito uma vez, lembrado nas próximas.

**Prova de valor**
- Tela "Economia do mês": quanto ele teria pago a mais sem a comparação. Esse número vende a mensalidade.

### Fora do MVP
Pagamento dentro do app, DDA, OCR de foto, integração com ERP, controle de estoque, fluxo de caixa completo, IA para casar produtos, app nativo, cobrança automática.

---

## 4. Arquitetura simplificada

| Camada | Escolha | Por quê |
|---|---|---|
| App | Next.js + TypeScript + Tailwind, como PWA | Um código só serve celular e computador; instala na tela inicial |
| Banco/Auth/Arquivos | Supabase | Postgres, login, upload de PDF e permissões por loja prontos |
| Hospedagem | Vercel | Deploy automático a cada commit |
| E-mails | Resend | Simples e barato para alertas |
| Testes | Vitest | Essencial para parsers de boleto e XML |

**Alternativa no-code** (se quiser validar ainda mais rápido): Glide ou FlutterFlow + Airtable/Supabase. Serve para o beta com uma loja, mas o parser de XML e o vínculo de itens ficam limitados. Recomendo código com Claude Code, porque a lógica é o diferencial.

### Segurança e privacidade
- Isolamento por loja com Row Level Security (toda tabela com `store_id`).
- Arquivos (boletos, comprovantes, XMLs) em bucket **privado**.
- Dados fiscais e financeiros entram na LGPD: política de privacidade e termos simples antes de cobrar.

### Riscos técnicos
| Risco | Mitigação |
|---|---|
| Fator de vencimento do boleto mudou em fev/2025 | Implementar as duas bases, testar com boletos reais e confirmar na regra FEBRABAN |
| Boletos de convênio (48 dígitos) têm formato diferente | No MVP, pedir valor e vencimento manualmente |
| XMLs com unidades e descrições diferentes por fornecedor | Vínculo manual na primeira vez, com sugestão por texto parecido |
| Lojista não alimenta o app | Importar XML em 1 toque; lembretes semanais; medir uso |
| Comparar itens "parecidos" gera economia falsa | Comparar apenas itens específicos que o lojista vinculou |

---

## 5. Roadmap de execução

| Etapa | Duração | Entrega | Critério de pronto |
|---|---|---|---|
| **0. Validação** | 1-2 sem | Entrevistas + protótipo | Decisão construir/ajustar/parar |
| **1. Setup** | 2-3 dias | Projeto no ar com login | Você acessa pelo celular em uma URL |
| **2. Financeiro** | 2-3 sem | Boletos, painel, copiar código, pago + comprovante, e-mail | A loja cadastra os 10 boletos do mês |
| **3. Compras manual** | 2 sem | Fornecedores, itens, lista, histórico manual, comparativo | Lista mostra o menor preço de 10 itens reais |
| **4. Importação XML** | 2 sem | Importar NF-e, vincular itens, sugerir boletos | 1 nota importada em menos de 1 minuto |
| **5. Beta na loja real** | 3-4 sem | Uso diário pelo dono | Dono usa 3+ vezes por semana |
| **6. Teste de preço** | 1-2 sem | Pré-venda / primeira cobrança via Pix | Pelo menos 1 loja pagando |

**Total estimado:** 10 a 14 semanas trabalhando em meio período. Se a validação da etapa 0 falhar, você perde 2 semanas e não 3 meses.

---

## 6. Como trabalhar com o Claude Code

### Preparação
1. Instale o Claude Code e crie uma pasta para o projeto.
2. Coloque `CLAUDE.md` e `PLANO_MVP.md` na raiz.
3. Peça: *"Leia o CLAUDE.md e o PLANO_MVP.md e me diga em 5 linhas o que vamos construir e qual é a primeira tarefa."* Isso confirma que ele entendeu.

### Ritmo de cada sessão
1. Peça **uma tarefa pequena** e o plano em poucas linhas antes de codar.
2. Rode, teste no celular, aponte o que está errado.
3. Peça para atualizar o checklist do `CLAUDE.md`.
4. Faça commit.

### Prompts prontos (um por etapa)
**Etapa 1, setup:**
> Crie o projeto Next.js com TypeScript e Tailwind, configure como PWA, conecte ao Supabase e publique na Vercel. Crie login por e-mail e a tela de cadastro da loja. Me explique cada passo que eu precisar fazer fora do código.

**Etapa 2, financeiro:**
> Crie as tabelas `stores`, `suppliers`, `bills` e `bill_attachments` com RLS por `store_id`. Depois crie a função `parseBoletoLine` em `src/lib/boleto.ts` que recebe a linha digitável de 47 dígitos e devolve valor em centavos, vencimento e banco, validando os dígitos verificadores. Escreva testes com pelo menos 5 casos, incluindo o fator de vencimento anterior e posterior a 22/02/2025.

**Etapa 2, painel:**
> Crie a tela inicial mobile-first com os blocos Hoje, Esta semana e Este mês, o total a pagar em cada um, e cada boleto com botão "Copiar código" e "Marcar como pago".

**Etapa 3, compras:**
> Crie `items`, `price_records` e `shopping_list_items`. Na lista de compras, mostre ao lado de cada item o menor preço dos últimos 90 dias e o fornecedor. Permita registrar um preço manualmente.

**Etapa 4, XML:**
> Crie a importação de XML de NF-e com `fast-xml-parser`. Extraia fornecedor, itens e duplicatas. Para cada produto sem vínculo, pergunte a qual item do lojista ele corresponde e salve em `item_aliases`. No final, sugira criar os boletos a partir das duplicatas. Escreva testes com 3 XMLs reais anonimizados.

> **Dica:** peça ao dono 5 a 10 XMLs e boletos reais (pode apagar dados sensíveis). Testar com dados reais evita surpresa.

---

## 7. Modelo de preços (hipótese para testar)

| Plano | Preço | Conteúdo |
|---|---|---|
| **Teste** | Grátis 30 dias | Tudo liberado, para ver o primeiro comparativo |
| **Básico** | R$ 29-39/mês | Só financeiro, 1 usuário |
| **Completo** | R$ 59-99/mês | Financeiro + compras + XML, 2-3 usuários |
| **Anual** | 2 meses grátis | Reduz cancelamento |

- Cobrar **por loja**, não por usuário.
- Argumento de venda: "Se você compra R$ 30 mil/mês e economiza 2%, são R$ 600/mês. O app custa R$ 79." Substitua pelo valor real da loja.
- Na fase de teste, cobrar via Pix manual. Automatize a cobrança só depois de ter clientes pagando.

---

## 8. Métricas para acompanhar no beta
- **Ativação:** % que cadastra 5+ boletos na primeira semana.
- **Uso:** dias por semana que o dono abre o app.
- **Alimentação:** XMLs importados e preços registrados por mês.
- **Valor:** economia mostrada no mês (R$) e vezes que o dono comprou do fornecedor sugerido.
- **Dinheiro:** pré-vendas, pagamentos e cancelamentos.

**Sinal verde:** dono usa toda semana, importa notas sem ajuda e cita uma economia real.

---

## 9. Próximos passos (esta semana)
1. Pedir ao dono: valor mensal de compras, 5-10 XMLs e boletos de exemplo, e um caso real de diferença de preço.
2. Montar o protótipo das 3 telas com dados reais.
3. Marcar entrevistas com 3 a 5 lojistas e usar o roteiro da seção 2.2.
4. Definir o critério de sucesso (seção 2.4) **antes** de conversar.
5. Se passar: abrir o Claude Code e começar pela Etapa 1.

---

## 10. Perguntas abertas
- Quanto a loja compra por mês dos fornecedores?
- O dono recebe os boletos em PDF/e-mail ou em papel junto com a mercadoria?
- A loja já teve multa ou juros por esquecer vencimento?
- Os fornecedores principais emitem XML de forma consistente?
