import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

  const { data: member } = await supabase.from("store_members").select("store_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!member) return NextResponse.redirect(new URL("/configurar-loja", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

  const { data: document } = await supabase
    .from("bill_documents")
    .select("storage_path")
    .eq("store_id", member.store_id)
    .eq("bill_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!document) return new NextResponse("Documento não encontrado.", { status: 404 });

  const { data, error } = await supabase.storage.from("bill-documents").createSignedUrl(document.storage_path, 60);
  if (error || !data?.signedUrl) return new NextResponse("Não foi possível abrir o documento.", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
