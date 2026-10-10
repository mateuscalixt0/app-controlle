import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/supabase/session";

export async function GET(_: Request, { params }: { params: Promise<{ billId: string; documentId: string }> }) {
  const { billId, documentId } = await params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: document } = await session.supabase
    .from("bill_documents")
    .select("storage_path,bill_id")
    .eq("id", documentId)
    .eq("bill_id", billId)
    .maybeSingle();

  if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  const { data, error } = await session.supabase.storage.from("bill-documents").createSignedUrl(document.storage_path, 60);
  if (error || !data) return NextResponse.json({ error: "Não foi possível abrir o documento." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
