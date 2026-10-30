import { redirect } from "next/navigation";
import { MissingList, type MissingListItem } from "@/components/missing-list-demo";
import { PageHeading } from "@/components/page-heading";
import { getCurrentSession } from "@/lib/supabase/session";

export default async function MissingItemsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; priority?: string; sort?: string; company?: string }> }) {
  const params = await searchParams;
  const queryText = (params.q ?? "").trim().slice(0, 100);
  const sort = params.sort === 'oldest' ? 'oldest' : 'newest';
  const company = (params.company ?? '').trim().slice(0, 160);
  const priority = ["normal", "media", "urgente"].includes(params.priority ?? "") ? params.priority ?? "" : "";
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  const missingItems: Omit<MissingListItem, "reference_companies">[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await session.supabase.from("missing_items").select("id,product_id,product_name,quantity,unit,category,reference_company,priority,created_at").eq("store_id", session.storeId).eq("is_missing", true).order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (result.error || !result.data) throw new Error("Não foi possível carregar a lista de faltas.");
    missingItems.push(...result.data);
    if (result.data.length < 500) break;
  }

  const productIds = [...new Set(missingItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)))];
  const supplierIdsByProduct = new Map<string, Set<string>>();
  for (let start = 0; start < productIds.length; start += 100) {
    const batch = productIds.slice(start, start + 100);
    for (let offset = 0; ; offset += 500) {
      const result = await session.supabase.from("price_entries").select("product_id,supplier_id").eq("store_id", session.storeId).in("product_id", batch).order("id").range(offset, offset + 499);
      if (result.error || !result.data) throw new Error("Não foi possível carregar as empresas dos produtos.");
      result.data.forEach(({ product_id, supplier_id }) => {
        const ids = supplierIdsByProduct.get(product_id) ?? new Set<string>();
        ids.add(supplier_id);
        supplierIdsByProduct.set(product_id, ids);
      });
      if (result.data.length < 500) break;
    }
  }

  const supplierIds = [...new Set([...supplierIdsByProduct.values()].flatMap((ids) => [...ids]))];
  const supplierNames = new Map<string, string>();
  for (let start = 0; start < supplierIds.length; start += 100) {
    const result = await session.supabase.from("suppliers").select("id,name").eq("store_id", session.storeId).in("id", supplierIds.slice(start, start + 100));
    if (result.error || !result.data) throw new Error("Não foi possível carregar as empresas dos produtos.");
    result.data.forEach(({ id, name }) => supplierNames.set(id, name));
  }

  const companies = new Set<string>();
  const rows: MissingListItem[] = missingItems.map((row) => {
    const linkedCompanies = row.product_id
      ? [...(supplierIdsByProduct.get(row.product_id) ?? [])].map((id) => supplierNames.get(id)).filter((name): name is string => Boolean(name))
      : [];
    const referenceCompanies = [...new Set(linkedCompanies.length ? linkedCompanies : row.reference_company ? [row.reference_company] : [])].sort((a, b) => a.localeCompare(b, "pt-BR"));
    referenceCompanies.forEach((name) => companies.add(name));
    return { ...row, quantity: Number(row.quantity), reference_companies: referenceCompanies };
  });

  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="Lista de faltas" description="Organize o que está faltando para a próxima compra." />
      <MissingList items={rows} total={rows.length} queryText={queryText} priority={priority} sort={sort} company={company} companies={[...companies].sort((a, b) => a.localeCompare(b, "pt-BR"))} />
    </>
  );
}
