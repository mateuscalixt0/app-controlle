import Link from "next/link";
import { BottomNav } from "./bottom-nav";
import { signOut } from "@/app/login/actions";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="App Controle — início">App Controle</Link>
        <form action={signOut}><button className="shop-chip" type="submit">Sair</button></form>
      </header>
      <main id="conteudo" className="page-content">{children}</main>
      <BottomNav />
    </div>
  );
}
