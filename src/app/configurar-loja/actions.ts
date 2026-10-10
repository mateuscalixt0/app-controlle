"use server";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/supabase/session";

export async function createStore(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 160) redirect("/configurar-loja?erro=nome");

  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { error } = await session.supabase.rpc("create_store_for_current_user", { store_name: name });
  if (error) redirect("/configurar-loja?erro=salvar");
  redirect("/");
}
