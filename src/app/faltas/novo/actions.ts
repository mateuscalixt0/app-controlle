"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addMissingItem(formData: FormData) {
  const productName = String(formData.get("product") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim().replace(",", ".");
  const quantity = Number(quantityRaw);
  const priority = String(formData.get("priority") ?? "normal");
  if (!productName || productName.length > 200 || !Number.isFinite(quantity) || quantity <= 0 || !["normal", "media", "urgente"].includes(priority)) {
    redirect("/faltas/novo?erro=validacao");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member, error: memberError } = await supabase.from("store_members").select("store_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (memberError || !member) redirect("/configurar-loja");

  const { error } = await supabase.from("missing_items").insert({
    store_id: member.store_id,
    product_name: productName,
    quantity,
    priority,
  });
  if (error) redirect("/faltas/novo?erro=salvar");
  revalidatePath("/faltas");
  redirect("/faltas");
}
