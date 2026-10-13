'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { extractBillDocument, emptyExtraction, validateBillFile, type BillExtraction } from '@/lib/boleto-extractor';
import { parseBoletoCode } from '@/lib/boleto-code';
import { extractBoletoText } from '@/lib/boleto-text';
import { attachBillDocument, createBill, createSupplier } from '@/app/boletos/novo/actions';
import { BillBarcodeScanner } from './bill-barcode-scanner';
import { Icon } from '@/components/icons';

type SupplierSuggestion = { id: string; name: string; document: string | null };

export function BillDocumentImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<BillExtraction>(emptyExtraction);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState<SupplierSuggestion[]>([]);
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [pending, startTransition] = useTransition();
  const operation = useRef<AbortController | null>(null);
  const saveId = useRef<string | null>(null);
  const pathId = useRef<string | null>(null);
  useEffect(() => () => operation.current?.abort(), []);

  useEffect(() => {
    const query = data.supplier.trim();
    if (!query || processing || saved) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/fornecedores?q=${encodeURIComponent(query)}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json() as { suppliers?: SupplierSuggestion[] };
        if (!controller.signal.aborted) setSupplierSuggestions(payload.suppliers ?? []);
      } catch {
        if (!controller.signal.aborted) setSupplierSuggestions([]);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [data.supplier, processing, saved]);

  const choose = useCallback(async (value: File | undefined, code?: string) => {
    if (!value) return;
    operation.current?.abort();
    const controller = new AbortController(); operation.current = controller;
    setError(''); setNotice('');
    try { await validateBillFile(value); } catch (reason) { setError((reason as Error).message); return; }
    if (controller.signal.aborted) return;
    setScanning(false); setFile(value); setSaved(false); saveId.current = crypto.randomUUID(); pathId.current = crypto.randomUUID();
    const seed = extractBoletoText('', code ? [code] : []);
    setData(seed); setProcessing(true); setNotice('Preparando leitura…');
    // A bound on total work protects mobile devices; original and partial results stay available.
    const timeout = setTimeout(() => controller.abort(), 180_000);
    const merge = (result: BillExtraction) => {
      if (!controller.signal.aborted) setData(result);
    };
    try {
      const result = await extractBillDocument(value, { initialCode: code, signal: controller.signal, onPartial: merge, onProgress: message => { if (!controller.signal.aborted) setNotice(message); } });
      merge(result); setNotice('Confira os dados lidos e preencha os campos que faltam. O original será guardado ao salvar.');
    } catch {
      if (operation.current === controller) setNotice(controller.signal.aborted ? 'Leitura interrompida. O arquivo foi mantido; complete os dados abaixo.' : 'Não foi possível ler todos os dados. O arquivo foi mantido; preencha os campos abaixo. PDFs protegidos precisam de uma cópia sem senha para leitura automática.');
    } finally { clearTimeout(timeout); if (operation.current === controller) setProcessing(false); }
  }, []);
  const capture = useCallback((value: File, code?: string) => { void choose(value, code); }, [choose]);

  function change(field: keyof BillExtraction, value: string) { setData(current => ({ ...current, [field]: value })); }
  function applyCode() {
    setError('');
    try {
      const parsed = parseBoletoCode(data.line);
      setData(current => ({ ...current, line: parsed.code, amount: parsed.amount || current.amount, dueDate: current.dueDate || (parsed.dueDates.length === 1 ? parsed.dueDates[0] : ''), warnings: parsed.dueDates.length > 1 ? ['Confira o vencimento impresso: o código admite mais de um ciclo de datas.'] : [] }));
    } catch (reason) { setError((reason as Error).message); }
  }
  function save() {
    if (!file || pending || processing) return;
    setError('');
    if (data.line) { try { parseBoletoCode(data.line); } catch (reason) { setError((reason as Error).message); return; } }
    startTransition(async () => {
      try {
        const bill = await createBill({ id: saveId.current!, supplier: data.supplier, description: data.description || 'Boleto', amount: data.amount, dueDate: data.dueDate, beneficiaryDocument: data.beneficiaryDocument, digitableLine: data.line });
        setSaved(true);
        const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
        const storagePath = `${bill.storeId}/${bill.billId}/${pathId.current}.${extension}`;
        const { error: uploadError } = await createClient().storage.from('bill-documents').upload(storagePath, file, { contentType: file.type, upsert: false });
        // A previous attempt may have uploaded successfully but lost the response. The server verifies it.
        if (uploadError && !['409', '400'].includes(String(uploadError.statusCode))) throw new Error('O boleto foi salvo, mas o arquivo ainda não. Mantenha esta tela aberta e tente novamente.');
        await attachBillDocument({ billId: bill.billId, storagePath, originalName: file.name, contentType: file.type, sizeBytes: file.size });
        router.push('/boletos'); router.refresh();
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar. Tente novamente nesta tela.'); }
    });
  }
  return <section className="card document-flow">
    <h2>Enviar boleto</h2><p>Leia pela câmera ou envie PDF, JPG ou PNG de até 10 MB.</p>
    <div className="document-source-actions" aria-label="Escolher origem do documento">
      <label className="secondary-action document-source-action"><Icon name="upload" /><span>Arquivo</span><input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => { const selected = event.target.files?.[0]; event.currentTarget.value = ''; void choose(selected); }} disabled={pending || processing || saved || scanning} /></label>
      <button type="button" className="secondary-action document-source-action" disabled={pending || processing || saved || scanning} onClick={() => setScanning(true)}><Icon name="camera" /><span>Câmera</span></button>
    </div>
    {scanning && <BillBarcodeScanner onCapture={capture} onClose={() => setScanning(false)} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="helper-box read-notice" role="status" aria-live="polite">{notice}</p>}
    {processing && <button className="secondary-action" type="button" onClick={() => operation.current?.abort()}>Interromper e preencher manualmente</button>}
    {file && <form className="form-card review-form" onSubmit={event => { event.preventDefault(); save(); }}>
      <p className="eyebrow">CONFERIR ANTES DE SALVAR</p>
      <p className="document-filename">Arquivo: {file.name}</p>
      {data.warnings.map(warning => <p className="helper-box" key={warning}>{warning}</p>)}
      <fieldset disabled={pending || processing || saved || scanning} className="review-fields">
        <label className="supplier-field">Para quem vai pagar (beneficiário)
          <input required maxLength={160} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={supplierSearchOpen} aria-controls="supplier-suggestions" value={data.supplier} onFocus={() => setSupplierSearchOpen(true)} onBlur={() => window.setTimeout(() => setSupplierSearchOpen(false), 120)} onChange={event => { change('supplier', event.target.value); setSupplierSuggestions([]); setSupplierSearchOpen(true); }} />
          {supplierSearchOpen && data.supplier.trim() && <div className="supplier-suggestions" id="supplier-suggestions" role="listbox" onMouseDown={event => event.preventDefault()}>
            {supplierSuggestions.map(supplier => <button type="button" role="option" aria-selected="false" className="supplier-suggestion" key={supplier.id} onClick={() => { change('supplier', supplier.name); setSupplierSearchOpen(false); }}><strong>{supplier.name}</strong>{supplier.document && <small>{supplier.document}</small>}</button>)}
            {supplierSuggestions.length === 0 && <button type="button" role="option" aria-selected="false" className="supplier-create" disabled={creatingSupplier} onClick={async () => {
              const name = data.supplier.trim();
              if (!name) return;
              setCreatingSupplier(true);
              try {
                const supplier = await createSupplier(name);
                setSupplierSuggestions([supplier]);
                change('supplier', supplier.name);
                setSupplierSearchOpen(false);
                setNotice(`Fornecedor “${supplier.name}” criado e disponível para boletos e produtos.`);
              } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível criar o fornecedor.'); }
              finally { setCreatingSupplier(false); }
            }}><span aria-hidden="true">＋</span><strong>{creatingSupplier ? 'Criando fornecedor…' : `Criar fornecedor “${data.supplier.trim()}”`}</strong><small>Ficará disponível para boletos e produtos</small></button>}
          </div>}
        </label>
        <label>Valor (R$)<input required inputMode="decimal" placeholder="0,00" value={data.amount} onChange={event => change('amount', event.target.value)} /></label>
        <label>Vencimento<input required type="date" value={data.dueDate} onChange={event => change('dueDate', event.target.value)} /></label>
        <label>Código de barras ou linha digitável<input inputMode="numeric" maxLength={80} value={data.line} onChange={event => change('line', event.target.value)} aria-describedby="code-help" /></label>
        <p className="helper-text" id="code-help">Se não foi lido, digite os números. Se estiver ilegível, você pode salvar sem código.</p>
        <button type="button" className="secondary-action" onClick={applyCode} disabled={!data.line}>Ler dados do código</button>
        <details><summary>Outros dados (opcional)</summary><label>CPF/CNPJ do beneficiário<input inputMode="numeric" value={data.beneficiaryDocument} onChange={event => change('beneficiaryDocument', event.target.value)} /></label><label>Descrição<input maxLength={240} value={data.description} onChange={event => change('description', event.target.value)} /></label></details>
      </fieldset>
      {saved && <p role="status" className="helper-box">Boleto cadastrado. Se o anexo falhar, tente novamente aqui para concluir sem duplicar o boleto.</p>}
      <button className="primary-action" disabled={pending || processing || scanning} type="submit">{pending ? 'Salvando boleto e arquivo…' : saved ? 'Tentar guardar arquivo novamente' : 'Confirmar e salvar boleto'}</button>
    </form>}
  </section>;
}
