import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/supabase/session';

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.storeId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const productId = params.get('id');
  const headers = { 'Cache-Control': 'private, no-store' };
  if (productId) {
    if (!/^[0-9a-f-]{36}$/i.test(productId)) return NextResponse.json({ error: 'Produto inválido.' }, { status: 400, headers });
    const { data: product, error } = await session.supabase.from('products').select('id,name,unit').eq('store_id', session.storeId).eq('id', productId).maybeSingle();
    if (error) return NextResponse.json({ error: 'Não foi possível consultar o produto.' }, { status: 500, headers });
    if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404, headers });
    const since = new Date(); since.setUTCDate(since.getUTCDate() - 90);
    const prices = await session.supabase.from('price_entries').select('id,unit,unit_price,recorded_on,supplier_id').eq('store_id', session.storeId).eq('product_id', product.id).eq('unit', product.unit ?? '').gte('recorded_on', since.toISOString().slice(0,10)).order('unit_price').order('recorded_on', { ascending: false }).limit(100);
    if (prices.error) return NextResponse.json({ error: 'Não foi possível consultar os preços.' }, { status: 500, headers });
    const ids = [...new Set((prices.data ?? []).map(p => p.supplier_id))];
    const suppliers = ids.length ? await session.supabase.from('suppliers').select('id,name').eq('store_id',session.storeId).in('id',ids) : { data: [], error: null };
    if (suppliers.error) return NextResponse.json({ error: 'Não foi possível consultar fornecedores.' }, { status: 500, headers });
    const names = Object.fromEntries((suppliers.data ?? []).map(s => [s.id,s.name]));
    return NextResponse.json({ product, prices: (prices.data ?? []).map(p => ({ ...p, supplier_name: names[p.supplier_id] ?? 'Fornecedor' })) }, { headers });
  }
  const q = (params.get('q') ?? '').trim().slice(0,100).replace(/[%_\\]/g,'\\$&');
  let query = session.supabase.from('products').select('id,name,unit').eq('store_id',session.storeId).order('name').order('id').limit(30);
  if (q) query = query.ilike('name',`%${q}%`);
  const { data,error } = await query;
  if (error) return NextResponse.json({ error: 'Não foi possível buscar produtos.' }, { status: 500, headers });
  return NextResponse.json({ products: data ?? [] }, { headers });
}
