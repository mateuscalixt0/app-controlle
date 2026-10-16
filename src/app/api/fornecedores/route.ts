import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/supabase/session';

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80) ?? '';
  if (query.length < 1) return NextResponse.json({ suppliers: [] }, { headers: { 'Cache-Control': 'private, no-store' } });

  const { data, error } = await session.supabase
    .from('suppliers')
    .select('id,name')
    .eq('store_id', session.storeId)
    .ilike('name', `%${query.replace(/[%_]/g, '\\$&')}%`)
    .order('name')
    .limit(8);

  if (error) return NextResponse.json({ error: 'Não foi possível buscar beneficiários.' }, { status: 500 });
  return NextResponse.json({ suppliers: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } });
}
