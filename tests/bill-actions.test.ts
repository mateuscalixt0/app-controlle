import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), from: vi.fn(), download: vi.fn(), revalidate: vi.fn(), signed: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({ getCurrentSession: mocks.session }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { attachBillDocument, createBill } from '../src/app/boletos/novo/actions';
import { GET } from '../src/app/api/boletos/[billId]/documentos/[documentId]/route';
const store = '11111111-1111-4111-8111-111111111111', bill = '22222222-2222-4222-8222-222222222222', file = '33333333-3333-4333-8333-333333333333';
function query(data: unknown, error: unknown = null) {
  const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error }), upsert: vi.fn().mockResolvedValue({ error }) };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); return chain;
}
const attachment = { billId: bill, storagePath: `${store}/${bill}/${file}.pdf`, originalName: 'boleto.pdf', contentType: 'application/pdf', sizeBytes: 9 };
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue({ storeId: store, userId: file, supabase: { from: mocks.from, storage: { from: () => ({ download: mocks.download, createSignedUrl: mocks.signed }) } } }); });
describe('autorização e recuperação de gravação', () => {
  it('recusa anexo sem sessão', async () => { mocks.session.mockResolvedValue(null); await expect(attachBillDocument(attachment)).rejects.toThrow('redirect:/login'); expect(mocks.download).not.toHaveBeenCalled(); });
  it('recusa caminho de outra loja antes de ler storage', async () => { await expect(attachBillDocument({ ...attachment, storagePath: `44444444-4444-4444-8444-444444444444/${bill}/${file}.pdf` })).rejects.toThrow('Caminho'); expect(mocks.from).not.toHaveBeenCalled(); });
  it('filtra boleto pela loja e rejeita id inacessível', async () => { const chain = query(null); mocks.from.mockReturnValue(chain); await expect(attachBillDocument(attachment)).rejects.toThrow('não encontrado'); expect(chain.eq).toHaveBeenCalledWith('store_id', store); expect(mocks.download).not.toHaveBeenCalled(); });
  it('não vincula arquivo ausente', async () => { mocks.from.mockReturnValue(query({ id: bill })); mocks.download.mockResolvedValue({ data: null, error: new Error('offline') }); await expect(attachBillDocument(attachment)).rejects.toThrow('arquivo não foi confirmado'); expect(mocks.from).toHaveBeenCalledTimes(1); });
  it('verifica conteúdo e vincula idempotentemente', async () => { const chain = query({ id: bill }); mocks.from.mockReturnValue(chain); mocks.download.mockResolvedValue({ data: new Blob(['%PDF-1.7\n'], { type: 'application/pdf' }), error: null }); await attachBillDocument(attachment); expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ store_id: store, extraction_status: 'confirmed' }), { onConflict: 'storage_path', ignoreDuplicates: true }); });
  it('retorna mesmo boleto numa repetição sem novo insert', async () => { const chain = query({ id: bill, amount_cents: 12345, due_date: '2026-10-11', description: 'Boleto', beneficiary_document: null, digitable_line: null, suppliers: { name: 'FICTICIO' } }); mocks.from.mockReturnValue(chain); await expect(createBill({ id: bill, supplier: 'FICTICIO', description: 'Boleto', amount: '123,45', dueDate: '2026-10-11' })).resolves.toEqual({ billId: bill, storeId: store }); expect(mocks.from).toHaveBeenCalledTimes(1); });
  it('não aceita mudar dados numa repetição já persistida', async () => { mocks.from.mockReturnValue(query({ id: bill, amount_cents: 12345, due_date: '2026-10-11', description: 'Boleto', suppliers: { name: 'FICTICIO' } })); await expect(createBill({ id: bill, supplier: 'FICTICIO', description: 'Boleto', amount: '9,99', dueDate: '2026-10-11' })).rejects.toThrow('já foi cadastrado'); });
  it('download não gera link sem autorização', async () => { const chain = query(null); mocks.from.mockReturnValue(chain); const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ billId: bill, documentId: file }) }); expect(response.status).toBe(404); expect(chain.eq).toHaveBeenCalledWith('store_id', store); expect(mocks.signed).not.toHaveBeenCalled(); });
});
