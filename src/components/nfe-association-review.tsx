"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmNfeProductAssociation, createProductFromNfeSource, rejectNfeProductAssociation, resetNfeProductAssociation } from "@/app/compras/actions";
import { normalizeProductDescription } from "@/lib/nfe-parser";

type PendingSource = { id: string; description_original: string; description_normalized: string; gtin: string | null; ncm: string | null; reference_unit: string; supplier_id: string };
type CatalogProduct = { id: string; name: string; unit: string | null };
type ConfirmedSource = { id: string; description_original: string; product_name: string; supplier_name: string };

function suggestedProducts(source: PendingSource, products: CatalogProduct[], confirmedGtins: Record<string, string>, rejectedPairs: Set<string>) {
  const normalized = normalizeProductDescription(source.description_normalized);
  const tokens = new Set(normalized.split(/[^A-Z0-9/]+/).filter((token) => token.length > 1 && !["PARA", "COM", "SEM"].includes(token)));
  const measures = normalized.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g) ?? [];
  if (!tokens.size) return [];
  return products.flatMap((product) => {
    if (rejectedPairs.has(`${source.id}:${product.id}`)) return [];
    if (!product.unit || product.unit.trim().toUpperCase() !== source.reference_unit.trim().toUpperCase()) return [];
    const candidate = normalizeProductDescription(product.name);
    const candidateMeasures = candidate.match(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/g) ?? [];
    if (measures.join("|") !== candidateMeasures.join("|")) return [];
    const candidateTokens = new Set(candidate.split(/[^A-Z0-9/]+/).filter((token) => token.length > 1 && !["PARA", "COM", "SEM"].includes(token)));
    const overlap = [...tokens].filter((token) => candidateTokens.has(token)).length;
    const score = source.gtin && confirmedGtins[source.gtin] === product.id ? 100 : Math.round(100 * overlap / Math.max(tokens.size, candidateTokens.size));
    return score >= 25 ? [{ product, score }] : [];
  }).sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "pt-BR")).slice(0, 3);
}

export function NfeAssociationReview({ pendingSources, confirmedSources, confirmedGtins, conflictingGtins, rejectedPairs, suppliers, products }: { pendingSources: PendingSource[]; confirmedSources: ConfirmedSource[]; confirmedGtins: Record<string, string>; conflictingGtins: string[]; rejectedPairs: string[]; suppliers: Record<string, string>; products: CatalogProduct[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, startTransition] = useTransition();
  if (!pendingSources.length && !confirmedSources.length) return null;
  function run(action: () => Promise<void>) {
    setError("");
    setNotice("");
    startTransition(async () => {
      try { await action(); router.refresh(); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o vínculo."); }
    });
  }
  const rejected = new Set(rejectedPairs);
  return <section className="card nfe-review-list">
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="helper-text" role="status">{notice}</p>}
    {conflictingGtins.length > 0 && <p className="form-error" role="alert">Há {conflictingGtins.length} GTIN {conflictingGtins.length === 1 ? "associado" : "associados"} a produtos diferentes. Esses códigos não serão usados nas sugestões até que os vínculos sejam revisados.</p>}
    {pendingSources.length > 0 && <>
    <p className="eyebrow">REVISÃO NECESSÁRIA</p><h2>{pendingSources.length} {pendingSources.length === 1 ? "origem de produto pendente" : "origens de produto pendentes"}</h2>
    <p>Os preços destes itens ficam fora das comparações até você confirmar o produto correspondente.</p>
    <div className="nfe-review-items">{pendingSources.map((source) => {
      const suggestions = suggestedProducts(source, products, confirmedGtins, rejected);
      return <article className="review-card" key={source.id}>
      <p><strong>{source.description_original}</strong></p><p>Fornecedor: {suppliers[source.supplier_id] ?? "Fornecedor"} · unidade {source.reference_unit}</p>
      <p className="helper-text">{source.gtin ? `GTIN ${source.gtin} · ` : ""}{source.ncm ? `NCM ${source.ncm}` : ""}</p>
      {suggestions.length > 0 && <div className="nfe-candidates"><span>Sugestões para revisar — a pontuação não confirma equivalência</span>{suggestions.map(({ product, score }) => <button key={product.id} type="button" className="filter-chip" onClick={() => setSelected((current) => ({ ...current, [source.id]: product.id }))} disabled={busy}>{product.name} · {score}%</button>)}</div>}
      <label className="field-label" htmlFor={`product-${source.id}`}>Produto principal</label>
      <select id={`product-${source.id}`} value={selected[source.id] ?? ""} onChange={(event) => setSelected((current) => ({ ...current, [source.id]: event.target.value }))} disabled={busy}>
        <option value="">Escolha um produto existente</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.unit ? ` · ${product.unit}` : ""}</option>)}
      </select>
      <div className="nfe-review-actions">
        <button type="button" className="primary-action" disabled={busy || !selected[source.id]} onClick={() => run(() => confirmNfeProductAssociation(source.id, selected[source.id]))}>É o mesmo produto</button>
        <button type="button" className="secondary-action" disabled={busy} onClick={() => run(() => createProductFromNfeSource(source.id))}>Cadastrar separado</button>
        <button type="button" className="secondary-action" disabled={busy || !selected[source.id]} onClick={() => run(async () => { await rejectNfeProductAssociation(source.id, selected[source.id]); setSelected((current) => ({ ...current, [source.id]: "" })); })}>Não é o mesmo</button>
        <button type="button" className="secondary-action" disabled={busy} onClick={() => { setSelected((current) => ({ ...current, [source.id]: "" })); setNotice("Item mantido na fila para analisar depois."); }}>Analisar depois</button>
      </div>
    </article>;})}</div>
    </>}
    {confirmedSources.length > 0 && <div className="nfe-confirmed-list"><p className="eyebrow">VÍNCULOS CONFIRMADOS</p><h2>Associações salvas</h2>{confirmedSources.map((source) => <div className="nfe-confirmed-row" key={source.id}>
      <span><strong>{source.description_original}</strong><small>{source.supplier_name} → {source.product_name}</small></span>
      <button type="button" className="secondary-action" disabled={busy} onClick={() => run(() => resetNfeProductAssociation(source.id))}>Desfazer vínculo</button>
    </div>)}</div>}
  </section>;
}
