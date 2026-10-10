"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractBillDocument, type BillExtraction } from "@/lib/boleto-extractor";
import { attachBillDocument, createBill } from "@/app/boletos/novo/actions";

const blank: BillExtraction = {
  supplier: "", beneficiaryDocument: "", description: "", amount: "", dueDate: "", line: "",
  uncertain: ["beneficiário", "valor", "vencimento", "descrição"],
};

export function BillDocumentImport() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<BillExtraction>(blank);
  const [error, setError] = useState("");
  const [ocrNotice, setOcrNotice] = useState("");
  const [pending, startTransition] = useTransition();

  async function choose(value: File | undefined) {
    setError(""); setOcrNotice(""); setFile(null); setData(blank);
    if (!value) return;
    try {
      const extracted = await extractBillDocument(value);
      setFile(value); setData(extracted);
      if (value.type !== "application/pdf" || extracted.uncertain.length === 4) {
        setOcrNotice("Este documento precisa de OCR. Nenhum serviço externo foi ativado: a escolha exige registrar dependência, custo e aprovação antes de enviar arquivos.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível ler o arquivo.");
    }
  }

  function change(field: keyof BillExtraction, value: string) {
    setData((current) => ({ ...current, [field]: value, uncertain: current.uncertain.filter((item) => item !== field) }));
  }

  function save() {
    if (!file || pending) return;
    startTransition(async () => {
      let uploadedPath: string | null = null;
      try {
        const bill = await createBill({
          supplier: data.supplier, description: data.description, amount: data.amount, dueDate: data.dueDate,
          beneficiaryDocument: data.beneficiaryDocument, digitableLine: data.line,
        });
        const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
        uploadedPath = `${bill.storeId}/${bill.billId}/${crypto.randomUUID()}.${extension}`;
        const client = createClient();
        const { error: uploadError } = await client.storage.from("bill-documents").upload(uploadedPath, file, {
          contentType: file.type, upsert: false,
        });
        if (uploadError) throw new Error("O boleto foi salvo, mas o upload do documento falhou.");

        await attachBillDocument({
          billId: bill.billId, storagePath: uploadedPath, originalName: file.name,
          contentType: file.type, sizeBytes: file.size,
        });
        window.location.assign("/boletos");
      } catch (reason) {
        if (uploadedPath) await createClient().storage.from("bill-documents").remove([uploadedPath]);
        setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      }
    });
  }

  return <section className="card document-flow">
    <h2>Enviar boleto</h2>
    <p>PDF, JPG ou PNG até 10 MB. Nenhum dado ausente é inventado.</p>
    <label className="secondary-action file-action">
      Escolher arquivo ou foto
      <input type="file" accept="application/pdf,image/jpeg,image/png" capture="environment" onChange={(event) => void choose(event.target.files?.[0])} disabled={pending} />
    </label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {ocrNotice && <p className="helper-box">{ocrNotice}</p>}
    {file && <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <p className="eyebrow">CONFERIR ANTES DE SALVAR</p>
      <label>Beneficiário/fornecedor<input required value={data.supplier} onChange={(event) => change("supplier", event.target.value)} /></label>
      <label>CPF/CNPJ do beneficiário<input value={data.beneficiaryDocument} onChange={(event) => change("beneficiaryDocument", event.target.value)} /></label>
      <label>Descrição<input required value={data.description} onChange={(event) => change("description", event.target.value)} /></label>
      <label>Valor (R$)<input required inputMode="decimal" value={data.amount} onChange={(event) => change("amount", event.target.value)} /></label>
      <label>Vencimento<input required type="date" value={data.dueDate} onChange={(event) => change("dueDate", event.target.value)} /></label>
      {data.line && <p className="helper-text">Linha digitável encontrada: {data.line}</p>}
      <button className="primary-action" disabled={pending} type="submit">{pending ? "Salvando boleto…" : "Salvar boleto e documento"}</button>
    </form>}
  </section>;
}