import { DemoNotice } from "@/components/demo-notice";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";

export default function PurchasesPage() {
  return (
    <>
      <PageHeading eyebrow="COMPRAS" title="Compras e preços" description="Consulte compras anteriores e prepare importações de notas fiscais." />
      <DemoNotice>área visual; XML, consultas e gráficos ainda não processam nem persistem dados.</DemoNotice>
      <section className="card feature-card"><span className="feature-icon"><Icon name="upload" /></span><div><h2>Importar XML de NF-e</h2><p>Conferir fornecedor, produtos, quantidades, unidades e preços antes de confirmar.</p><button className="secondary-action" disabled type="button">Selecionar XML</button></div></section>
      <section aria-labelledby="consultas-title"><div className="section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2 id="consultas-title">Consultas e comparações</h2></div></div><div className="stack"><article className="card link-card"><span className="feature-icon small"><Icon name="search" /></span><div><h3>Consultar por produto</h3><p>Veja fornecedores, unidade, origem e registros dos últimos 90 dias.</p></div><Icon className="chevron" name="chevron" /></article><article className="card link-card"><span className="feature-icon small"><Icon name="prices" /></span><div><h3>Gráficos de preços</h3><p>Compare somente itens equivalentes e unidades compatíveis.</p></div><Icon className="chevron" name="chevron" /></article></div></section>
      <section className="card safety-card"><p className="eyebrow">CONFERÊNCIA OBRIGATÓRIA</p><h2>Produtos sem correspondência</h2><p>Exigirão vínculo ou confirmação manual. A associação automática por IA não faz parte desta etapa. Reimportações serão protegidas contra duplicidade quando o fluxo funcional for implementado.</p></section>
    </>
  );
}
