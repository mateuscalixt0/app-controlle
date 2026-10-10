import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { getCurrentSession } from "@/lib/supabase/session";

const PAGE_SIZE = 10;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const queryText = (params.q ?? "").trim().slice(0, 100);
  const status = ["pending", "paid", "cancelled"].includes(params.status ?? "") ? params.status : "";
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  let request = session.supabase
    .from("bills")
    .select("id,supplier_id,description,amount_cents,due_date,status,suppliers(name)", { count: "exact" })
    .eq("store_id", session.storeId)
    .order("due_date", { ascending: true })
    .order("id");
  if (queryText) request = request.ilike("description", `%${queryText.replace(/[%_]/g, "\\$&")}%`);
  if (status) request = request.eq("status", status as "pending" | "paid" | "cancelled");

  const { data, count, error } = await request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Não foi possível carregar os boletos.");
  const bills = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeading eyebrow="BOLETOS" title="Boletos a pagar" description="Acompanhe os próximos vencimentos e encontre uma conta rapidamente." />
      <form className="search-field" action="/boletos" method="get">
        <Icon name="search" />
        <label className="sr-only" htmlFor="bill-search">Buscar boleto</label>
        <input id="bill-search" defaultValue={queryText} name="q" placeholder="Buscar por descrição" type="search" />
        {status && <input name="status" type="hidden" value={status} />}
      </form>
      <div className="filter-row" aria-label="Filtrar boletos">
        <Link className={status ? "filter-chip" : "filter-chip active"} href={queryText ? `/boletos?q=${encodeURIComponent(queryText)}` : "/boletos"}>Todos</Link>
        {([ ["pending", "Em aberto"], ["paid", "Pagos"], ["cancelled", "Cancelados"] ] as const).map(([value, label]) => {
          const filter = new URLSearchParams();
          if (queryText) filter.set("q", queryText);
          filter.set("status", value);
          return <Link className={status === value ? "filter-chip active" : "filter-chip"} href={`/boletos?${filter.toString()}`} key={value}>{label}</Link>;
        })}
      </div>
      <p className="results-count">{total} {total === 1 ? "boleto" : "boletos"} · página {page} de {pageCount}</p>
      <section className="stack" aria-label="Boletos">
        {bills.map((bill) => {
          const supplierData = bill.suppliers as unknown as { name?: string } | { name?: string }[] | null;
          const supplier = Array.isArray(supplierData) ? supplierData[0]?.name : supplierData?.name;
          return (
            <article className="card bill-card" key={bill.id}>
              <div className="row"><div><p className="eyebrow">VENCIMENTO {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${bill.due_date}T00:00:00Z`))}</p><h2>{supplier ?? "Fornecedor removido"}</h2></div><strong className="amount">{brl.format(bill.amount_cents / 100)}</strong></div>
              <p>{bill.description}</p>
              <span className="status-pill">{bill.status === "pending" ? "Em aberto" : bill.status === "paid" ? "Pago" : "Cancelado"}</span>
            </article>
          );
        })}
        {bills.length === 0 && <div className="empty-state"><strong>Nenhum boleto cadastrado</strong><p>Envie um documento ou cadastre um boleto manualmente.</p></div>}
      </section>
      {pageCount > 1 && <nav className="pagination" aria-label="Paginação">{page > 1 && <Link className="secondary-action" href={`/boletos?page=${page - 1}`}>Anterior</Link>}{page < pageCount && <Link className="secondary-action" href={`/boletos?page=${page + 1}`}>Próxima</Link>}</nav>}
      <Link className="primary-action full-action" href="/boletos/novo"><Icon name="add-bill" /> Adicionar boleto</Link>
    </>
  );
}
