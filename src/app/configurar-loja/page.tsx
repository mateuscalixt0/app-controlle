import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/supabase/session";
import { createStore } from "./actions";

export default async function SetupStorePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.storeId) redirect("/");
  const { erro } = await searchParams;

  return (
    <section className="auth-page">
      <p className="eyebrow">PRIMEIRO ACESSO</p>
      <h1>Cadastre sua loja</h1>
      <p className="auth-description">A loja será vinculada à sua conta e os dados ficarão isolados dos demais usuários.</p>
      <form className="auth-form" action={createStore}>
        <label htmlFor="name">Nome da loja</label>
        <input id="name" name="name" autoComplete="organization" required maxLength={160} />
        {erro && <p className="form-error" role="alert">Não foi possível criar a loja. Confira o nome e tente novamente.</p>}
        <SubmitButton className="primary-action full-action" pendingLabel="Criando loja…">Criar loja</SubmitButton>
      </form>
      <p className="helper-box">Conta: {session.email}</p>
    </section>
  );
}
import { SubmitButton } from "@/components/submit-button";
