import type { SupabaseClient } from '@supabase/supabase-js';
import { supplierName } from './presentation';

/** Read in ordered pages: PostgREST's row cap must not silently truncate the total. */
export async function getHomeSummary(supabase: SupabaseClient, storeId: string) {
  let offset = 0, amount = 0, count = 0;
  const upcoming: { id: string; supplier: string; description: string; amount: number; dueDate: string }[] = [];
  const size = 500;
  for (;;) {
    const { data, error } = await supabase.from('bills')
      .select('id,description,amount_cents,due_date,suppliers(name)')
      .eq('store_id', storeId).eq('status', 'pending')
      .order('due_date').order('id').range(offset, offset + size - 1);
    if (error || !data) throw new Error('Não foi possível carregar o resumo dos boletos.');
    if (!data.length) break;
    for (const bill of data) {
      if (!Number.isSafeInteger(bill.amount_cents) || bill.amount_cents < 0 || !Number.isSafeInteger(amount + bill.amount_cents)) throw new Error('Valor fora do limite de exibição.');
      amount += bill.amount_cents; count++;
      if (upcoming.length < 3) upcoming.push({ id: bill.id, supplier: supplierName(bill.suppliers), description: bill.description, amount: bill.amount_cents, dueDate: bill.due_date });
    }
    offset += data.length;
  }
  const [missing, urgent] = await Promise.all([
    supabase.from('missing_items').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('missing_items').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('priority', 'urgente'),
  ]);
  if (missing.error || urgent.error || missing.count === null || urgent.count === null) throw new Error('Não foi possível carregar o resumo de faltas.');
  return { amount, count, upcoming, missing: missing.count, urgent: urgent.count };
}
export type HomeSummary = Awaited<ReturnType<typeof getHomeSummary>>;
