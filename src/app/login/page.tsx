import { LoginView } from '@/components/login-view';
import { redirect } from "next/navigation";
import { signIn } from "./actions";
import { getCurrentSession } from "@/lib/supabase/session";
import "./login.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const session = await getCurrentSession();
  if (session) {
    if (session.storeId) redirect("/");
    redirect("/configurar-loja");
  }
  const { erro } = await searchParams;

  return <LoginView erro={erro} action={signIn} />;
}
