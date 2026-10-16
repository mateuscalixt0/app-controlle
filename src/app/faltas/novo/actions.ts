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

  const { error } = await session.supabase.from("missing_items").insert({
    store_id: session.storeId,
    product_name: productName,
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
  const { error } = await session.supabase.from("missing_items").insert({ store_id: session.storeId, product_name: productName, quantity, priority });
  if (error) return { error: "Não foi possível salvar o item.", success: false };
  revalidatePath("/faltas");
  return { error: "", success: true };
}
