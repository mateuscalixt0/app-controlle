"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { demoMissingItems, priorityMeta, type Priority } from "@/lib/demo-data";
import { DemoNotice } from "./demo-notice";
import { Icon } from "./icons";

type Item = (typeof demoMissingItems)[number];

const histories: Record<string, { supplier: string; price: string; unit: string; date: string; source: string }[]> = {
  "cimento-cp2": [
    { supplier: "Obra Forte", price: "R$ 33,50", unit: "saco 50 kg", date: "15/09/2026", source: "NF-e conferida" },
    { supplier: "Depósito Central", price: "R$ 31,90", unit: "saco 50 kg", date: "02/10/2026", source: "NF-e conferida" },
  ],
  "tubo-pvc": [
    { supplier: "Casa do Encanador", price: "R$ 68,40", unit: "barra 6 m", date: "28/09/2026", source: "Registro manual" },
  ],
  trincha: [],
};

export function MissingListDemo() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("todas");
  const [classification, setClassification] = useState("todas");
  const [selected, setSelected] = useState<Item | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const items = useMemo(() => demoMissingItems.filter((item) => {
    const matchesSearch = item.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    const matchesPriority = priority === "todas" || item.priority === priority;
    const matchesClassification = classification === "todas" || (classification === "sem" && !item.category);
    return matchesSearch && matchesPriority && matchesClassification;
  }), [classification, priority, search]);

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
      <DemoNotice>busca, filtros, modal e alteração de prioridade usam somente dados fictícios em memória; nada é salvo.</DemoNotice>
      <label className="search-field">
        <Icon name="search" />
        <span className="sr-only">Buscar produto</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto" type="search" />
      </label>
      <div className="select-grid">
        <label>Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="todas">Todas</option><option value="normal">Normal</option><option value="media">Média</option><option value="urgente">Precisa comprar</option></select></label>
        <label>Classificação<select value={classification} onChange={(event) => setClassification(event.target.value)}><option value="todas">Todas</option><option value="sem">Sem classificação</option></select></label>
      </div>
      <p className="results-count" aria-live="polite">{items.length} {items.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
      <section className="stack" aria-label="Produtos faltantes fictícios">
        {items.map((item) => {
          const meta = priorityMeta[item.priority];
          return (
            <button className={`missing-card ${meta.className}`} key={item.id} onClick={() => setSelected(item)} type="button">
              <div className="row"><div><h2>{item.name}</h2><p>Quantidade: <strong>{item.quantity}</strong></p></div><Icon className="chevron" name="chevron" /></div>
              <span className={`priority-pill ${meta.className}`}>{meta.label}</span>
              {item.bestPrice ? (
                <div className="price-box"><span>Menor preço registrado</span><strong>{item.bestPrice}</strong><small>{item.supplier} · {item.priceDate} · {item.unit}</small></div>
              ) : <p className="empty-price">Sem histórico de preço</p>}
            </button>
          );
        })}
        {items.length === 0 && <div className="empty-state"><strong>Nenhum produto encontrado</strong><p>Ajuste a busca ou os filtros para ver outros itens fictícios.</p></div>}
      </section>

      <dialog aria-labelledby="detail-title" className="detail-dialog" onClose={() => setSelected(null)} ref={dialogRef}>
        {selected && <ProductDetail item={selected} onClose={closeDialog} />}
      </dialog>
    </>
  );
}

function ProductDetail({ item, onClose }: { item: Item; onClose: () => void }) {
  const history = histories[item.id] ?? [];
  const [priority, setPriority] = useState<Priority>(item.priority);

  return (
    <div className="dialog-content">
      <div className="dialog-header"><div><p className="eyebrow">DETALHES DO ITEM</p><h2 id="detail-title">{item.name}</h2></div><button autoFocus aria-label="Fechar detalhes" className="icon-button" onClick={onClose} type="button"><Icon name="close" /></button></div>
      <DemoNotice>detalhes e histórico fictícios; alterações não são salvas.</DemoNotice>
      <dl className="detail-grid"><div><dt>Quantidade</dt><dd>{item.quantity}</dd></div><div><dt>Anotado em</dt><dd>{item.createdAt}</dd></div><div><dt>Categoria</dt><dd>{item.category ?? "Sem classificação"}</dd></div><div><dt>Empresa de referência</dt><dd>{item.referenceCompany ?? "Não informada"}</dd></div></dl>
      <label className="select-label">Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="normal">Normal</option><option value="media">Média</option><option value="urgente">Precisa comprar</option></select></label>
      <section aria-labelledby="history-title" className="history-section">
        <h3 id="history-title">Fornecedores no histórico</h3>
        <p className="helper-text">Compras anteriores não comprovam disponibilidade atual.</p>
        {history.length === 0 ? <div className="empty-state"><strong>Sem histórico de preço</strong><p>Quando houver registros compatíveis, eles aparecerão aqui.</p></div> : (
          <>
            <div className="mini-chart" role="img" aria-label={history.length === 1 ? `Um registro de ${history[0].price}` : `Histórico com ${history.length} preços ordenados por data`}>
              {history.length === 1 ? <span className="single-point">{history[0].price}</span> : <svg viewBox="0 0 260 90"><path d="M18 22 L242 65"/><circle cx="18" cy="22" r="5"/><circle cx="242" cy="65" r="5"/></svg>}
            </div>
            <div className="history-list">{history.map((entry) => <article key={`${entry.supplier}-${entry.date}`}><div className="row"><strong>{entry.supplier}</strong><strong>{entry.price}</strong></div><small>{entry.date} · {entry.unit} · {entry.source}</small></article>)}</div>
          </>
        )}
      </section>
    </div>
  );
}
