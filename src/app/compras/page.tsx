import { PageHeading } from "@/components/page-heading";
import { NfeImport } from "@/components/nfe-import";
import { NfeAssociationReview } from "@/components/nfe-association-review";
import { getCurrentSession } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export default async function PurchasesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const [pendingResult, confirmedResult, productsResult] = await Promise.all([
    session.supabase.from("supplier_products").select("id,description_original,description_normalized,gtin,ncm,reference_unit,supplier_id").eq("store_id", session.storeId).eq("association_status", "pending").eq("active", true).order("created_at").limit(1000),
    session.supabase.from("supplier_products").select("id,description_original,supplier_id,product_id,gtin").eq("store_id", session.storeId).eq("association_status", "confirmed").eq("active", true).order("confirmed_at", { ascending: false }).limit(1000),
    session.supabase.from("products").select("id,name,unit").eq("store_id", session.storeId).order("name").limit(1000),
  ]);
  if (pendingResult.error || confirmedResult.error || productsResult.error) throw new Error("Não foi possível carregar a revisão de produtos.");
  const supplierIds = [...new Set([...(pendingResult.data ?? []).map((source) => source.supplier_id), ...(confirmedResult.data ?? []).map((source) => source.supplier_id)])];
  const supplierResult = supplierIds.length ? await session.supabase.from("suppliers").select("id,name").eq("store_id", session.storeId).in("id", supplierIds) : { data: [], error: null };
  if (supplierResult.error) throw new Error("Não foi possível carregar os fornecedores dos itens pendentes.");
  const suppliers = Object.fromEntries((supplierResult.data ?? []).map((supplier) => [supplier.id, supplier.name]));
  const productNames = Object.fromEntries((productsResult.data ?? []).map((product) => [product.id, product.name]));
  const confirmedSources = (confirmedResult.data ?? []).map((source) => ({ id: source.id, description_original: source.description_original,
    supplier_name: suppliers[source.supplier_id] ?? "Fornecedor", product_name: productNames[source.product_id ?? ""] ?? "Produto" }));
  const productsByGtin = new Map<string, Set<string>>();
  for (const source of confirmedResult.data ?? []) {
    if (!source.gtin || !source.product_id) continue;
    const productIds = productsByGtin.get(source.gtin) ?? new Set<string>();
    productIds.add(source.product_id);
    productsByGtin.set(source.gtin, productIds);
  }
  const confirmedGtins = Object.fromEntries([...productsByGtin].flatMap(([gtin, productIds]) => productIds.size === 1 ? [[gtin, [...productIds][0]]] : []));
  const conflictingGtins = [...productsByGtin].filter(([, productIds]) => productIds.size > 1).map(([gtin]) => gtin);
  const pendingIds = (pendingResult.data ?? []).map((source) => source.id);
  const rejectionResult = pendingIds.length ? await session.supabase.from("product_association_rejections").select("supplier_product_id,candidate_product_id").eq("store_id", session.storeId).in("supplier_product_id", pendingIds) : { data: [], error: null };
  if (rejectionResult.error) throw new Error("Não foi possível carregar as sugestões rejeitadas.");
  const rejectedPairs = (rejectionResult.data ?? []).map((row) => `${row.supplier_product_id}:${row.candidate_product_id}`);
  return <><PageHeading eyebrow="COMPRAS" title="Importar nota fiscal" description="Confira os dados fiscais. Os produtos só entram no histórico comparável após confirmação do vínculo." /><NfeImport />
    <NfeAssociationReview pendingSources={pendingResult.data ?? []} confirmedSources={confirmedSources} confirmedGtins={confirmedGtins} conflictingGtins={conflictingGtins} rejectedPairs={rejectedPairs} suppliers={suppliers} products={productsResult.data ?? []} />
    <section className="card safety-card"><p className="eyebrow">DADOS REAIS</p><h2>Histórico de preços</h2><p>Somente preços vinculados a produtos confirmados serão usados nas comparações. O sistema não exibe valores de demonstração.</p></section></>;
}
