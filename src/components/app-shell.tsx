import Link from "next/link";
import { BottomNav } from "./bottom-nav";
import { Icon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="App Controle — início"><span className="brand-mark">c.</span> controle</Link>
        <div className="header-actions">
          <Link href="/minha-loja" className="icon-button" aria-label="Minha loja"><Icon name="user" /></Link>
        </div>
      </header>
      <BottomNav />
      <main id="conteudo" className="page-content">{children}</main>
    </div>
  );
}