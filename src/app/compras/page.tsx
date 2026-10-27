import { PageHeading } from "@/components/page-heading";
import { NfeImport } from "@/components/nfe-import";
import { NfeAssociationReview } from "@/components/nfe-association-review";
import { getCurrentSession } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export default async function PurchasesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const [candidateResult, confirmedResult] = await Promise.all([
    session.supabase.from("nfe_product_candidates").select("supplier_product_id,candidate_product_id,score,match_reason").eq("store_id", session.storeId).order("score", { ascending: false }).limit(3000),
    session.supabase.from("supplier_products").select("id,description_original,supplier_id,product_id").eq("store_id", session.storeId).eq("association_status", "confirmed").eq("active", true).in("association_method", ["auto_existing", "manual_existing", "manual_new"]).order("confirmed_at", { ascending: false }).limit(1000),
  ]);
  if (candidateResult.error || confirmedResult.error) throw new Error("Não foi possível carregar a revisão de produtos.");

  const sourceIds = [...new Set((candidateResult.data ?? []).map((candidate) => candidate.supplier_product_id))];
  const productIds = [...new Set([...(candidateResult.data ?? []).map((candidate) => candidate.candidate_product_id), ...(confirmedResult.data ?? []).flatMap((source) => source.product_id ? [source.product_id] : [])])];
  const [pendingResult, productsResult] = await Promise.all([
    sourceIds.length ? session.supabase.from("supplier_products").select("id,description_original,gtin,ncm,reference_unit,supplier_id").eq("store_id", session.storeId).eq("association_status", "pending").eq("active", true).in("id", sourceIds).order("created_at") : Promise.resolve({ data: [], error: null }),
    productIds.length ? session.supabase.from("products").select("id,name,unit").eq("store_id", session.storeId).in("id", productIds).order("name") : Promise.resolve({ data: [], error: null }),
  ]);
  if (pendingResult.error || productsResult.error) throw new Error("Não foi possível carregar os candidatos de produtos.");

  const supplierIds = [...new Set([...(pendingResult.data ?? []).map((source) => source.supplier_id), ...(confirmedResult.data ?? []).map((source) => source.supplier_id)])];
  const supplierResult = supplierIds.length ? await session.supabase.from("suppliers").select("id,name").eq("store_id", session.storeId).in("id", supplierIds) : { data: [], error: null };
  if (supplierResult.error) throw new Error("Não foi possível carregar os fornecedores dos itens pendentes.");
  const suppliers = Object.fromEntries((supplierResult.data ?? []).map((supplier) => [supplier.id, supplier.name]));
  const products = Object.fromEntries((productsResult.data ?? []).map((product) => [product.id, product]));
  const candidatesBySource = Object.fromEntries(sourceIds.map((sourceId) => [sourceId, (candidateResult.data ?? []).flatMap((candidate) => {
    const product = products[candidate.candidate_product_id];
    return candidate.supplier_product_id === sourceId && product ? [{ product, score: Math.round(Number(candidate.score) * 100), reason: candidate.match_reason as "gtin" | "text" }] : [];
  })]));
  const confirmedSources = (confirmedResult.data ?? []).map((source) => ({ id: source.id, description_original: source.description_original,
    supplier_name: suppliers[source.supplier_id] ?? "Fornecedor", product_name: products[source.product_id ?? ""]?.name ?? "Produto" }));

  return <><PageHeading eyebrow="COMPRAS" title="Importar nota fiscal" description="Produtos novos entram automaticamente. A revisão aparece somente quando o sistema encontra um produto realmente parecido." /><NfeImport />
    <NfeAssociationReview pendingSources={pendingResult.data ?? []} confirmedSources={confirmedSources} candidatesBySource={candidatesBySource} suppliers={suppliers} />
    <section className="card safety-card"><p className="eyebrow">DADOS REAIS</p><h2>Histórico de preços</h2><p>Produtos sem candidatos são cadastrados separadamente. Produtos parecidos só entram nas comparações após sua decisão.</p></section></>;
}
