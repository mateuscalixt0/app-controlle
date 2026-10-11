import { NextResponse } from "next/server";

const WEBHOOK_URL = "https://n8n-flamer.zapresponder.com.br/webhook/f146130a-2e3f-46b6-bd04-81996829eef3";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "O documento deve ter no máximo 10 MB." }, { status: 413 });
    if (!ACCEPTED_TYPES.has(file.type)) return NextResponse.json({ error: "Envie um PDF, JPG ou PNG." }, { status: 415 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const payload = {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      base64,
      dataUri: `data:${file.type};base64,${base64}`,
      file: { filename: file.name, mimeType: file.type, size: file.size, base64 },
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let response: Response;
    try {
      response = await fetch(WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload), signal: controller.signal, cache: "no-store" });
    } finally { clearTimeout(timeout); }
    const text = await response.text();
    let result: unknown;
    try { result = JSON.parse(text); } catch { result = text ? { result: text } : null; }
    if (!response.ok) return NextResponse.json({ error: "O serviço de leitura recusou o documento.", details: result }, { status: 502 });
    return NextResponse.json(result ?? {});
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") return NextResponse.json({ error: "A leitura demorou mais que o limite. Tente novamente." }, { status: 504 });
    return NextResponse.json({ error: "Não foi possível enviar o documento para leitura." }, { status: 502 });
  }
}
