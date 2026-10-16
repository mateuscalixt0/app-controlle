'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="card empty-state" role="alert"><h1>Não foi possível carregar</h1><p>Confira sua conexão e tente novamente.</p><button type="button" className="primary-action full-action" onClick={reset}>Tentar novamente</button><Link className="text-action" href="/">Voltar ao início</Link></section>;
}
