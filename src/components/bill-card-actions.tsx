'use client';

import { useState } from 'react';

export function BillCardActions({ billId, code, hasDocument }: { billId: string; code: string | null; hasDocument: boolean }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  return <div className="bill-card-actions">
    <button className="bill-card-action" disabled={!code} onClick={copyCode} type="button">{copied ? 'Código copiado' : 'Copiar código'}</button>
    <button className="bill-card-action" disabled={!hasDocument || downloading} onClick={downloadBill} type="button">{downloading ? 'Preparando…' : '↓ Baixar boleto'}</button>
  </div>;
}
