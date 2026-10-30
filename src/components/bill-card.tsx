'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateBillStatus } from '@/app/boletos/novo/actions';
import { Icon } from './icons';
import { dateMonth, formatDate, formatMoney } from '@/lib/presentation';
import { isBackdropClick } from '@/lib/dialog-backdrop';
import { Spinner } from './loading-indicator';

export type BillView = { id: string; supplier: string; description: string; amount: number; dueDate: string; code: string | null; hasDocument: boolean; status: 'pending' | 'paid' | 'cancelled' };
const statusLabel = { pending: 'Em aberto', paid: 'Pago', cancelled: 'Cancelado' };
export function BillCard({ bill }: { bill: BillView }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState(bill.status);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    setError('');
    try {
      if (!bill.code || !navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText(bill.code.replace(/\D/g, ''));
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch { setError('Não foi possível copiar. Abra os detalhes e selecione o código para copiar manualmente.'); }
  }
  async function download() {
    setDownloading(true); setError('');
    try {
      const response = await fetch(`/api/boletos/${bill.id}/download`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const { url } = await response.json() as { url?: string };
      if (!url || !url.startsWith('https://')) throw new Error();
      window.location.assign(url);
    } catch { setError('Não foi possível baixar o documento. Tente novamente.'); }
    finally { setDownloading(false); }
  }
  async function mark(next: 'paid' | 'cancelled') {
    if (busy || status !== 'pending') return;
    setError(''); setBusy(true);
    try { await updateBillStatus(bill.id, next); setStatus(next); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a alteração.'); }
    finally { setBusy(false); }
  }
  const copyButton = (label: string) => <button type="button" className={`copy-icon ${copied ? 'copied' : ''}`} disabled={!bill.code} onClick={copy} aria-label={label} title={bill.code ? label : 'Código não informado'}><Icon name={copied ? 'check' : 'copy'} /></button>;
  return <article className="bill-item">
    <button type="button" className="bill-open" aria-label={`Ver detalhes de ${bill.supplier}`} onClick={() => { setError(''); dialog.current?.showModal(); setIsOpen(true); }}>
      <span className="date-tile"><strong>{bill.dueDate.slice(8)}</strong><small>{dateMonth(bill.dueDate)}</small></span>
      <span className="bill-description"><strong>{bill.supplier}</strong><span>{bill.description}</span></span>
      <span className="money-col"><strong>{formatMoney(bill.amount)}</strong><span className={`status-pill status-${status}`}>{statusLabel[status]}</span></span>
    </button>
    <div className="bill-quick-actions"><span>{formatDate(bill.dueDate)}{!bill.code && ' · Código não informado'}</span>{copyButton(`Copiar código de ${bill.supplier}`)}</div>
    {!isOpen && error && <p className="form-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{copied ? 'Código copiado' : ''}</span>
    <dialog ref={dialog} className="detail-dialog" aria-labelledby={titleId} onClose={() => setIsOpen(false)} onCancel={() => setError('')} onClick={event => { if (!busy && !downloading && isBackdropClick(event)) event.currentTarget.close(); }}>
      <div className="dialog-content">
        <div className="dialog-header"><h2 id={titleId}>Detalhes do boleto</h2><button className="icon-button" type="button" aria-label="Fechar detalhes" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
        <p className="detail-supplier">{bill.supplier}</p><p className="detail-amount">{formatMoney(bill.amount)}</p>
        <dl className="detail-lines"><div><dt>Vencimento</dt><dd>{formatDate(bill.dueDate)}</dd></div><div><dt>Descrição</dt><dd>{bill.description}</dd></div><div><dt>Situação</dt><dd>{statusLabel[status]}</dd></div></dl>
        <section className="bill-code-section"><h3>Linha digitável</h3><div className="code-display"><code>{bill.code || 'Código não informado'}</code>{copyButton('Copiar linha digitável')}</div></section>
        <button type="button" className="secondary-action full-action" disabled={!bill.hasDocument || downloading} onClick={download}>{downloading ? <Spinner /> : <Icon name="download" />}{downloading ? 'Preparando…' : 'Baixar boleto'}</button>
        {!bill.hasDocument && <p className="helper-text">Nenhum documento anexado a este boleto.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {status === 'pending' && <button type="button" className="primary-action full-action" disabled={busy} onClick={() => void mark('paid')}>{busy && <Spinner />}{busy ? 'Salvando…' : 'Marcar como pago'}</button>}
        <p className="helper-text">Registrar como pago não realiza uma transação bancária.</p>
        <div className="bill-secondary-actions"><Link className="text-action" href={`/boletos/novo?edit=${bill.id}`}>Editar boleto</Link>{status === 'pending' && <button className="text-action danger-text" type="button" disabled={busy} onClick={() => void mark('cancelled')}>Cancelar boleto</button>}</div>
      </div>
    </dialog>
  </article>;
}
