function LoadingCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card" aria-hidden="true">
      <div className="field-skeleton"><span>&nbsp;</span><div style={{ height: compact ? 18 : 22, width: compact ? "42%" : "68%" }} /></div>
      <div className="field-skeleton"><span>&nbsp;</span><div style={{ height: compact ? 14 : 42, width: compact ? "76%" : "100%" }} /></div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      <div className="page-heading"><p className="eyebrow">&nbsp;</p><h1>&nbsp;</h1><p>&nbsp;</p></div>
      <LoadingCard />
      <LoadingCard compact />
      <LoadingCard compact />
    </div>
  );
}
