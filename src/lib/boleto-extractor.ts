import { validateBillFile } from './bill-file';
export { validateBillFile } from './bill-file';
import { emptyExtraction, extractBoletoText } from './boleto-text';
import { parseBoletoCode } from './boleto-code';
export type { BillExtraction } from './boleto-text';
export { emptyExtraction } from './boleto-text';

export async function makeBarcodeReader() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType, ITFReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
  // RGBLuminanceSource avoids a canvas-rotation bug in the browser adapter.
  // Try both orientations explicitly so landscape/portrait documents work alike.
  const hints = new Map<import('@zxing/library').DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.ITF]],
    [DecodeHintType.TRY_HARDER, true],
    [DecodeHintType.ALLOWED_LENGTHS, [44]],
  ]);
  const itf = new ITFReader();
  class BillReader extends BrowserMultiFormatReader {
    decodeBitmap(bitmap: import('@zxing/library').BinaryBitmap) { return itf.decode(bitmap, hints); }
    decodeFromCanvas(canvas: HTMLCanvasElement) {
      const { width, height } = canvas;
      const pixels = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height).data;
      const gray = new Uint8ClampedArray(width * height);
      for (let i = 0; i < gray.length; i++) gray[i] = (pixels[i * 4] + 2 * pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 4;
      try { return this.decodeBitmap(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(gray, width, height)))); }
      catch {
        const rotated = new Uint8ClampedArray(gray.length);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) rotated[x * height + height - y - 1] = gray[y * width + x];
        return this.decodeBitmap(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(rotated, height, width))));
      }
    }
  }
  return new BillReader(hints, { delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 500 });
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error('Leitura interrompida. Complete os campos que faltam.'));
    if (signal.aborted) { void promise.catch(() => {}); abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

type Options = { initialCode?: string; signal: AbortSignal; onProgress: (message: string) => void; onPartial: (data: ReturnType<typeof emptyExtraction>) => void };
export async function extractBillDocument(file: File, options: Options) {
  await validateBillFile(file);
  const { signal, onProgress, onPartial } = options;
  const text: string[] = [];
  const codes: string[] = options.initialCode ? [options.initialCode] : [];
  let worker: import('tesseract.js').Worker | undefined;
  let workerPromise: Promise<import('tesseract.js').Worker> | undefined;
  let pdfTask: import('pdfjs-dist').PDFDocumentLoadingTask | undefined;
  let closed = false;
  const stop = () => { if (worker) void worker.terminate(); if (pdfTask) void pdfTask.destroy(); };
  signal.addEventListener('abort', stop, { once: true });
  let reader: Awaited<ReturnType<typeof makeBarcodeReader>>;
  async function readImage(canvas: HTMLCanvasElement, needsOCR: boolean) {
    signal.throwIfAborted();
    try { const code = reader.decodeFromCanvas(canvas).getText(); parseBoletoCode(code); codes.push(code); } catch { /* Missing barcode is a normal OCR fallback. */ }
    onPartial(extractBoletoText(text.join('\n'), codes));
    if (!needsOCR) return;
    if (!workerPromise) {
      const { createWorker } = await import('tesseract.js');
      signal.throwIfAborted();
      workerPromise = createWorker('por', 1, {
        workerPath: '/readers/tesseract/worker.min.js', corePath: '/readers/tesseract', langPath: '/readers/tesseract',
        workerBlobURL: false, logger: (m) => { if (!closed && !signal.aborted && m.status === 'recognizing text') onProgress(`Reconhecendo texto: ${Math.round(m.progress * 100)}%. Você pode interromper e preencher manualmente.`); },
      }).then(async w => { if (closed || signal.aborted) { await w.terminate(); throw new Error('Leitura interrompida.'); } worker = w; return w; });
    }
    const activeWorker = await abortable(workerPromise, signal);
    const result = await abortable(activeWorker.recognize(canvas), signal);
    text.push(result.data.text);
    onPartial(extractBoletoText(text.join('\n'), codes));
  }
  try {
    reader = await abortable(makeBarcodeReader(), signal);
    if (file.type === 'application/pdf') {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/readers/pdf/pdf.worker.min.mjs';
      signal.throwIfAborted();
      pdfTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: '/readers/pdf/cmaps/', cMapPacked: true, standardFontDataUrl: '/readers/pdf/standard_fonts/', wasmUrl: '/readers/pdf/wasm/' });
      const pdf = await abortable(pdfTask.promise, signal);
      for (let i = 1; i <= pdf.numPages; i++) {
        signal.throwIfAborted();
        onProgress(`Lendo página ${i} de ${pdf.numPages}…`);
        const page = await abortable(pdf.getPage(i), signal);
        try {
          const content = await abortable(page.getTextContent(), signal);
          const pageText = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
          text.push(pageText);
          onPartial(extractBoletoText(text.join('\n'), codes));
          const canvas = document.createElement('canvas');
          const initial = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(2, 2200 / Math.max(initial.width, initial.height)) });
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          try {
            await abortable(page.render({ canvas, viewport }).promise, signal);
            // Digital PDFs use their text layer; image-only or incomplete pages also get OCR.
            const fields = extractBoletoText(pageText);
            await readImage(canvas, !fields.supplier || !fields.dueDate || !fields.amount);
          } finally { canvas.width = 0; canvas.height = 0; }
        } finally { page.cleanup(); }
      }
    } else {
      const bitmap = await abortable(createImageBitmap(file), signal);
      const canvas = document.createElement('canvas');
      try {
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        await readImage(canvas, true);
      } finally { bitmap.close(); canvas.width = 0; canvas.height = 0; }
    }
    return extractBoletoText(text.join('\n'), codes);
  } finally { closed = true; signal.removeEventListener('abort', stop); stop(); }
}
