import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Controle",
  description: "Boletos e compras organizados para sua loja.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const supabase = isConfigured ? await createClient() : null;
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        {user ? <AppShell>{children}</AppShell> : children}
      </body>
    </html>
  );
}
