import Link from "next/link";
import { DemoNotice } from "@/components/demo-notice";
import { Icon } from "@/components/icons";
import { demoBills } from "@/lib/demo-data";

export default function Home() {
  return (
    <>
      <section className="hero-row">
        <div>
          <p className="eyebrow">QUINTA-FEIRA, 8 DE OUTUBRO</p>
          <h1>Olá, Mateus</h1>
          <p>Veja o que precisa da sua atenção hoje.</p>
        </div>
        <span className="avatar" aria-hidden="true">MC</span>
      </section>

      <DemoNotice />

      <section aria-labelledby="resumo-title">
        <div className="section-heading">
          <div><p className="eyebrow">RESUMO</p><h2 id="resumo-title">Visão da loja</h2></div>
        </div>
        <div className="summary-grid">
          <Link href="/boletos" className="summary-card pink-card">
            <span>Vence esta semana</span><strong>2 boletos</strong><small>R$ 2.826,20</small>
          </Link>
          <Link href="/faltas" className="summary-card blue-card">
            <span>Lista de faltas</span><strong>3 produtos</strong><small>1 precisa comprar</small>
          </Link>
        </div>
      </section>

      <section aria-labelledby="vencimentos-title">
        <div className="section-heading">
          <div><p className="eyebrow">PRÓXIMOS</p><h2 id="vencimentos-title">Vencimentos</h2></div>
          <Link href="/boletos">Ver todos</Link>
        </div>
        <div className="stack">
          {demoBills.slice(0, 2).map((bill) => (
            <article className="card compact-card" key={bill.supplier}>
              <span className="date-tile"><strong>{bill.dueDate.slice(0, 2)}</strong><small>OUT</small></span>
              <div className="grow"><h3>{bill.supplier}</h3><p>{bill.description}</p><small>{bill.status}</small></div>
              <strong>{bill.amount}</strong>
            </article>
          ))}
        </div>
      </section>

      <Link className="primary-action full-action" href="/boletos/novo">
        <Icon name="camera" /> Adicionar boleto por foto ou arquivo
      </Link>
    </>
  );
}
