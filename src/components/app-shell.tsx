import Link from "next/link";
import { BottomNav } from "./bottom-nav";
import { signOut } from "@/app/login/actions";
import { Icon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="App Controle — início">App <span>Controle</span></Link>
        <div className="header-actions">
          <span aria-hidden="true" className="header-notification"><Icon name="bell" /><i /></span>
          <form action={signOut}><button aria-label="Sair da conta" className="shop-chip" type="submit"><Icon name="user" /></button></form>
        </div>
      </header>
      <main id="conteudo" className="page-content">{children}</main>
      <BottomNav />
    </div>
  );
}