export function LoginView({ erro, action }: { erro?: string; action: (form: FormData) => void | Promise<void> }) {
  return (
    <main id="conteudo" className="auth-page">
      <div className="login-brand" aria-label="App Controle"><span>c.</span> controle</div>
      <h1>Entre na sua conta</h1>
      <p className="auth-description">Acesse os dados da sua loja com segurança.</p>
      <form className="auth-form" action={action}>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
        {erro && <p className="form-error" role="alert">E-mail ou senha inválidos.</p>}
        <button className="primary-action full-action" type="submit">Entrar</button>
      </form>
      <p className="helper-box">Use o e-mail e a senha cadastrados para acessar sua loja.</p>
    </main>
  );
}
