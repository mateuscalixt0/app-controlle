"use client";

import { ProductPicker } from "./product-picker";
import { ProductPriceReport } from "./product-price-report";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addMissingItemInline, markMissingItemsBought } from "@/app/faltas/novo/actions";
import { priorityMeta, type Priority } from "@/lib/demo-data";
import { Icon } from "./icons";

export type MissingListItem = {
  id: string;
  product_name: string;
  product_id?: string | null;
  quantity: number;
  unit: string | null;
  category: string | null;
  reference_company: string | null;
  reference_companies?: string[];
  priority: Priority;
  created_at: string;
};

export function MissingList({ items, total, queryText, priority, sort = "newest", company = "", companies = [] }: {
  items: MissingListItem[]; total: number; queryText: string; priority: string; sort?: string; company?: string; companies?: string[];
}) {
  const [selected, setSelected] = useState<MissingListItem | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set());
  const [confirmingBought, setConfirmingBought] = useState(false);
  const [isMarkingBought, startMarkingBought] = useTransition();
  const [adding, setAdding] = useState(false);
  const [activeQuery, setActiveQuery] = useState(queryText);
  const [activePriority, setActivePriority] = useState(priority);
  const [activeSort, setActiveSort] = useState(sort);
  const [activeCompany, setActiveCompany] = useState(company);
  const [addState, addAction, addingItem] = useActionState(addMissingItemInline, { error: "", success: false });
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addDialogRef = useRef<HTMLDialogElement>(null);
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
      addDialogRef.current?.close();
      router.refresh();
    }
  }, [addState, router]);
  useEffect(() => {
    const params = new URLSearchParams();
    const current = new URLSearchParams(window.location.search);
    if (current.has("path")) params.set("path", current.get("path")!);
    if (activeQuery) params.set("q", activeQuery);
    if (activePriority) params.set("priority", activePriority);
    if (activeSort !== "newest") params.set("sort", activeSort);
    if (activeCompany) params.set("company", activeCompany);
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [activeCompany, activePriority, activeQuery, activeSort]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = activeQuery.trim().toLocaleLowerCase("pt-BR");
    return items
      .filter((item) => !normalizedQuery || item.product_name.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
      .filter((item) => !activePriority || item.priority === activePriority)
      .filter((item) => !activeCompany || getReferenceCompanies(item).includes(activeCompany))
      .sort((a, b) => {
        const byDate = Date.parse(a.created_at) - Date.parse(b.created_at);
        return activeSort === "oldest" ? byDate : -byDate;
      });
  }, [activeCompany, activePriority, activeQuery, activeSort, items]);

  function closeDialog() {
    dialogRef.current?.close();
    setSelected(null);
  }

  function markSelectedAsBought() {
    if (!checkedItems.size || confirmingBought || isMarkingBought) return;
    setConfirmingBought(true);
    window.setTimeout(() => {
      const form = document.getElementById("mark-missing-bought") as HTMLFormElement | null;
      if (!form) {
        setConfirmingBought(false);
        return;
      }
      startMarkingBought(() => form.requestSubmit());
    }, 450);
  }

  return (
    <>
      <button className="primary-action full-action top-action" onClick={() => setAdding(true)} type="button"><Icon name="list" /> Anotar produto faltante</button>
      <section aria-label="Resumo da lista de faltas" className="missing-summary">
        <p>Para a próxima compra</p>
        <strong>{total} {total === 1 ? "produto" : "produtos"}</strong>
        <span>Anote agora. Compare antes de comprar.</span>
      </section>
      <form className="missing-filters" id="missing-filters" onSubmit={(event) => event.preventDefault()}>
        <div className="search-field"><Icon name="search" /><label className="sr-only" htmlFor="missing-search">Buscar produto</label><input id="missing-search" name="q" onChange={(event) => setActiveQuery(event.target.value)} placeholder="Buscar produto" type="search" value={activeQuery} /></div>
        <div className="product-filters"><label>Ordenação<select aria-label="Ordenação" name="sort" onChange={(event) => setActiveSort(event.target.value)} value={activeSort}><option value="newest">Mais recentes</option><option value="oldest">Mais antigos</option></select></label><label>Empresa<select aria-label="Empresa" name="company" onChange={(event) => setActiveCompany(event.target.value)} value={activeCompany}><option value="">Todas as empresas</option>{companies.map(name => <option value={name} key={name}>{name}</option>)}</select></label></div>
      </form>
      <div className="filter-row" aria-label="Filtrar por prioridade">{["", "normal", "media", "urgente"].map(value => <button className={activePriority === value ? "filter-chip active" : "filter-chip"} onClick={() => setActivePriority(value)} type="button" key={value}>{value === "" ? "Todas" : priorityMeta[value as Priority].label}</button>)}</div>
      <p className="results-count" aria-live="polite">{visibleItems.length} {visibleItems.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
      <section className="missing-list-panel" aria-label="Produtos faltantes">
        {visibleItems.map((item) => {
          const meta = priorityMeta[item.priority];
          const referenceCompanies = getReferenceCompanies(item);
          return (
            <article className={`missing-card ${meta.className}${checkedItems.has(item.id) ? " is-selected" : ""}`} key={item.id}>
              <input aria-label={`Marcar ${item.product_name} como comprado`} checked={checkedItems.has(item.id)} className="missing-checkbox" onChange={() => setCheckedItems((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} type="checkbox" />
              <button className="missing-card-copy" onClick={() => setSelected(item)} type="button"><h2>{item.product_name}</h2><p>{item.quantity}{item.unit ? ` ${item.unit}` : ""} · {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(item.created_at))}</p><p>{referenceCompanies.length ? `Vendido por: ${referenceCompanies.join(", ")}` : "Sem empresa vinculada"}</p><span className={`priority-pill ${meta.className}`}>{meta.label}</span></button><button aria-label={`Ver detalhes de ${item.product_name}`} className="chevron" onClick={() => setSelected(item)} type="button"><Icon name="chevron" /></button>
            </article>
          );
        })}
        {visibleItems.length === 0 && <div className="empty-state"><strong>{total || activeQuery || activePriority || activeCompany ? "Nenhum produto encontrado" : "Sua lista está vazia"}</strong><p>{total || activeQuery || activePriority || activeCompany ? "Ajuste os filtros para ver outros produtos." : "Anote um produto para começar sua lista."}</p></div>}
      </section>
      {checkedItems.size > 0 && <form action={markMissingItemsBought} className="missing-cart-form" id="mark-missing-bought"><input name="ids" type="hidden" value={[...checkedItems].join(",")} /><button aria-label={confirmingBought ? "Confirmando itens comprados" : `Marcar ${checkedItems.size} ${checkedItems.size === 1 ? "produto" : "produtos"} como comprados`} className={`missing-cart-action${confirmingBought ? " is-confirming" : ""}`} disabled={confirmingBought || isMarkingBought} onClick={(event) => { event.preventDefault(); markSelectedAsBought(); }} type="submit"><span className="missing-cart-icon" aria-hidden="true">{confirmingBought ? <svg aria-hidden="true" className="confirmation-check" viewBox="0 0 28 28"><path d="M4 14.5 10.5 21 24 6.5" /></svg> : <Icon name="cart" />}</span><span className="missing-cart-count">{checkedItems.size}</span></button></form>}
      <button className="primary-action full-action missing-bottom-action" onClick={() => setAdding(true)} type="button"><Icon name="plus" /> Anotar produto</button>
      <dialog aria-labelledby="add-missing-title" className="detail-dialog add-dialog" onClose={() => setAdding(false)} ref={addDialogRef}>
        <form action={addAction} className="dialog-content add-form">
          <div className="dialog-header"><h2 id="add-missing-title">Anotar uma falta</h2><button aria-label="Fechar" className="icon-button" onClick={() => setAdding(false)} type="button"><Icon name="close" /></button></div>
          <ProductPicker /><label>Quantidade e unidade<input name="quantity" required inputMode="decimal" type="number" min="0.001" step="0.001" placeholder="Ex.: 5 sacos" /></label><label>Prioridade<select defaultValue="normal" name="priority"><option value="normal">Normal</option><option value="media">Média</option><option value="urgente">Precisa comprar</option></select></label>
          {addState.error && <p className="form-error">{addState.error}</p>}<button className="primary-action" disabled={addingItem} type="submit">{addingItem ? "Adicionando…" : "Adicionar à lista"}</button><p className="helper-text">Salvo na lista de faltas.</p>
        </form>
      </dialog>
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
      <div className="product-detail-intro"><span>{item.category ?? "Sem classificação"}</span><p>{item.quantity} {item.unit ?? "unidades"} necessárias</p></div>
      <dl className="detail-grid"><div><dt>Anotado em</dt><dd>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(item.created_at))}</dd></div><div><dt>Empresas com histórico</dt><dd>{getReferenceCompanies(item).join(", ") || "Nenhuma vinculada"}</dd></div></dl>
      <ProductPriceReport key={item.id} productId={item.product_id} />
      {item.product_id && <Link className="primary-action full-action" href={`/produtos/${encodeURIComponent(item.product_id)}`}> <Icon name="prices" /> Ver comparação de preços</Link>}
    </div>
  );
}

function getReferenceCompanies(item: MissingListItem) {
  return item.reference_companies?.length ? item.reference_companies : item.reference_company ? [item.reference_company] : [];
}
