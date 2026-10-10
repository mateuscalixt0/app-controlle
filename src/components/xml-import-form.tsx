"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

type ParsedItem = { name: string; quantity: string; unit: string; unit_price: string };
type ParsedNfe = { access_key: string; supplier_name: string; issued_on: string | null; original_name: string; items: ParsedItem[] };

function textIn(element: Element, name: string) {
  return element.getElementsByTagNameNS("*", name)[0]?.textContent?.trim() ?? "";
}

function parseNfe(file: File, xml: string): ParsedNfe {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("O XML contém uma estrutura não permitida.");
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("Não foi possível ler este XML.");

  const info = document.getElementsByTagNameNS("*", "infNFe")[0];
  const issuer = document.getElementsByTagNameNS("*", "emit")[0];
  if (!info || !issuer) throw new Error("Este arquivo não é uma NF-e compatível.");

  const accessKey = (info.getAttribute("Id") ?? "").replace(/^NFe/, "");
  const supplierName = textIn(issuer, "xNome");
  const issuedRaw = textIn(document.documentElement, "dhEmi") || textIn(document.documentElement, "dEmi");
  const issuedOn = /^\d{4}-\d{2}-\d{2}/.test(issuedRaw) ? issuedRaw.slice(0, 10) : null;
  const items = Array.from(document.getElementsByTagNameNS("*", "det")).map((detail) => {
    const product = detail.getElementsByTagNameNS("*", "prod")[0];
    return {
      name: product ? textIn(product, "xProd") : "",
      quantity: product ? textIn(product, "qCom") : "",
      unit: product ? textIn(product, "uCom") : "",
      unit_price: product ? textIn(product, "vUnCom") : "",
    };
  }).filter((item) => item.name && item.quantity && item.unit && item.unit_price);

  if (!/^\d{44}$/.test(accessKey) || !supplierName || items.length === 0 || items.length > 100) {
    throw new Error("A nota não contém os dados necessários para importar produtos e preços.");
  }

  return { access_key: accessKey, supplier_name: supplierName, issued_on: issuedOn, original_name: file.name, items };
}

export function XmlImportForm({ action, error }: { action: (formData: FormData) => void | Promise<void>; error?: string }) {
  const [parsed, setParsed] = useState<ParsedNfe | null>(null);
  const [message, setMessage] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setParsed(null);
    setMessage("");
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Escolha um XML de até 10 MB.");
      return;
    }
    try {
      setParsed(parseNfe(file, await file.text()));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível ler o XML.");
    }
  }

  return (
    <form action={action} className="card form-card">
      <input accept=".xml,application/xml,text/xml" className="file-input" id="xml-file" onChange={onChange} type="file" />
      <label className="secondary-action full-action" htmlFor="xml-file"><Icon name="upload" />Selecionar XML</label>
      {message && <p className="form-error" role="alert">{message}</p>}
      {error && <p className="form-error" role="alert">{error === "duplicada" ? "Esta NF-e já foi importada nesta loja." : "Não foi possível importar o XML. Confira os dados e tente novamente."}</p>}
      {parsed && <>
        <input name="payload" type="hidden" value={JSON.stringify(parsed)} />
        <section className="xml-preview" aria-live="polite">
          <p className="eyebrow">CONFERIR IMPORTAÇÃO</p>
          <h2>{parsed.supplier_name}</h2>
          <p>{parsed.issued_on ? `Emissão: ${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${parsed.issued_on}T00:00:00Z`))}` : "Data de emissão não encontrada"} · {parsed.items.length} {parsed.items.length === 1 ? "item" : "itens"}</p>
          <ul>{parsed.items.slice(0, 5).map((item, index) => <li key={`${item.name}-${index}`}>{item.name} — {item.quantity} {item.unit} · R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</li>)}</ul>
          {parsed.items.length > 5 && <p>e mais {parsed.items.length - 5} itens.</p>}
        </section>
        <SubmitButton className="primary-action full-action" pendingLabel="Importando XML…">Confirmar importação</SubmitButton>
      </>}
    </form>
  );
}
