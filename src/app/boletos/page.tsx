import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { getCurrentSession } from "@/lib/supabase/session";
import { BillCard } from "@/components/bill-card";
import { getBillListStatus } from "@/lib/bill-list-filter";

const PAGE_SIZE = 10;

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const queryText = (params.q ?? "").trim().slice(0, 100);
  const status = getBillListStatus(params.status);
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  let request = session.supabase
    .from("bills")
    .select("id,supplier_id,description,amount_cents,due_date,status,digitable_line,bill_documents(storage_path),suppliers(name)", { count: "exact" })
    .eq("store_id", session.storeId)
    .order("due_date", { ascending: true })
    .order("id");
  if (queryText) request = request.ilike("description", `%${queryText.replace(/[%_]/g, "\\$&")}%`);
  if (status !== "all") request = request.eq("status", status);

  const { data, count, error } = await request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Não foi possível carregar os boletos.");
  const bills = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allFilter = new URLSearchParams({ status: "all" });
  if (queryText) allFilter.set("q", queryText);
  const pageHref = (targetPage: number) => {
    const pageParams = new URLSearchParams({ page: String(targetPage), status });
    if (queryText) pageParams.set("q", queryText);
    return `/boletos?${pageParams.toString()}`;
  };

  return (
    <div className="bills-page">
      <PageHeading eyebrow="BOLETOS" title="Seus boletos" description="Acompanhe os próximos vencimentos e encontre uma conta rapidamente." />
      <form className="search-field" action="/boletos" method="get">
        <Icon name="search" />
        <label className="sr-only" htmlFor="bill-search">Buscar boleto</label>
        <input id="bill-search" defaultValue={queryText} name="q" placeholder="Buscar por descrição" type="search" />
        <input name="status" type="hidden" value={status} />
      </form>
      <div className="filter-row" aria-label="Filtrar boletos">
        <Link className={status === "all" ? "filter-chip active" : "filter-chip"} href={`/boletos?${allFilter.toString()}`}>Todos</Link>
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
          const documents = bill.bill_documents as unknown as { storage_path?: string }[] | null;
          return (
            <BillCard key={`${bill.id}-${bill.status}`} bill={{ id: bill.id, supplier: supplier ?? "Fornecedor não informado", description: bill.description, amount: bill.amount_cents, dueDate: bill.due_date, code: bill.digitable_line, hasDocument: Boolean(documents?.length), status: bill.status }} />
          );
        })}
        {bills.length === 0 && <div className="empty-state"><strong>{queryText || status !== "all" ? "Nenhum boleto encontrado" : "Nenhum boleto cadastrado"}</strong><p>{queryText || status !== "all" ? "Ajuste a busca ou os filtros para tentar novamente." : "Envie um documento para adicionar seu primeiro boleto."}</p></div>}
      </section>
      {pageCount > 1 && <nav className="pagination" aria-label="Paginação">{page > 1 && <Link className="secondary-action" href={pageHref(page - 1)}>Anterior</Link>}{page < pageCount && <Link className="secondary-action" href={pageHref(page + 1)}>Próxima</Link>}</nav>}
      <Link className="primary-action full-action" href="/boletos/novo"><Icon name="add-bill" /> Adicionar boleto</Link>
    </div>
  );
}
