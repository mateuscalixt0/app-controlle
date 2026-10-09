export default function SupabaseConfigurationPage() {
  return (
    <main className="app-frame">
      <section className="page-content auth-page">
        <p className="eyebrow">CONFIGURAÇÃO NECESSÁRIA</p>
        <h1>O banco ainda não está conectado</h1>
        <p className="auth-description">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nas variáveis do ambiente que publica este app e faça uma nova publicação.</p>
      </section>
    </main>
  );
}
