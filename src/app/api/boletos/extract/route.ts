import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/supabase/session";
import { validateBillFile } from "@/lib/bill-file";

const WEBHOOK_URL = "https://n8n-flamer.zapresponder.com.br/webhook/f146130a-2e3f-46b6-bd04-81996829eef3";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.storeId) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "O documento deve ter no máximo 10 MB." }, { status: 413 });
    if (!ACCEPTED_TYPES.has(file.type)) return NextResponse.json({ error: "Envie um PDF, JPG ou PNG." }, { status: 415 });

    try { await validateBillFile(file); } catch { return NextResponse.json({ error: "Arquivo inválido." }, { status: 415 }); }
    const payload = new FormData();
    payload.append("file", file, file.name);
    payload.append("filename", file.name);
    payload.append("mimeType", file.type);
    payload.append("size", String(file.size));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let response: Response;
    try {
      response = await fetch(WEBHOOK_URL, { method: "POST", headers: { accept: "application/json" }, body: payload, signal: controller.signal, cache: "no-store" });
    } finally { clearTimeout(timeout); }
    const text = await response.text();
    let result: unknown;
    try { result = JSON.parse(text); } catch { result = text ? { result: text } : null; }
    if (!response.ok) return NextResponse.json({ error: "O serviço de leitura recusou o documento." }, { status: 502 });
    return NextResponse.json(result ?? {}, { headers: { "Cache-Control": "private, no-store" } });
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === "AbortError") return NextResponse.json({ error: "A leitura demorou mais que o limite. Tente novamente." }, { status: 504 });
    return NextResponse.json({ error: "Não foi possível enviar o documento para leitura." }, { status: 502 });
  }
}
