export function Spinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function LoadingIndicator({ label = "Carregando…" }: { label?: string }) {
  return <p className="loading-indicator" role="status"><Spinner />{label}</p>;
}
