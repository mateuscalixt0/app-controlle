"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/supabase/session";
import { parseNfeXml } from "@/lib/nfe-parser";

export async function importNfeXml(xml: string, originalName: string) {
  const parsed = parseNfeXml(xml);
  if (!originalName || originalName.length > 255) throw new Error("Nome de arquivo inválido.");
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const { data, error } = await session.supabase.rpc("import_nfe_for_current_store", {
    p_store_id: session.storeId, p_access_key: parsed.accessKey, p_supplier_name: parsed.supplierName, p_supplier_cnpj: parsed.supplierCnpj,
    p_invoice_number: parsed.invoiceNumber, p_series: parsed.series, p_model: parsed.model, p_issued_on: parsed.issuedOn, p_original_name: originalName,
    p_items: parsed.items.map((item) => ({ item_number: item.number, supplier_code: item.supplierCode, name: item.name,
      normalized_name: item.normalizedName, gtin: item.gtin, ncm: item.ncm, quantity: item.quantity,
      unit: item.unit, unit_price: item.unitPrice, total: item.total })),
  });
  if (error) {
    const duplicateInvoice = error.code === "23505" && /nfe_imports_(?:store_id_access_key|store_fingerprint)/i.test(`${error.message} ${error.details ?? ""}`);
    if (duplicateInvoice) throw new Error("Esta NF-e já foi importada para esta loja.");
    if (/Conflito de identificação/i.test(error.message)) throw new Error("Este produto mudou de GTIN, unidade ou medida e precisa de revisão antes da importação.");
    throw new Error("Não foi possível salvar a NF-e.");
  }
  return { importId: data as string };
}

export async function confirmNfeProductAssociation(sourceId: string, productId: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const { error } = await session.supabase.rpc("confirm_nfe_product_association", { p_store_id: session.storeId, p_source_id: sourceId, p_product_id: productId });
  if (error) throw new Error("Não foi possível confirmar o vínculo do produto.");
}

export async function rejectNfeProductAssociation(sourceId: string, productId: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const { error } = await session.supabase.rpc("reject_nfe_product_association", { p_store_id: session.storeId, p_source_id: sourceId, p_product_id: productId });
  if (error) throw new Error("Não foi possível registrar a rejeição da sugestão.");
}

export async function createProductFromNfeSource(sourceId: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const { error } = await session.supabase.rpc("create_product_from_nfe_source", { p_store_id: session.storeId, p_source_id: sourceId });
  if (error) throw new Error("Não foi possível cadastrar este item como um produto separado.");
}

export async function resetNfeProductAssociation(sourceId: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");
  const { error } = await session.supabase.rpc("reset_nfe_product_association", { p_store_id: session.storeId, p_source_id: sourceId });
  if (error) throw new Error("Não foi possível desfazer o vínculo do produto.");
}
