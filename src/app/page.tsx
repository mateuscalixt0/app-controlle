import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("store_members").select("store_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!member) redirect("/configurar-loja");

  const [billsResult, pendingResult, missingResult] = await Promise.all([
    supabase.from("bills").select("id,supplier_id,description,amount_cents,due_date,status").eq("store_id", member.store_id).eq("status", "pending").order("due_date", { ascending: true }).limit(3),
    supabase.from("bills").select("amount_cents").eq("store_id", member.store_id).eq("status", "pending"),
    supabase.from("missing_items").select("id", { count: "exact", head: true }).eq("store_id", member.store_id),
  ]);

  if (billsResult.error || pendingResult.error || missingResult.error) throw new Error("Não foi possível carregar o resumo da loja.");

  const bills = billsResult.data ?? [];
  const supplierIds = [...new Set(bills.flatMap((bill) => bill.supplier_id ? [bill.supplier_id] : []))];
  const { data: suppliers, error: suppliersError } = supplierIds.length
    ? await supabase.from("suppliers").select("id,name").eq("store_id", member.store_id).in("id", supplierIds)
    : { data: [], error: null };
  if (suppliersError) throw new Error("Não foi possível carregar os fornecedores.");

  const supplierNames = new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier.name]));
  const pendingTotal = (pendingResult.data ?? []).reduce((total, bill) => total + Number(bill.amount_cents), 0);
  const missingTotal = missingResult.count ?? 0;

  return (
    <>
      <section className="hero-row">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Olá</h1>
          <p>Veja os dados atuais da sua loja.</p>
        </div>
        <span className="avatar" aria-hidden="true">AC</span>
      </section>

      <section aria-labelledby="resumo-title">
        <div className="section-heading"><div><p className="eyebrow">RESUMO</p><h2 id="resumo-title">Visão da loja</h2></div></div>
        <div className="summary-grid">
          <Link href="/boletos" className="summary-card pink-card">
            <span>Boletos em aberto</span><strong>{pendingResult.data?.length ?? 0} {pendingResult.data?.length === 1 ? "boleto" : "boletos"}</strong><small>{brl.format(pendingTotal / 100)}</small>
          </Link>
          <Link href="/faltas" className="summary-card blue-card">
            <span>Lista de faltas</span><strong>{missingTotal} {missingTotal === 1 ? "produto" : "produtos"}</strong><small>Registros atuais</small>
          </Link>
        </div>
      </section>

      <section aria-labelledby="vencimentos-title">
        <div className="section-heading"><div><p className="eyebrow">PRÓXIMOS</p><h2 id="vencimentos-title">Vencimentos</h2></div><Link href="/boletos">Ver todos</Link></div>
        <div className="stack">
          {bills.map((bill) => {
            const due = new Date(`${bill.due_date}T00:00:00Z`);
            return <article className="card compact-card" key={bill.id}>
              <span className="date-tile"><strong>{String(due.getUTCDate()).padStart(2, "0")}</strong><small>{dateFormatter.format(due).split(" ").pop()?.replace(".", "").toUpperCase()}</small></span>
              <div className="grow"><h3>{bill.supplier_id ? supplierNames.get(bill.supplier_id) ?? "Fornecedor removido" : "Sem fornecedor"}</h3><p>{bill.description}</p><small>Em aberto</small></div>
              <strong>{brl.format(Number(bill.amount_cents) / 100)}</strong>
            </article>;
          })}
          {bills.length === 0 && <div className="empty-state"><strong>Nenhum boleto em aberto</strong><p>Adicione um boleto para acompanhar os vencimentos reais da loja.</p></div>}
        </div>
      </section>

      <Link className="primary-action full-action" href="/boletos/novo"><Icon name="camera" />Adicionar boleto por foto ou arquivo</Link>
    </>
  );
}
