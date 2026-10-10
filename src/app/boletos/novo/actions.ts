"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOCUMENTS = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

function parseAmountCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!/^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.replace(/\./g, "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

function fileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || extension === "jpg" || extension === "jpeg" || extension === "png") return extension;
  return file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
}

export async function addBill(formData: FormData) {
  const supplierName = String(formData.get("supplier") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  const amountCents = parseAmountCents(String(formData.get("amount") ?? ""));
  const candidate = formData.get("document");
  const document = candidate instanceof File && candidate.size > 0 ? candidate : null;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) && new Date(`${dueDate}T00:00:00Z`).toISOString().startsWith(dueDate);

  if (!supplierName || supplierName.length > 160 || !description || description.length > 240 || amountCents === null || !validDate) {
    redirect("/boletos/novo?erro=validacao");
  }

  if (document && (!ALLOWED_DOCUMENTS.has(document.type) || document.size > MAX_DOCUMENT_SIZE)) {
    redirect("/boletos/novo?erro=arquivo");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member, error: memberError } = await supabase.from("store_members").select("store_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (memberError || !member) redirect("/configurar-loja");

  let supplierId: string;
  const { data: existing, error: lookupError } = await supabase.from("suppliers").select("id").eq("store_id", member.store_id).eq("name", supplierName).maybeSingle();
  if (lookupError) redirect("/boletos/novo?erro=salvar");

  if (existing) {
    supplierId = existing.id;
  } else {
    const { data: supplier, error } = await supabase.from("suppliers").insert({ store_id: member.store_id, name: supplierName }).select("id").single();
    if (error || !supplier) redirect("/boletos/novo?erro=salvar");
    supplierId = supplier.id;
  }

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({ store_id: member.store_id, supplier_id: supplierId, description, amount_cents: amountCents, due_date: dueDate })
    .select("id")
    .single();

  if (billError || !bill) redirect("/boletos/novo?erro=salvar");

  if (document) {
    const path = `${member.store_id}/${bill.id}/${randomUUID()}.${fileExtension(document)}`;
    const { error: uploadError } = await supabase.storage.from("bill-documents").upload(path, document, {
      cacheControl: "3600",
      contentType: document.type,
      upsert: false,
    });

    if (uploadError) {
      await supabase.from("bills").delete().eq("id", bill.id).eq("store_id", member.store_id);
      redirect("/boletos/novo?erro=arquivo");
    }

    const { error: documentError } = await supabase.from("bill_documents").insert({
      store_id: member.store_id,
      bill_id: bill.id,
      storage_path: path,
      original_name: document.name.slice(0, 255),
      content_type: document.type,
      size_bytes: document.size,
      created_by: user.id,
    });

    if (documentError) {
      await supabase.storage.from("bill-documents").remove([path]);
      await supabase.from("bills").delete().eq("id", bill.id).eq("store_id", member.store_id);
      redirect("/boletos/novo?erro=arquivo");
    }
  }

  revalidatePath("/");
  revalidatePath("/boletos");
  redirect("/boletos");
}
