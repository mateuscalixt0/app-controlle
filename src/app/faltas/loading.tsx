export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando lista de faltas">
      <LoadingIndicator label="Carregando lista de faltas…" />
      <div className="page-heading"><p className="eyebrow">COMPRAS</p><h1>&nbsp;</h1><p>&nbsp;</p></div>
      <div className="card" aria-hidden="true" style={{ minHeight: 48 }} />
      <div className="stack" aria-hidden="true"><div className="card" style={{ minHeight: 116 }} /><div className="card" style={{ minHeight: 116 }} /><div className="card" style={{ minHeight: 116 }} /></div>
    </div>
  );
}
import { LoadingIndicator } from "@/components/loading-indicator";
