import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Controle",
  description: "Boletos e compras organizados para sua loja.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
