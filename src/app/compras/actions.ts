"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Item = { name?: unknown; quantity?: unknown; unit?: unknown; unit_price?: unknown };
type Payload = { access_key?: unknown; supplier_name?: unknown; issued_on?: unknown; original_name?: unknown; items?: unknown };

function validText(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export async function importNfe(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");
  if (raw.length === 0 || raw.length > 100_000) redirect("/compras?erro=validacao");

  let payload: Payload;
  try {
    payload = JSON.parse(raw) as Payload;
  } catch {
    redirect("/compras?erro=validacao");
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const validItems = items.length > 0 && items.length <= 100 && items.every((item: Item) =>
    validText(item.name, 200)
    && validText(item.unit, 80)
    && typeof item.quantity === "string" && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
    && typeof item.unit_price === "string" && Number.isFinite(Number(item.unit_price)) && Number(item.unit_price) >= 0,
  );

  if (
    typeof payload.access_key !== "string" || !/^\d{44}$/.test(payload.access_key)
    || !validText(payload.supplier_name, 160)
    || !validText(payload.original_name, 255)
    || (payload.issued_on !== null && (typeof payload.issued_on !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(payload.issued_on)))
    || !validItems
  ) redirect("/compras?erro=validacao");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("import_nfe_for_current_store", {
    p_access_key: payload.access_key,
    p_supplier_name: payload.supplier_name.trim(),
    p_issued_on: payload.issued_on,
    p_original_name: payload.original_name.trim(),
    p_items: items,
  });

  if (error) {
    if (error.code === "23505") redirect("/compras?erro=duplicada");
    redirect("/compras?erro=salvar");
  }

  revalidatePath("/");
  revalidatePath("/compras");
  revalidatePath("/faltas");
  redirect("/compras?sucesso=1");
}
