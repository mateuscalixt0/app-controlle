"use client";

import { useState, useTransition } from "react";
import { parseNfeXml, type ParsedNfe } from "@/lib/nfe-parser";
import { importNfeXml } from "@/app/compras/actions";

export function NfeImport() {
  const [draft, setDraft] = useState<ParsedNfe | null>(null);
  const [rawXml, setRawXml] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, startTransition] = useTransition();

  async function select(file: File | undefined) {
    setError(""); setDone(""); setDraft(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || (!file.type.includes("xml") && !file.name.toLowerCase().endsWith(".xml"))) {
      setError("Escolha um XML de NF-e com até 2 MB."); return;
    }
    try {
      const content = await file.text();
      setDraft(parseNfeXml(content)); setRawXml(content); setFileName(file.name);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível ler este XML."); }
  }
  function save() {
    if (!draft || !rawXml || pending) return;
    startTransition(async () => {
      try { await importNfeXml(rawXml, fileName); setDone("NF-e importada com fornecedor, produtos e histórico de preços."); setDraft(null); setRawXml(""); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível importar a NF-e."); }
    });
  }
  return <section className="card feature-card nfe-import">
    <div><h2>Importar XML de NF-e</h2><p>O arquivo é conferido antes de salvar. A mesma chave não pode ser importada duas vezes na loja.</p>
    <label className="secondary-action file-action">Selecionar XML<input type="file" accept=".xml,application/xml,text/xml" onChange={(e) => void select(e.target.files?.[0])} disabled={pending} /></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {done && <p className="success-message" role="status">{done}</p>}
    {draft && <div className="review-card"><p className="eyebrow">CONFERIR ANTES DE SALVAR</p><p><strong>{draft.supplierName}</strong> · CNPJ {draft.supplierCnpj}</p><p>NF-e {draft.invoiceNumber} · emissão {new Intl.DateTimeFormat("pt-BR", { timeZone:"UTC" }).format(new Date(draft.issuedOn+"T00:00:00Z"))} · total R$ {Number(draft.total).toLocaleString("pt-BR",{minimumFractionDigits:2})}</p><ul>{draft.items.map((item, index) => <li key={index}>{item.name} — {item.quantity} {item.unit} × R$ {Number(item.unitPrice).toLocaleString("pt-BR",{minimumFractionDigits:2})}</li>)}</ul><button type="button" className="primary-action" onClick={save} disabled={pending}>{pending ? "Salvando importação…" : "Confirmar importação"}</button></div>}
  </section>;
}