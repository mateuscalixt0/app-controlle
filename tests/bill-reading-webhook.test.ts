import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), validate: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({ getCurrentSession: mocks.session }));
vi.mock('@/lib/bill-file', () => ({ validateBillFile: mocks.validate }));
import { POST } from '../src/app/api/boletos/extract/route';

const url = 'https://webhook.example.test/fixture';
function request(type = 'image/jpeg') { const form = new FormData(); form.append('file', new File(['fixture'], 'test', { type })); return new Request('http://localhost/api/boletos/extract', { method: 'POST', body: form }); }
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('OPENAI_API_KEY', 'fixture-key'); vi.stubEnv('BILL_READING_WEBHOOK_URL', url); mocks.session.mockResolvedValue({ storeId: 'store-fixture' }); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('notificação da leitura de boleto', () => {
  it.each(['application/pdf', 'image/jpeg', 'image/png'])('envia a data e o valor identificados de %s sem enviar arquivo ou chave', async (type) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ output: [{ content: [{ type: 'output_text', text: 'Vencimento: 30/10/2026\nValor do documento: 307,06' }] }] })).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(type));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ extraction: { dueDate: '2026-10-30' } });
    const [target, options] = fetchMock.mock.calls[1];
    expect(target).toBe(url);
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({ status: 'sucesso', loja_id: 'store-fixture', leitura: { vencimento_impresso: '2026-10-30', valor_impresso: '307,06' } });
    expect(payload).toMatchObject({ chamada_id: expect.any(String), modelo: 'gpt-4.1-mini', duracao_ms: expect.any(Number), tipo_arquivo: type });
    expect(options.body).not.toContain('fixture-key');
    expect(options.body).not.toContain('data:image');
  });
  it('notifica quando a chamada à IA termina com erro de rede', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request())).status).toBe(502);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ status: 'falha', motivo: 'erro_ou_tempo_esgotado' });
  });
  it('repete entrega temporariamente indisponível com o mesmo identificador', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ output: [] })).mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request())).status).toBe(422);
    expect(fetchMock.mock.calls[1][1].body).toBe(fetchMock.mock.calls[2][1].body);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ status: 'falha', motivo: 'resposta_vazia' });
  });
  it('informa falha da OpenAI sem incluir a resposta privada', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('conteúdo privado', { status: 429 })).mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request())).status).toBe(502);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ status: 'falha', motivo: 'openai_http_429' });
    expect(fetchMock.mock.calls[1][1].body).not.toContain('conteúdo privado');
  });
  it('mantém a leitura disponível quando o webhook falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ output: [{ content: [{ type: 'output_text', text: 'Vencimento: 30/10/2026' }] }] })).mockRejectedValueOnce(new Error('offline')));
    expect((await POST(request())).status).toBe(200);
  });
  it('não envia dados sem sessão', async () => {
    mocks.session.mockResolvedValue(null);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request())).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
