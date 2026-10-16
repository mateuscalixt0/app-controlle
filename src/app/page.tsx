import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/supabase/session';
import { getHomeSummary } from '@/lib/home-summary';
import { HomeDashboard } from '@/components/home-dashboard';

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (!session.storeId) redirect('/configurar-loja');
  return <HomeDashboard summary={await getHomeSummary(session.supabase, session.storeId)} />;
}
