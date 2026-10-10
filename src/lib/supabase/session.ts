import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";

export type CurrentSession = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  storeId: string | null;
};

/** Resolves auth and the current store once for all Server Components in a request. */
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string" || !userId) return null;

  const { data: member } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    storeId: member?.store_id ?? null,
  };
});
