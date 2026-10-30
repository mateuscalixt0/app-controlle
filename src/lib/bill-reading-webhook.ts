import type { BillExtraction } from './boleto-text';

export type BillReadingEvent = {
  event: 'boleto.leitura_ia';
  status: 'sucesso' | 'falha';
  chamada_id: string;
  modelo: string;
  duracao_ms: number;
  motivo?: string;
  tipo_arquivo: string;
  loja_id: string;
  ocorrido_em: string;
  leitura?: { vencimento_impresso: string | null; valor_impresso: string | null; codigo: string | null; dados_validados: BillExtraction };
};

export async function sendBillReadingEvent(event: BillReadingEvent) {
  const url = process.env.BILL_READING_WEBHOOK_URL;
  if (!url) {
    console.error('boleto_webhook_nao_configurado', { chamada_id: event.chamada_id });
    return false;
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Event-Id': event.chamada_id }, body: JSON.stringify(event), signal: AbortSignal.timeout(3000), cache: 'no-store', redirect: 'error' });
      if (response.ok) return true;
      if (response.status < 500 && response.status !== 429) break;
    } catch { /* Retry with the same ID so the receiver can deduplicate. */ }
  }
  console.error('boleto_webhook_falhou', { chamada_id: event.chamada_id });
  return false;
}
