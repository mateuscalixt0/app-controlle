import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getHomeSummary } from '../src/lib/home-summary';
import { formatDate } from '../src/lib/presentation';
function client(amounts: number[], fail = false) {
  const filters: unknown[][] = [];
  const ranges: number[][] = [];
  const db = { from(table: string) {
    let urgent = false;
    const chain = {
      select() { return chain; },
      eq(key: string, value: string) { filters.push([table,key,value]); urgent ||= value === 'urgente'; return chain; },
      order() { return chain; },
      async range(start: number, end: number) {
        ranges.push([start,end]);
        // Deliberately simulate a server row cap below the requested page size.
        return {error: fail ? {} : null, data: amounts.slice(start,start+2).map((amount_cents,i) => ({id:String(start+i),description:'Teste',amount_cents,due_date:'2026-10-20',suppliers:{name:'Teste'}}))};
      },
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({error:null,count:urgent ? 1 : 4}).then(resolve); },
    };
    return chain;
  }};
  return { db: db as unknown as SupabaseClient, filters, ranges };
}
describe('resumo real do início', () => {
  it('soma centavos de todas as páginas e aplica a loja a cada consulta', async () => {
    const {db,filters,ranges} = client([10,20,30,40,50]);
    const result = await getHomeSummary(db,'loja-teste');
    expect(result).toMatchObject({amount:150,count:5,missing:4,urgent:1});
    expect(result.upcoming.map(b => b.id)).toEqual(['0','1','2']);
    expect(ranges.map(r=>r[0])).toEqual([0,2,4,5]);
    expect(filters.filter(f=>f[1]==='store_id')).toHaveLength(6);
    expect(filters.filter(f=>f[1]==='store_id').every(f=>f[2]==='loja-teste')).toBe(true);
  });
  it('retorna resumo vazio sem valores demonstrativos', async () => {
    const {db} = client([]);
    expect(await getHomeSummary(db,'loja')).toMatchObject({amount:0,count:0,upcoming:[]});
  });
  it('não transforma falha de consulta em saldo zero', async () => {
    await expect(getHomeSummary(client([],true).db,'loja')).rejects.toThrow('carregar');
  });
  it('recusa valores fracionários e estouro de inteiro seguro', async () => {
    for (const values of [[1.5],[Number.MAX_SAFE_INTEGER,1]]) await expect(getHomeSummary(client(values).db,'loja')).rejects.toThrow('limite');
  });
  it('preserva data civil brasileira', () => { expect(formatDate('2026-10-20')).toBe('20/10/2026'); });
});
