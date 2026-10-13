"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const items = [
  { href: "/boletos/novo", label: "Adicionar boleto", icon: "add-bill" as const },
  { href: "/boletos", label: "Boletos a pagar", icon: "bills" as const },
  { href: "/", label: "Início", icon: "home" as const, center: true },
  { href: "/faltas", label: "Lista de faltas", icon: "list" as const },
  { href: "/compras", label: "Compras e preços", icon: "prices" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          // A rota de adicionar boleto também começa com /boletos; exigir
          // correspondência exata aqui evita destacar os dois itens.
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || (item.href !== "/boletos" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`nav-item ${item.center ? "nav-center" : ""} ${active ? "nav-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className="nav-icon"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
