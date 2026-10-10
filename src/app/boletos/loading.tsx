export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando boletos">
      <div className="page-heading"><p className="eyebrow">BOLETOS</p><h1>&nbsp;</h1><p>&nbsp;</p></div>
      <div className="card" aria-hidden="true">
        <div className="field-skeleton"><span>&nbsp;</span><div /></div>
      </div>
      <div className="filter-row" aria-hidden="true"><span className="filter-chip">Todos</span><span className="filter-chip">Em aberto</span><span className="filter-chip">Pagos</span></div>
      <div className="stack" aria-hidden="true"><div className="card" style={{ minHeight: 132 }} /><div className="card" style={{ minHeight: 132 }} /><div className="card" style={{ minHeight: 132 }} /></div>
    </div>
  );
}
