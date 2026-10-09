"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseAmountCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.replace(/\./g, "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export async function addBill(formData: FormData) {
  const supplierName = String(formData.get("supplier") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  const amountCents = parseAmountCents(String(formData.get("amount") ?? ""));
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) && new Date(`${dueDate}T00:00:00Z`).toISOString().startsWith(dueDate);
  if (!supplierName || supplierName.length > 160 || !description || description.length > 240 || amountCents === null || !validDate) {
    redirect("/boletos/novo?erro=validacao");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member, error: memberError } = await supabase.from("store_members").select("store_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (memberError || !member) redirect("/configurar-loja");

  let supplierId: string | null = null;
  const { data: existing, error: lookupError } = await supabase.from("suppliers").select("id").eq("store_id", member.store_id).eq("name", supplierName).maybeSingle();
  if (lookupError) redirect("/boletos/novo?erro=salvar");
  if (existing) supplierId = existing.id;
  else {
    const { data: supplier, error } = await supabase.from("suppliers").insert({ store_id: member.store_id, name: supplierName }).select("id").single();
    if (error || !supplier) redirect("/boletos/novo?erro=salvar");
    supplierId = supplier.id;
  }
  const { error } = await supabase.from("bills").insert({ store_id: member.store_id, supplier_id: supplierId, description, amount_cents: amountCents, due_date: dueDate });
  if (error) redirect("/boletos/novo?erro=salvar");
  revalidatePath("/boletos");
  redirect("/boletos");
}
