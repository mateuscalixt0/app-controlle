import Link from "next/link";
import { DemoNotice } from "@/components/demo-notice";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { demoBills } from "@/lib/demo-data";

export default function BillsPage() {
  return (
    <>
      <PageHeading eyebrow="BOLETOS" title="Boletos a pagar" description="Acompanhe os próximos vencimentos e encontre uma conta rapidamente." />
      <DemoNotice>dados fictícios; busca, filtros e pagamentos ainda não consultam o banco.</DemoNotice>
      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Buscar boleto</span>
        <input disabled placeholder="Buscar por fornecedor ou descrição" type="search" />
      </label>
      <div className="filter-row" aria-label="Filtros em validação">
        <button className="filter-chip active" type="button" aria-pressed="true">Todos</button>
        <button className="filter-chip" type="button" disabled>Hoje</button>
        <button className="filter-chip" type="button" disabled>Esta semana</button>
        <button className="filter-chip" type="button" disabled>Este mês</button>
      </div>
      <section className="stack" aria-label="Boletos fictícios">
        {demoBills.map((bill) => (
          <article className="card bill-card" key={bill.supplier}>
            <div className="row"><div><p className="eyebrow">VENCIMENTO {bill.dueDate}</p><h2>{bill.supplier}</h2></div><strong className="amount">{bill.amount}</strong></div>
            <p>{bill.description}</p>
            <span className="status-pill">{bill.status}</span>
          </article>
        ))}
      </section>
      <Link className="primary-action full-action" href="/boletos/novo"><Icon name="add-bill" /> Adicionar boleto</Link>
    </>
  );
}
