"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createStore(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 160) redirect("/configurar-loja?erro=nome");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { error } = await supabase.rpc("create_store_for_current_user", { store_name: name });
  if (error) redirect("/configurar-loja?erro=salvar");
  redirect("/");
}
