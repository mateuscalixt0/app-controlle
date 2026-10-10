import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ billId: string; documentId: string }> }) {
  const { billId, documentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: document } = await supabase
    .from("bill_documents")
    .select("storage_path,bill_id")
    .eq("id", documentId)
    .eq("bill_id", billId)
    .maybeSingle();

  if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  const { data, error } = await supabase.storage.from("bill-documents").createSignedUrl(document.storage_path, 60);
  if (error || !data) return NextResponse.json({ error: "Não foi possível abrir o documento." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}