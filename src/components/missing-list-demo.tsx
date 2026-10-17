"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addMissingItemInline } from "@/app/faltas/novo/actions";
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
  const [adding, setAdding] = useState(false);
  const [addState, addAction, addingItem] = useActionState(addMissingItemInline, { error: "", success: false });
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);
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
  useEffect(() => {
    const dialog = addDialogRef.current;
    if (adding && dialog && !dialog.open) dialog.showModal();
    if (!adding && dialog?.open) dialog.close();
  }, [adding]);
  useEffect(() => {
    if (addState.success) {
      setAdding(false);
      router.refresh();
    }
  }, [addState, router]);

  function closeDialog() {
    dialogRef.current?.close();
    setSelected(null);
  }

  return (
    <>
      <button className="primary-action full-action top-action" onClick={() => setAdding(true)} type="button"><Icon name="list" /> Anotar produto faltante</button>
      <form className="missing-filters" action="/faltas" id="missing-filters" method="get" onChange={(event) => { if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit(); }}>
        <div className="search-field"><Icon name="search" /><label className="sr-only" htmlFor="missing-search">Buscar produto</label><input id="missing-search" defaultValue={queryText} name="q" placeholder="Buscar produto" type="search" /></div>
        <div className="product-filters"><label>Ordenar por<select name="sort" defaultValue={sort}><option value="newest">Mais recentes</option><option value="oldest">Mais antigos</option></select></label><label>Empresa de referência<select name="company" defaultValue={company}><option value="">Todas as empresas</option>{companies.map(name => <option value={name} key={name}>{name}</option>)}</select></label></div>
        {priority && <input name="priority" type="hidden" value={priority} />}
      </form>
      <div className="filter-row" aria-label="Filtrar por prioridade">{["", "normal", "media", "urgente"].map(value => <Link className={priority === value ? "filter-chip active" : "filter-chip"} href={`/faltas?${new URLSearchParams({ ...(queryText ? { q: queryText } : {}), ...(value ? { priority: value } : {}) })}`} key={value}>{value === "" ? "Todas" : priorityMeta[value as Priority].label}</Link>)}</div>
      <p className="results-count" aria-live="polite">{total} {total === 1 ? "produto encontrado" : "produtos encontrados"} · página {page} de {pageCount}</p>
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
      <button className="primary-action full-action missing-bottom-action" onClick={() => setAdding(true)} type="button"><Icon name="plus" /> Anotar produto</button>
      <dialog aria-labelledby="add-missing-title" className="detail-dialog add-dialog" onClose={() => setAdding(false)} ref={addDialogRef}>
        <form action={addAction} className="dialog-content add-form">
          <div className="dialog-header"><h2 id="add-missing-title">Anotar uma falta</h2><button aria-label="Fechar" className="icon-button" onClick={() => setAdding(false)} type="button"><Icon name="close" /></button></div>
          <label>Produto<input name="product" required placeholder="Ex.: Areia fina" /></label><label>Quantidade e unidade<input name="quantity" required inputMode="decimal" type="number" min="0.001" step="0.001" placeholder="Ex.: 5 sacos" /></label><label>Prioridade<select defaultValue="normal" name="priority"><option value="normal">Normal</option><option value="media">Média</option><option value="urgente">Precisa comprar</option></select></label>
          {addState.error && <p className="form-error">{addState.error}</p>}<button className="primary-action" disabled={addingItem} type="submit">{addingItem ? "Adicionando…" : "Adicionar à lista"}</button><p className="helper-text">Salvo na lista de faltas.</p>
        </form>
      </dialog>
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
