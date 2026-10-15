'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './icons';
import { formatDate, dateMonth, formatMoney } from '@/lib/presentation';
import type { HomeSummary } from '@/lib/home-summary';

export function HomeDashboard({ summary }: { summary: HomeSummary }) {
  const [hidden, setHidden] = useState(false);
  return <>
    <div className="hero-row"><div><h1>Olá, boas-vindas</h1><p>Vamos cuidar da sua loja.</p></div><Link className="icon-button" href="/minha-loja" aria-label="Minha loja"><Icon name="user" /></Link></div>
    <div className="home-grid"><div>
      <section className="card balance-card" aria-label="Resumo dos boletos"><div className="balance-label"><span>Boletos em aberto</span><button className="icon-button" type="button" aria-label={hidden ? 'Mostrar total' : 'Ocultar total'} aria-pressed={hidden} onClick={() => setHidden(!hidden)}><Icon name="eye" /></button></div><p className="balance-value">{hidden ? 'R$ •••••' : formatMoney(summary.amount)}</p><p className="helper-text">{summary.count} {summary.count === 1 ? 'conta em aberto' : 'contas em aberto'}, incluindo vencidas</p><Link className="primary-action full-action" href="/boletos/novo"><Icon name="add-bill" />Adicionar boleto</Link></section>
      <div className="section-heading"><h2>Lista de faltas</h2><Link href="/faltas">Ver lista <Icon name="chevron" /></Link></div>
      <section className="lime-card"><p>Na próxima compra</p><strong className="big-count">{summary.missing} {summary.missing === 1 ? 'produto' : 'produtos'}</strong><div className="lime-foot"><span>{summary.urgent} com prioridade</span><Link className="pill-white" href="/faltas/novo">+ Anotar falta</Link></div></section>
    </div><div><section className="card upcoming-card"><div className="section-heading"><h2>Próximos boletos</h2><Link href="/boletos?status=pending">Ver todos</Link></div>
      {summary.upcoming.map(bill => <Link href="/boletos?status=pending" className="transaction" key={bill.id}><span className="date-tile"><strong>{bill.dueDate.slice(8)}</strong><small>{dateMonth(bill.dueDate)}</small></span><span className="grow"><strong>{bill.supplier}</strong><small>{formatDate(bill.dueDate)} · {bill.description}</small></span><strong>{formatMoney(bill.amount)}</strong></Link>)}
      {!summary.upcoming.length && <div className="empty-state"><strong>Nenhum boleto em aberto</strong><p>Novas contas aparecerão aqui depois do cadastro.</p></div>}
    </section><p className="home-note">Uma coisa de cada vez. Sua loja em dia.</p></div></div>
  </>;
}
