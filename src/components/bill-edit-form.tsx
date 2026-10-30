'use client';

import { useState, useTransition } from 'react';
import { Spinner } from './loading-indicator';
import { useRouter } from 'next/navigation';
import { updateBill } from '@/app/boletos/novo/actions';

export function BillEditForm({ bill }: { bill: { id: string; supplier: string; description: string; amount: string; dueDate: string; line: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(bill);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const change = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  return <form className="card form-card review-form" onSubmit={event => { event.preventDefault(); setError(''); startTransition(async () => { try { await updateBill({ id: form.id, supplier: form.supplier, description: form.description, amount: form.amount, dueDate: form.dueDate, digitableLine: form.line }); router.push('/boletos'); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a edição.'); } }); }}>
    <p className="eyebrow">EDITAR BOLETO</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <label>Fornecedor<input required value={form.supplier} onChange={event => change('supplier', event.target.value)} /></label>
    <label>Descrição<input required value={form.description} onChange={event => change('description', event.target.value)} /></label>
    <label>Valor (R$)<input required inputMode="decimal" value={form.amount} onChange={event => change('amount', event.target.value)} /></label>
    <label>Vencimento<input required type="date" value={form.dueDate} onChange={event => change('dueDate', event.target.value)} /></label>
    <label>Código de barras ou linha digitável<input inputMode="numeric" value={form.line} onChange={event => change('line', event.target.value)} /></label>
    <button className="primary-action" disabled={pending} type="submit">{pending && <Spinner />}{pending ? 'Salvando…' : 'Salvar alterações'}</button>
  </form>;
}
