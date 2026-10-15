import Link from 'next/link';
export default function NotFound() { return <section className="card empty-state"><h1>Página não encontrada</h1><p>Este endereço não está disponível.</p><Link className="primary-action full-action" href="/">Voltar ao início</Link></section>; }
