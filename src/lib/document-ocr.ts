type ProgressHandler = (progress: number) => void;
type OcrWorker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;

let workerPromise: Promise<OcrWorker> | null = null;
let currentProgress: ProgressHandler | undefined;

async function getWorker(onProgress?: ProgressHandler) {
  currentProgress = onProgress;
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(({ createWorker }) => createWorker("por", undefined, {
      logger: (message) => {
        if (message.status === "recognizing text") currentProgress?.(Math.round(message.progress * 100));
      },
    }));
  }
  return workerPromise;
}

async function recognizeImage(image: string | HTMLCanvasElement, onProgress?: ProgressHandler) {
  const worker = await getWorker(onProgress);
  const result = await worker.recognize(image);
  return result.data.text;
}

async function recognizePdf(file: File, onProgress?: ProgressHandler) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  const pageCount = Math.min(document.numPages, 3);
  const worker = await getWorker((progress) => onProgress?.(progress));

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) continue;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
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
  return recognizeImage(await createImageUrl(file), onProgress);
}

async function createImageUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível preparar a imagem para leitura."));
    reader.readAsDataURL(file);
  });
}
