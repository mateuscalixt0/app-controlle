type ProgressHandler = (progress: number) => void;

async function recognizeImage(image: string | HTMLCanvasElement, onProgress?: ProgressHandler) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", undefined, {
    logger: (message) => {
      if (message.status === "recognizing text") onProgress?.(Math.round(message.progress * 100));
    },
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

async function recognizePdf(file: File, onProgress?: ProgressHandler) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  const pageCount = Math.min(document.numPages, 3);

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
      pages.push(await recognizeImage(canvas, (progress) => {
        onProgress?.(Math.round(((pageNumber - 1) * 100 + progress) / pageCount));
      }));
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
