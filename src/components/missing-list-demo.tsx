"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { priorityMeta, type Priority } from "@/lib/demo-data";
import { Icon } from "./icons";

export type MissingListItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  reference_company: string | null;
  priority: Priority;
  created_at: string;
};

export function MissingList({ items, page, pageSize, total, queryText, priority, sort = "newest", company = "", companies = [] }: {
  items: MissingListItem[]; page: number; pageSize: number; total: number; queryText: string; priority: string; sort?: string; company?: string; companies?: string[];
}) {
  const [selected, setSelected] = useState<MissingListItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams();
  if (queryText) query.set("q", queryText);
  if (priority) query.set("priority", priority);
  query.set("sort", sort);
  if (company) query.set("company", company);
  const suffix = query.size ? `&${query.toString()}` : "";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

  function closeDialog() {
    dialogRef.current?.close();
    setSelected(null);
  }

  return (
    <>
      <section className="missing-list-panel" aria-label="Produtos faltantes">
        {items.map((item) => {
          const meta = priorityMeta[item.priority];
          return (
            <button className={`missing-card ${meta.className}`} key={item.id} onClick={() => setSelected(item)} type="button">
              <span className="missing-checkbox" aria-hidden="true" /><div className="missing-card-copy"><h2>{item.product_name}</h2><p>{item.quantity}{item.unit ? ` ${item.unit}` : ""} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(item.created_at))}</p><p>{item.reference_company ? `Empresa: ${item.reference_company}` : "Sem empresa de referência"}</p><span className={`priority-pill ${meta.className}`}>{meta.label}</span></div><Icon className="chevron" name="chevron" />
            </button>
          );
        })}
        {items.length === 0 && <div className="empty-state"><strong>{total || queryText || priority || company ? "Nenhum produto encontrado" : "Sua lista está vazia"}</strong><p>{total || queryText || priority || company ? "Volte para uma página anterior ou ajuste os filtros." : "Anote um produto para começar sua lista."}</p></div>}
      </section>
      <Link className="primary-action full-action missing-bottom-action" href="/faltas/novo"><Icon name="list" /> Anotar produto</Link>
      {pageCount > 1 && <nav className="pagination" aria-label="Paginação">
        {page > 1 && <Link className="secondary-action" href={`/faltas?page=${page - 1}${suffix}`}>Anterior</Link>}
        {page < pageCount && <Link className="secondary-action" href={`/faltas?page=${page + 1}${suffix}`}>Próxima</Link>}
      </nav>}
      <dialog aria-labelledby="detail-title" className="detail-dialog" onClose={() => setSelected(null)} ref={dialogRef}>
        {selected && <ProductDetail item={selected} onClose={closeDialog} />}
      </dialog>
    </>
  );
}

function ProductDetail({ item, onClose }: { item: MissingListItem; onClose: () => void }) {
  return (
    <div className="dialog-content">
      <div className="dialog-header"><div><p className="eyebrow">DETALHES DO ITEM</p><h2 id="detail-title">{item.product_name}</h2></div><button autoFocus aria-label="Fechar detalhes" className="icon-button" onClick={onClose} type="button"><Icon name="close" /></button></div>
      <dl className="detail-grid"><div><dt>Quantidade</dt><dd>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</dd></div><div><dt>Anotado em</dt><dd>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(item.created_at))}</dd></div><div><dt>Categoria</dt><dd>{item.category ?? "Sem classificação"}</dd></div><div><dt>Empresa de referência</dt><dd>{item.reference_company ?? "Não informada"}</dd></div></dl>
      <section className="empty-state comparison-empty"><h3>Comparação de preços</h3><p>As lojas e o menor preço aparecerão após vincular este item a produtos equivalentes do histórico. Nenhum preço é estimado.</p></section><p className="helper-text">Empresa de referência é uma anotação, não uma confirmação de venda ou disponibilidade. Preço histórico não garante uma oferta atual.</p>
    </div>
  );
}
