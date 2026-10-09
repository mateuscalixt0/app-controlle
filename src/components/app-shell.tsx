import Link from "next/link";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="App Controle — início">App Controle</Link>
        <button className="shop-chip" type="button" disabled title="Troca de loja será implementada com o login">
          Loja Modelo
        </button>
      </header>
      <main id="conteudo" className="page-content">{children}</main>
      <BottomNav />
    </div>
  );
}
