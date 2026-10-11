"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractBillDocument, type BillExtraction } from "@/lib/boleto-extractor";
import { attachBillDocument, createBill } from "@/app/boletos/novo/actions";
import { Icon } from "@/components/icons";

const blank: BillExtraction = { supplier: "", beneficiaryDocument: "", description: "", amount: "", dueDate: "", line: "", uncertain: ["beneficiário", "valor", "vencimento", "descrição"] };

export function BillDocumentImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<BillExtraction>(blank);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pending, startTransition] = useTransition();

  async function choose(value: File | undefined) {
    setError(""); setNotice(""); setFile(null); setData(blank);
    if (!value) return;
    setProcessing(true); setNotice("Enviando o documento para leitura…");
    try {
      const extracted = await extractBillDocument(value);
      setFile(value); setData(extracted); setNotice("Leitura concluída. Confira os dados antes de salvar.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível ler o arquivo.");
    } finally { setProcessing(false); }
  }

  function change(field: keyof BillExtraction, value: string) {
    setData((current) => ({ ...current, [field]: value, uncertain: current.uncertain.filter((item) => item !== field) }));
  }

  function chooseFromInput(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]; event.currentTarget.value = ""; void choose(selected);
  }

  function save() {
    if (!file || pending) return;
    startTransition(async () => {
      let uploadedPath: string | null = null;
      try {
        const bill = await createBill({ supplier: data.supplier, description: data.description, amount: data.amount, dueDate: data.dueDate, beneficiaryDocument: data.beneficiaryDocument, digitableLine: data.line });
        const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
        uploadedPath = `${bill.storeId}/${bill.billId}/${crypto.randomUUID()}.${extension}`;
        const client = createClient();
        const { error: uploadError } = await client.storage.from("bill-documents").upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error("O boleto foi salvo, mas o upload do documento falhou.");
        await attachBillDocument({ billId: bill.billId, storagePath: uploadedPath, originalName: file.name, contentType: file.type, sizeBytes: file.size });
        router.push("/boletos"); router.refresh();
      } catch (reason) {
        if (uploadedPath) await createClient().storage.from("bill-documents").remove([uploadedPath]);
        setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      }
    });
  }

  return <section className="card document-flow">
    <h2>Enviar boleto</h2>
    <p>Envie uma foto ou arquivo para extrair os dados automaticamente.</p>
    <div className="document-source-actions" aria-label="Escolher origem do documento">
      <label className="secondary-action document-source-action"><Icon name="upload" /><span>Arquivo</span><input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={chooseFromInput} disabled={pending || processing} /></label>
      <label className="secondary-action document-source-action"><Icon name="camera" /><span>Câmera</span><input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" onChange={chooseFromInput} disabled={pending || processing} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="helper-box" role="status" aria-live="polite">{notice}</p>}
    {file && <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <p className="eyebrow">CONFERIR ANTES DE SALVAR</p>
      <label>Beneficiário/fornecedor<input required value={data.supplier} onChange={(event) => change("supplier", event.target.value)} /></label>
      <label>CPF/CNPJ do beneficiário<input value={data.beneficiaryDocument} onChange={(event) => change("beneficiaryDocument", event.target.value)} /></label>
      <label>Descrição<input required value={data.description} onChange={(event) => change("description", event.target.value)} /></label>
      <label>Valor (R$)<input required inputMode="decimal" value={data.amount} onChange={(event) => change("amount", event.target.value)} /></label>
      <label>Vencimento<input required type="date" value={data.dueDate} onChange={(event) => change("dueDate", event.target.value)} /></label>
      {data.line && <p className="helper-text">Linha digitável encontrada: {data.line}</p>}
      <button className="primary-action" disabled={pending || processing} type="submit">{pending ? "Salvando boleto…" : "Salvar boleto"}</button>
    </form>}
  </section>;
}
