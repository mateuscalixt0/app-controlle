"use client";

import { useState, useTransition } from "react";
import { Spinner } from "./loading-indicator";
import { useRouter } from "next/navigation";
import { parseNfeXml, type ParsedNfe } from "@/lib/nfe-parser";
import { importNfeXml } from "@/app/compras/actions";

export function NfeImport() {
  const router = useRouter();
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
      try { await importNfeXml(rawXml, fileName); setDone("NF-e importada. Revise os vínculos abaixo para liberar os preços nas comparações."); setDraft(null); setRawXml(""); router.refresh(); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível importar a NF-e."); }
    });
  }
  return <section className="card feature-card nfe-import">
    <div><h2>Importar XML de NF-e</h2><p>O arquivo é conferido antes de salvar. Produtos não são associados por semelhança de descrição. A mesma nota não pode ser importada duas vezes na loja, mesmo sem chave de acesso.</p>
    <label className="secondary-action file-action">Selecionar XML<input type="file" accept=".xml,application/xml,text/xml" onChange={(e) => void select(e.target.files?.[0])} disabled={pending} /></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {done && <p className="success-message" role="status">{done}</p>}
    {draft && <div className="review-card"><p className="eyebrow">CONFERIR ANTES DE SALVAR</p><p><strong>{draft.supplierName}</strong> · CNPJ {draft.supplierCnpj}</p><p>NF-e {draft.invoiceNumber} · emissão {new Intl.DateTimeFormat("pt-BR", { timeZone:"UTC" }).format(new Date(draft.issuedOn+"T00:00:00Z"))} · total R$ {Number(draft.total).toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>{draft.accessKey ? <p>Chave de acesso: {draft.accessKey}</p> : <p>A chave de acesso não veio no arquivo; a nota será identificada pelo CNPJ do fornecedor, modelo, série, número e data.</p>}<ul>{draft.items.map((item) => <li key={item.number}><strong>{item.name}</strong> — {item.quantity} {item.unit} × R$ {Number(item.unitPrice).toLocaleString("pt-BR",{minimumFractionDigits:2})}<br />Item {item.number}{item.supplierCode ? ` · código ${item.supplierCode}` : ""}{item.gtin ? ` · GTIN ${item.gtin}` : " · sem GTIN válido"}{item.ncm ? ` · NCM ${item.ncm}` : ""}</li>)}</ul><p>Após importar, cada produto aguardará sua confirmação para liberar o preço no histórico comparável.</p><button type="button" className="primary-action" onClick={save} disabled={pending}>{pending && <Spinner />}{pending ? "Salvando importação…" : "Confirmar importação"}</button></div>}
  </section>;
}
