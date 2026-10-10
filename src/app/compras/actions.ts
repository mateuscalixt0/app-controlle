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
    p_access_key: parsed.accessKey, p_supplier_name: parsed.supplierName, p_supplier_cnpj: parsed.supplierCnpj,
    p_invoice_number: parsed.invoiceNumber, p_issued_on: parsed.issuedOn, p_original_name: originalName,
    p_items: parsed.items.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit, unit_price: item.unitPrice, total: item.total })),
  });
  if (error) {
    if (error.code === "23505") throw new Error("Esta NF-e já foi importada para esta loja.");
    throw new Error("Não foi possível salvar a NF-e.");
  }
  return { importId: data as string };
}
