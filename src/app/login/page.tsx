import { redirect } from "next/navigation";
import { signIn } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import "./login.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: membership } = await supabase.from("store_members").select("store_id").limit(1).maybeSingle();
    if (membership) redirect("/");
    redirect("/configurar-loja");
  }
  const { erro } = await searchParams;

  return (
    <main id="conteudo" className="auth-page">
      <p className="eyebrow">APP CONTROLE</p>
      <h1>Entre na sua conta</h1>
      <p className="auth-description">Acesse os dados da sua loja com segurança.</p>
      <form className="auth-form" action={signIn}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
        {erro && <p className="form-error" role="alert">E-mail ou senha inválidos.</p>}
        <SubmitButton className="primary-action full-action" pendingLabel="Entrando…">Entrar</SubmitButton>
      </form>
      <p className="helper-box">A conta é criada pelo Supabase Auth. Não existe senha compartilhada nem usuário administrativo fixo.</p>
    </main>
  );
}
