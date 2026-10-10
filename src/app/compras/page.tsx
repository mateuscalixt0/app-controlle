import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { XmlImportForm } from "@/components/xml-import-form";
import { importNfe } from "./actions";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const { erro, sucesso } = await searchParams;
  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="Compras e preços" description="Importe uma NF-e para registrar produtos e preços reais da sua loja." />
      {sucesso && <p className="success-notice" role="status">XML importado. Os produtos e preços já estão disponíveis para consultas futuras.</p>}
      <section aria-labelledby="importar-title">
        <div className="section-heading"><div><p className="eyebrow">IMPORTAÇÃO</p><h2 id="importar-title">Importar XML de NF-e</h2></div></div>
        <XmlImportForm action={importNfe} error={erro} />
      </section>
      <section aria-labelledby="consultas-title"><div className="section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2 id="consultas-title">Consultas e comparações</h2></div></div><div className="stack"><article className="card link-card"><span className="feature-icon small"><Icon name="search" /></span><div><h3>Consultar por produto</h3><p>Os itens e preços importados serão usados nas próximas consultas.</p></div></article><article className="card link-card"><span className="feature-icon small"><Icon name="prices" /></span><div><h3>Gráficos de preços</h3><p>Gráficos e comparações serão liberados depois que houver histórico suficiente.</p></div></article></div></section>
    </>
  );
}
