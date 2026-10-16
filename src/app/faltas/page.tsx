import Link from "next/link";
import { redirect } from "next/navigation";
import { MissingList, type MissingListItem } from "@/components/missing-list-demo";
import { PageHeading } from "@/components/page-heading";
import { getCurrentSession } from "@/lib/supabase/session";

const PAGE_SIZE = 10;

export default async function MissingItemsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; priority?: string; sort?: string; company?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const queryText = (params.q ?? "").trim().slice(0, 100);
  const sort = params.sort === 'oldest' ? 'oldest' : 'newest';
  const company = (params.company ?? '').trim().slice(0, 160);
  const priority = ["normal", "media", "urgente"].includes(params.priority ?? "") ? params.priority ?? "" : "";
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  let request = session.supabase.from("missing_items").select("id,product_name,quantity,unit,category,reference_company,priority,created_at", { count: "exact" }).eq("store_id", session.storeId).order("created_at", { ascending: sort === "oldest" }).order("id");
  if (queryText) request = request.ilike("product_name", `%${queryText.replace(/[%_]/g, "\\$&")}%`);
  if (company) request = request.eq("reference_company", company);
  if (priority) request = request.eq("priority", priority as "normal" | "media" | "urgente");
  const { data, count, error } = await request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Não foi possível carregar a lista de faltas.");
  const companies = new Set<string>();
  for (let offset = 0; ; ) {
    const result = await session.supabase.from('missing_items').select('id,reference_company').eq('store_id', session.storeId).not('reference_company', 'is', null).order('id').range(offset, offset + 499);
    if (result.error || !result.data) throw new Error('Não foi possível carregar as empresas de referência.');
    if (!result.data.length) break;
    result.data.forEach(row => { if (row.reference_company) companies.add(row.reference_company); });
    offset += result.data.length;
  }
  const rows: MissingListItem[] = (data ?? []).map((row) => ({ ...row, quantity: Number(row.quantity) }));

  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="O que está faltando" description={`${count ?? 0} ${count === 1 ? "produto" : "produtos"}`} />
      <MissingList items={rows} page={page} pageSize={PAGE_SIZE} total={count ?? 0} queryText={queryText} priority={priority} sort={sort} company={company} companies={[...companies].sort((a, b) => a.localeCompare(b, "pt-BR"))} />
    </>
  );
}
