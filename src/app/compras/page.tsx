import { PageHeading } from "@/components/page-heading";
import { NfeImport } from "@/components/nfe-import";

export default function PurchasesPage() {
  return <><PageHeading eyebrow="COMPRAS" title="Importar nota fiscal" description="Use um XML de NF-e para registrar produtos e histórico de preços desta loja." /><NfeImport /><section className="card safety-card"><p className="eyebrow">DADOS REAIS</p><h2>Histórico de preços</h2><p>Os preços aparecerão aqui após a importação de uma nota fiscal. O sistema não exibe valores de demonstração.</p></section></>;
}