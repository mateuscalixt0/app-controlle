"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractBillDocument, type BillExtraction } from "@/lib/boleto-extractor";
import { parseBoletoCode } from "@/lib/boleto-code";
import { attachBillDocument, createBill } from "@/app/boletos/novo/actions";
import { Icon } from "@/components/icons";

const blank: BillExtraction = {
  supplier: "", beneficiaryDocument: "", description: "", amount: "", dueDate: "", line: "",
  uncertain: ["beneficiário", "valor", "vencimento", "descrição"],
};

export function BillDocumentImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<BillExtraction>(blank);
  const [error, setError] = useState("");
  const [ocrNotice, setOcrNotice] = useState("");
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [codeInput, setCodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [pending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<{ stop: () => void } | null>(null);

  async function choose(value: File | undefined) {
    setError(""); setOcrNotice(""); setFile(null); setData(blank);
    if (!value) return;
    setProcessing(true);
    setOcrProgress(0);
    setOcrNotice("Lendo o documento localmente. Isso pode levar alguns segundos na primeira foto.");
    try {
      const extracted = await extractBillDocument(value, setOcrProgress);
      setFile(value); setData(extracted);
      if (extracted.uncertain.length === 4) {
        setOcrNotice("Não encontramos os campos automaticamente. Confira os dados antes de salvar.");
      } else {
        setOcrNotice("Leitura concluída. Confira os dados antes de salvar.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível ler o arquivo.");
    } finally {
      setProcessing(false);
    }
  }

  function change(field: keyof BillExtraction, value: string) {
    setData((current) => ({ ...current, [field]: value, uncertain: current.uncertain.filter((item) => item !== field) }));
  }

  function applyCode(value: string) {
    const parsed = parseBoletoCode(value);
    setCodeInput(parsed.line);
    if (!parsed.valid) {
      setError(parsed.error ?? "Não foi possível validar o código.");
      return;
    }
    setError("");
    setData({ ...blank, line: parsed.line, amount: parsed.amount, dueDate: parsed.dueDate, uncertain: ["beneficiário", "descrição"] });
    setOcrNotice("Código lido. Confira o valor, vencimento, fornecedor e descrição antes de salvar.");
  }

  function stopScanner() {
    scannerRef.current?.stop();
    scannerRef.current = null;
    setScanning(false);
  }

  async function startScanner() {
    if (scanning || pending) return;
    setError("");
    setScanning(true);
  }

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    void (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        scannerRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result) return;
          const value = result.getText();
          stopScanner();
          applyCode(value);
        });
      } catch (reason) {
        if (!cancelled) {
          stopScanner();
          setError(reason instanceof Error ? `Não foi possível abrir a câmera: ${reason.message}` : "Não foi possível abrir a câmera.");
        }
      }
    })();
    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current = null;
    };
  }, [scanning]);

  function chooseFromInput(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.currentTarget.value = "";
    void choose(selected);
  }

  function save() {
    if ((!file && !data.line) || pending) return;
    startTransition(async () => {
      let uploadedPath: string | null = null;
      try {
        const bill = await createBill({
          supplier: data.supplier, description: data.description, amount: data.amount, dueDate: data.dueDate,
          beneficiaryDocument: data.beneficiaryDocument, digitableLine: data.line,
        });
        if (file) {
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
        }
        router.push("/boletos");
        router.refresh();
      } catch (reason) {
        if (uploadedPath) await createClient().storage.from("bill-documents").remove([uploadedPath]);
        setError(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      }
    });
  }

  return <section className="card document-flow">
    <h2>Enviar boleto</h2>
    <p>Leia o código de barras pela câmera, digite a linha ou envie um PDF/imagem.</p>
    <form className="code-entry" onSubmit={(event) => { event.preventDefault(); applyCode(codeInput); }}>
      <label htmlFor="boleto-code">Código de barras ou linha digitável</label>
      <input id="boleto-code" inputMode="numeric" value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="44, 47 ou 48 dígitos" />
      <button className="secondary-action" disabled={pending || processing || scanning} type="submit">Usar código</button>
    </form>
    <div className="document-source-actions" aria-label="Escolher origem do documento">
      <label className="secondary-action document-source-action">
        <Icon name="upload" />
        <span>Arquivo</span>
        <input
          className="sr-only"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={chooseFromInput}
          disabled={pending || processing}
        />
      </label>
      <button className="secondary-action document-source-action" disabled={pending || processing || scanning} onClick={() => void startScanner()} type="button">
        <Icon name="camera" />
        <span>Câmera</span>
      </button>
    </div>
    {scanning && <div className="barcode-scanner"><video autoPlay muted playsInline ref={videoRef} /><button className="secondary-action" onClick={stopScanner} type="button">Cancelar leitura</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {ocrNotice && <p className="helper-box" role="status">{ocrNotice}{processing && ` ${ocrProgress}%`}</p>}
    {(file || data.line) && <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <p className="eyebrow">CONFERIR ANTES DE SALVAR</p>
      <label>Beneficiário/fornecedor<input required value={data.supplier} onChange={(event) => change("supplier", event.target.value)} /></label>
      <label>CPF/CNPJ do beneficiário<input value={data.beneficiaryDocument} onChange={(event) => change("beneficiaryDocument", event.target.value)} /></label>
      <label>Descrição<input required value={data.description} onChange={(event) => change("description", event.target.value)} /></label>
      <label>Valor (R$)<input required inputMode="decimal" value={data.amount} onChange={(event) => change("amount", event.target.value)} /></label>
      <label>Vencimento<input required type="date" value={data.dueDate} onChange={(event) => change("dueDate", event.target.value)} /></label>
      {data.line && <p className="helper-text">Linha digitável encontrada: {data.line}</p>}
      <button className="primary-action" disabled={pending || processing || scanning} type="submit">{pending ? "Salvando boleto…" : "Salvar boleto"}</button>
    </form>}
  </section>;
}
