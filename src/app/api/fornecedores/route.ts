import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/supabase/session';

const PAGE_SIZE = 500;

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const suppliers: { id: string; name: string }[] = [];
  for (let offset = 0; ; ) {
    const { data, error } = await session.supabase
      .from('suppliers')
      .select('id,name')
      .eq('store_id', session.storeId)
      .order('name')
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: 'Não foi possível carregar fornecedores.' }, { status: 500 });
    suppliers.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    offset += data.length;
  }
  return NextResponse.json({ suppliers }, { headers: { 'Cache-Control': 'private, no-store' } });
}
