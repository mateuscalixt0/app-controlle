import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { MissingListDemo, type MissingListItem } from "@/components/missing-list-demo";
import { PageHeading } from "@/components/page-heading";
import { getCurrentSession } from "@/lib/supabase/session";

const PAGE_SIZE = 10;

export default async function MissingItemsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; priority?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const queryText = (params.q ?? "").trim().slice(0, 100);
  const priority = ["normal", "media", "urgente"].includes(params.priority ?? "") ? params.priority ?? "" : "";
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  let request = session.supabase.from("missing_items").select("id,product_name,quantity,unit,category,reference_company,priority,created_at", { count: "exact" }).eq("store_id", session.storeId).order("created_at", { ascending: false });
  if (queryText) request = request.ilike("product_name", `%${queryText.replace(/[%_]/g, "\\$&")}%`);
  if (priority) request = request.eq("priority", priority as "normal" | "media" | "urgente");
  const { data, count, error } = await request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Não foi possível carregar a lista de faltas.");
  const rows: MissingListItem[] = (data ?? []).map((row) => ({ ...row, quantity: Number(row.quantity) }));

  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="Lista de faltas" description="Anote o que acabou e consulte as referências de preço registradas." />
      <Link className="primary-action full-action top-action" href="/faltas/novo"><Icon name="list" /> Anotar produto faltante</Link>
      <MissingListDemo items={rows} page={page} pageSize={PAGE_SIZE} total={count ?? 0} queryText={queryText} priority={priority} />
    </>
  );
}
