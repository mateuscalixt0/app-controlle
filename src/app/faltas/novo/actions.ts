"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/supabase/session";

export async function addMissingItem(formData: FormData) {
  const productName = String(formData.get("product") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim().replace(",", ".");
  const quantity = Number(quantityRaw);
  const priority = String(formData.get("priority") ?? "normal");
  if (!productName || productName.length > 200 || !Number.isFinite(quantity) || quantity <= 0 || !["normal", "media", "urgente"].includes(priority)) {
    redirect("/faltas/novo?erro=validacao");
  }

  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.storeId) redirect("/configurar-loja");

  const product = await resolveProduct(session, formData);
  if (product.error) redirect("/faltas/novo?erro=produto");
  const { error } = await session.supabase.from("missing_items").insert({
    product_id: product.id,
    unit: product.unit,
    store_id: session.storeId,
    product_name: product.name ?? productName,
    quantity,
    priority,
  });
  if (error) redirect("/faltas/novo?erro=salvar");
  revalidatePath("/faltas");
  redirect("/faltas");
}

type InlineMissingItemState = { error: string; success: boolean };

export async function addMissingItemInline(_previousState: InlineMissingItemState, formData: FormData): Promise<InlineMissingItemState> {
  const productName = String(formData.get("product") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "").trim().replace(",", "."));
  const priority = String(formData.get("priority") ?? "normal");
  if (!productName || productName.length > 200 || !Number.isFinite(quantity) || quantity <= 0 || !["normal", "media", "urgente"].includes(priority)) return { error: "Confira os dados informados.", success: false };
  const session = await getCurrentSession();
  if (!session?.storeId) return { error: "Sua sessão não está pronta para salvar o item.", success: false };
  const product = await resolveProduct(session, formData);
  if (product.error) return { error: product.error, success: false };
  const { error } = await session.supabase.from("missing_items").insert({ store_id: session.storeId, product_id: product.id, unit: product.unit, product_name: product.name ?? productName, quantity, priority });
  if (error) return { error: "Não foi possível salvar o item.", success: false };
  revalidatePath("/faltas");
  return { error: "", success: true };
}

export async function markMissingItemsBought(formData: FormData) {
  const ids = String(formData.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!ids.length) return;
  const session = await getCurrentSession();
  if (!session?.storeId) redirect("/login");
  const { error } = await session.supabase.from("missing_items").update({ is_missing: false }).eq("store_id", session.storeId).in("id", ids);
  if (error) throw new Error("Não foi possível atualizar os produtos.");
  revalidatePath("/faltas");
  redirect("/faltas");
}

async function resolveProduct(session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>, formData: FormData): Promise<{ id: string | null; name: string | null; unit: string | null; error: string }> {
  const id = String(formData.get("product_id") ?? "").trim();
  if (!id) return { id: null, name: null, unit: null, error: "" };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { id: null, name: null, unit: null, error: "Selecione um produto válido." };
  const { data, error } = await session.supabase.from("products").select("id,name,unit").eq("store_id", session.storeId!).eq("id", id).maybeSingle();
  if (error || !data) return { id: null, name: null, unit: null, error: "Não foi possível confirmar o produto selecionado. Busque novamente." };
  return { ...data, error: "" };
}
