type ProgressHandler = (progress: number) => void;
type OcrWorker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;

let workerPromise: Promise<OcrWorker> | null = null;
let currentProgress: ProgressHandler | undefined;
const OCR_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = OCR_TIMEOUT_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function getWorker(onProgress?: ProgressHandler) {
  currentProgress = onProgress;
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(({ createWorker }) => createWorker("por", undefined, {
      logger: (message) => {
        if (message.status === "recognizing text") currentProgress?.(Math.round(message.progress * 100));
      },
    })).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function recognizeImage(image: string | HTMLCanvasElement, onProgress?: ProgressHandler) {
  try {
    const worker = await withTimeout(getWorker(onProgress), "A leitura OCR demorou mais de 30 segundos. Tente uma imagem mais nítida ou um PDF menor.");
    const result = await withTimeout(worker.recognize(image), "A leitura OCR demorou mais de 30 segundos. Tente uma imagem mais nítida ou um PDF menor.");
    return result.data.text;
  } catch (error) {
    workerPromise = null;
    throw error;
  }
}

async function recognizePdf(file: File, onProgress?: ProgressHandler) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  const pageCount = Math.min(document.numPages, 1);
  try {
    const worker = await withTimeout(getWorker((progress) => onProgress?.(progress)), "A leitura OCR demorou mais de 30 segundos. Tente um PDF menor.");
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const initialViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.6, 1800 / Math.max(initialViewport.width, initialViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) continue;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await withTimeout(worker.recognize(canvas), "A leitura OCR demorou mais de 30 segundos. Tente um PDF menor.");
      pages.push(result.data.text);
      onProgress?.(Math.round((pageNumber * 100) / pageCount));
      page.cleanup();
    }
    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

export async function extractTextWithOcr(file: File, onProgress?: ProgressHandler) {
  if (file.type === "application/pdf") return recognizePdf(file, onProgress);
  return recognizeImage(await prepareImage(file), onProgress);
}

export async function extractCodeWithZxing(file: File) {
  if (file.type === "application/pdf") return "";
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader();
  try {
    const result = await withTimeout(reader.decodeFromImageUrl(await prepareImage(file)), "A leitura do código demorou demais.", 4_000);
    return result.getText().replace(/\D/g, "");
  } catch {
    return "";
  }
}

async function prepareImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxDimension = 1800;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível preparar a imagem para leitura."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível preparar a imagem para leitura."));
    };
    image.src = objectUrl;
  });
}
