export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando compras">
      <LoadingIndicator label="Carregando compras…" />
      <div className="page-heading"><p className="eyebrow">COMPRAS</p><h1>&nbsp;</h1><p>&nbsp;</p></div>
      <div className="card" aria-hidden="true" style={{ minHeight: 184 }} />
      <div className="card" aria-hidden="true" style={{ minHeight: 142 }} />
    </div>
  );
}
import { LoadingIndicator } from "@/components/loading-indicator";
