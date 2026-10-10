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
