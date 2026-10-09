import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Controle",
  description: "Boletos e compras organizados para sua loja.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        {user ? <AppShell>{children}</AppShell> : children}
      </body>
    </html>
  );
}
