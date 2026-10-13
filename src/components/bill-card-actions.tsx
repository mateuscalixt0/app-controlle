'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateBillStatus } from '@/app/boletos/novo/actions';

export function BillCardActions({ billId, code, hasDocument, status }: { billId: string; code: string | null; hasDocument: boolean; status: 'pending' | 'paid' | 'cancelled' }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function downloadBill() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/boletos/${billId}/download`);
      if (!response.ok) throw new Error();
      const { url } = await response.json() as { url: string };
      window.location.assign(url);
    } finally {
      setDownloading(false);
    }
  }

  if (hidden) return null;
  async function mark(status: 'paid' | 'cancelled') {
    await updateBillStatus(billId, status);
    setMenuOpen(false);
    if (status === 'paid') setHidden(true);
  }
  return <>
    <div className="bill-card-menu">
      <button type="button" aria-label="Mais opções" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>⋯</button>
      {menuOpen && <div className="bill-card-menu-popover"><Link href={`/boletos/novo?edit=${billId}`}>Editar</Link><button type="button" onClick={() => void mark('cancelled')}>Cancelar</button></div>}
    </div>
    {status !== 'cancelled' && <button type="button" className="bill-paid-action" onClick={() => void mark('paid')}>Marcar como pago</button>}
    <div className="bill-card-actions">
    <button className="bill-card-action" disabled={!code} onClick={copyCode} type="button">{copied ? 'Código copiado' : 'Copiar código'}</button>
    <button className="bill-card-action" disabled={!hasDocument || downloading} onClick={downloadBill} type="button">{downloading ? 'Preparando…' : '↓ Baixar boleto'}</button>
    </div>
  </>;
}
