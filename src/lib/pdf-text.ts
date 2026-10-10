function latin1(bytes: Uint8Array) {
  return new TextDecoder("iso-8859-1").decode(bytes);
}

function unescapePdfString(value: string) {
  return value
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function stringsFromContent(content: string) {
  const values: string[] = [];
  for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    values.push(unescapePdfString(match[0].replace(/\)\s*Tj$/, "").slice(1)));
  }
  for (const match of content.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    for (const item of match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      values.push(unescapePdfString(item[0].slice(1, -1)));
    }
  }
  return values.join(" ");
}

async function inflate(stream: Uint8Array) {
  if (typeof DecompressionStream === "undefined") return "";
  try {
    const decompressor = new DecompressionStream("deflate");
    const writer = decompressor.writable.getWriter();
    const copy = new Uint8Array(stream.byteLength);
    copy.set(stream);
    await writer.write(copy.buffer);
    await writer.close();
    const buffer = await new Response(decompressor.readable).arrayBuffer();
    return latin1(new Uint8Array(buffer));
  } catch {
    return "";
  }
}

/**
 * Extrai operadores de texto de PDFs digitais. Não envia o arquivo a terceiros
 * e não tenta OCR: conteúdo sem texto selecionável retorna vazio.
 */
export async function extractTextFromDigitalPdf(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = latin1(bytes);
  if (!pdf.startsWith("%PDF-")) throw new Error("O arquivo não é um PDF válido.");

  const chunks = [pdf];
  for (const match of pdf.matchAll(/<<(?:[^>]|>(?!>))*\/FlateDecode[\s\S]*?>>\s*stream\r?\n([\s\S]*?)endstream/g)) {
    const compressed = new Uint8Array([...match[1]].map((character) => character.charCodeAt(0)));
    const inflated = await inflate(compressed);
    if (inflated) chunks.push(inflated);
  }

  return chunks.map(stringsFromContent).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}