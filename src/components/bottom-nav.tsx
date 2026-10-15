"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const items = [
  { href: "/", label: "Início", icon: "home" as const },
  { href: "/boletos", label: "Boletos", icon: "bills" as const },
  { href: "/faltas", label: "Faltas", icon: "list" as const },
  { href: "/minha-loja", label: "Minha loja", icon: "user" as const },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === "/minha-loja" && pathname.startsWith("/compras"));

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`nav-item ${active ? "nav-active" : ""}`}
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
