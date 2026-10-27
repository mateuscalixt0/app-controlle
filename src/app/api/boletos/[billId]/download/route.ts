import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/supabase/session';

export async function GET(_request: Request, { params }: { params: Promise<{ billId: string }> }) {
  const session = await getCurrentSession();
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const { billId } = await params;
  const { data: document } = await session.supabase.from('bill_documents').select('storage_path').eq('bill_id', billId).eq('store_id', session.storeId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!document) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
  const { data, error } = await session.supabase.storage.from('bill-documents').createSignedUrl(document.storage_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Não foi possível preparar o download.' }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
}
