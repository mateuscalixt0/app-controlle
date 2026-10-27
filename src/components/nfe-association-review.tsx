"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmNfeProductAssociation, createProductFromNfeSource, rejectNfeProductAssociation, resetNfeProductAssociation } from "@/app/compras/actions";

type PendingSource = { id: string; description_original: string; gtin: string | null; ncm: string | null; reference_unit: string; supplier_id: string };
type CatalogProduct = { id: string; name: string; unit: string | null };
type Candidate = { product: CatalogProduct; score: number; reason: "gtin" | "text" };
type ConfirmedSource = { id: string; description_original: string; product_name: string; supplier_name: string };

export function NfeAssociationReview({ pendingSources, confirmedSources, candidatesBySource, suppliers }: {
  pendingSources: PendingSource[]; confirmedSources: ConfirmedSource[]; candidatesBySource: Record<string, Candidate[]>; suppliers: Record<string, string>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, startTransition] = useTransition();
  if (!pendingSources.length && !confirmedSources.length) return null;
  function run(action: () => Promise<void>) {
    setError(""); setNotice("");
    startTransition(async () => { try { await action(); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o vínculo."); } });
  }
  return <section className="card nfe-review-list">
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="helper-text" role="status">{notice}</p>}
    {pendingSources.length > 0 && <><p className="eyebrow">PRODUTOS PARECIDOS ENCONTRADOS</p><h2>{pendingSources.length} {pendingSources.length === 1 ? "item precisa da sua decisão" : "itens precisam da sua decisão"}</h2>
      <p>Os demais produtos da nota foram cadastrados automaticamente porque não tinham candidatos parecidos.</p>
      <div className="nfe-review-items">{pendingSources.map((source) => {
        const candidates = candidatesBySource[source.id] ?? [];
        const selectedId = selected[source.id] ?? (candidates.length === 1 ? candidates[0].product.id : "");
        const selectedCandidate = candidates.find((candidate) => candidate.product.id === selectedId);
        return <article className="review-card" key={source.id}>
          <p><strong>Produto recebido:</strong> {source.description_original}</p><p>Fornecedor: {suppliers[source.supplier_id] ?? "Fornecedor"} · unidade {source.reference_unit}</p>
          <p className="helper-text">{source.gtin ? `GTIN ${source.gtin} · ` : ""}{source.ncm ? `NCM ${source.ncm}` : ""}</p>
          {candidates.length === 1 ? <p className="nfe-match-question">Encontrei o produto <strong>“{candidates[0].product.name}”</strong> com {candidates[0].score}% de semelhança. É o mesmo produto?</p>
            : <p className="nfe-match-question">Encontrei {candidates.length} produtos parecidos. Escolha o candidato que deseja comparar.</p>}
          <div className="nfe-candidates">{candidates.map((candidate) => <button key={candidate.product.id} type="button" className={`filter-chip${selectedId === candidate.product.id ? " active" : ""}`} onClick={() => setSelected((current) => ({ ...current, [source.id]: candidate.product.id }))} disabled={busy}>
            {candidate.product.name} · {candidate.score}%{candidate.reason === "gtin" ? " · mesmo GTIN" : ""}</button>)}</div>
          {candidates.length > 1 && <><label className="field-label" htmlFor={`product-${source.id}`}>Produto encontrado</label><select id={`product-${source.id}`} value={selectedId} onChange={(event) => setSelected((current) => ({ ...current, [source.id]: event.target.value }))} disabled={busy}>
            <option value="">Escolha um dos candidatos</option>{candidates.map((candidate) => <option key={candidate.product.id} value={candidate.product.id}>{candidate.product.name} · {candidate.score}%</option>)}</select></>}
          <div className="nfe-review-actions">
            <button type="button" className="primary-action" disabled={busy || !selectedCandidate} onClick={() => run(() => confirmNfeProductAssociation(source.id, selectedId))}>É o mesmo produto</button>
            {candidates.length === 1 ? <button type="button" className="secondary-action" disabled={busy} onClick={() => run(() => rejectNfeProductAssociation(source.id, candidates[0].product.id))}>Não é o mesmo — cadastrar separado</button>
              : <><button type="button" className="secondary-action" disabled={busy || !selectedCandidate} onClick={() => run(async () => { await rejectNfeProductAssociation(source.id, selectedId); setSelected((current) => ({ ...current, [source.id]: "" })); })}>Não é este</button>
                <button type="button" className="secondary-action" disabled={busy} onClick={() => run(() => createProductFromNfeSource(source.id))}>Nenhum deles — cadastrar separado</button></>}
            <button type="button" className="secondary-action" disabled={busy} onClick={() => { setSelected((current) => ({ ...current, [source.id]: "" })); setNotice("Item mantido para analisar depois."); }}>Analisar depois</button>
          </div>
        </article>;
      })}</div></>}
    {confirmedSources.length > 0 && <div className="nfe-confirmed-list"><p className="eyebrow">VÍNCULOS REVISÁVEIS</p><h2>Associações salvas</h2>{confirmedSources.map((source) => <div className="nfe-confirmed-row" key={source.id}>
      <span><strong>{source.description_original}</strong><small>{source.supplier_name} → {source.product_name}</small></span><button type="button" className="secondary-action" disabled={busy} onClick={() => run(() => resetNfeProductAssociation(source.id))}>Desfazer vínculo</button>
    </div>)}</div>}
  </section>;
}
