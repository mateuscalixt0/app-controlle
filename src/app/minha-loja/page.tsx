import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/supabase/session';
import { signOut } from '@/app/login/actions';
import { Icon } from '@/components/icons';
import { PageHeading } from '@/components/page-heading';

export default async function StorePage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!session.storeId) redirect('/configurar-loja');
  const { data: store, error } = await session.supabase.from('stores').select('name').eq('id', session.storeId).single();
  if (error) throw new Error('Não foi possível carregar sua loja.');
  return <div className="form-width">
    <PageHeading eyebrow="CONTA" title="Minha loja" description="Seus dados e os produtos da sua loja." />
    <section className="card store-profile"><span className="store-avatar"><Icon name="user" /></span><div><h2>{store.name}</h2><p>{session.email}</p></div></section>
    <section className="card store-import"><div className="section-title-inline"><Icon name="upload" /><h2>Produtos e preços</h2></div><p className="helper-text">Use o XML da nota fiscal para registrar produtos e referências de preço.</p><Link className="primary-action full-action" href="/compras"><Icon name="upload" />Importar XML de produtos</Link><p className="helper-text">Confira os dados antes de confirmar a importação. A comparação exige produtos equivalentes.</p></section>
    <section className="card"><h2>Sua conta</h2><p className="helper-text">Encerre a sessão quando terminar em um dispositivo compartilhado.</p><form action={signOut}><SubmitButton className="secondary-action full-action" pendingLabel="Saindo…">Sair da conta</SubmitButton></form></section>
  </div>;
}
import { SubmitButton } from '@/components/submit-button';
