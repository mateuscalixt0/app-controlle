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

export function MissingListDemo({ items, page, pageSize, total, queryText, priority }: {
  items: MissingListItem[]; page: number; pageSize: number; total: number; queryText: string; priority: string;
}) {
  const [selected, setSelected] = useState<MissingListItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams();
  if (queryText) query.set("q", queryText);
  if (priority) query.set("priority", priority);
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
      <form className="search-field" action="/faltas" method="get">
        <Icon name="search" />
        <label className="sr-only" htmlFor="missing-search">Buscar produto</label>
        <input id="missing-search" defaultValue={queryText} name="q" placeholder="Buscar produto" type="search" />
        {priority && <input name="priority" type="hidden" value={priority} />}
      </form>
      <div className="filter-row" aria-label="Filtrar por prioridade">
        <Link className={priority ? "filter-chip" : "filter-chip active"} href={queryText ? `/faltas?q=${encodeURIComponent(queryText)}` : "/faltas"}>Todas</Link>
        {(["normal", "media", "urgente"] as Priority[]).map((value) => {
          const params = new URLSearchParams();
          if (queryText) params.set("q", queryText);
          params.set("priority", value);
          return <Link className={priority === value ? "filter-chip active" : "filter-chip"} href={`/faltas?${params.toString()}`} key={value}>{priorityMeta[value].label}</Link>;
        })}
      </div>
      <p className="results-count" aria-live="polite">{total} {total === 1 ? "produto encontrado" : "produtos encontrados"} · página {page} de {pageCount}</p>
      <section className="stack" aria-label="Produtos faltantes">
        {items.map((item) => {
          const meta = priorityMeta[item.priority];
          return (
            <button className={`missing-card ${meta.className}`} key={item.id} onClick={() => setSelected(item)} type="button">
              <div className="row"><div><h2>{item.product_name}</h2><p>Quantidade: <strong>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</strong></p></div><Icon className="chevron" name="chevron" /></div>
              <span className={`priority-pill ${meta.className}`}>{meta.label}</span>
              <p className="empty-price">Sem histórico de preço registrado</p>
            </button>
          );
        })}
        {items.length === 0 && <div className="empty-state"><strong>{total ? "Nenhum item nesta página" : "Sua lista está vazia"}</strong><p>{total ? "Volte para uma página anterior ou ajuste os filtros." : "Anote um produto para começar sua lista."}</p></div>}
      </section>
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
      <dl className="detail-grid"><div><dt>Quantidade</dt><dd>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</dd></div><div><dt>Anotado em</dt><dd>{new Intl.DateTimeFormat("pt-BR").format(new Date(item.created_at))}</dd></div><div><dt>Categoria</dt><dd>{item.category ?? "Sem classificação"}</dd></div><div><dt>Empresa de referência</dt><dd>{item.reference_company ?? "Não informada"}</dd></div></dl>
      <p className="helper-box">Prioridade: {priorityMeta[item.priority].label}. Preços e alterações de prioridade serão conectados em uma próxima etapa.</p>
    </div>
  );
}
