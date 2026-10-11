export type BillExtraction = {
  supplier: string;
  beneficiaryDocument: string;
  description: string;
  amount: string;
  dueDate: string;
  line: string;
  uncertain: string[];
};

const emptyExtraction: BillExtraction = { supplier: "", beneficiaryDocument: "", description: "", amount: "", dueDate: "", line: "", uncertain: ["beneficiário", "valor", "vencimento", "descrição"] };
function firstValue(source: Record<string, unknown>, keys: string[]) { for (const key of keys) { const value = source[key]; if (value !== undefined && value !== null && String(value).trim()) return value; } return ""; }
function unwrap(value: unknown): Record<string, unknown> { if (Array.isArray(value)) return unwrap(value[0] ?? {}); if (!value || typeof value !== "object") return {}; const object = value as Record<string, unknown>; for (const key of ["json", "body", "data", "result", "output"]) if (object[key] && typeof object[key] === "object") return unwrap(object[key]); return object; }
function normalizeAmount(value: unknown) { if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2).replace(".", ","); const text = String(value || "").trim().replace(/^R\$\s*/i, ""); return /^\d+\.\d{1,2}$/.test(text) ? text.replace(".", ",") : text; }
function normalizeDate(value: unknown) { const text = String(value || "").trim(); if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10); const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return match ? `${match[3]}-${match[2]}-${match[1]}` : ""; }
function normalize(payload: unknown): BillExtraction {
  const source = unwrap(payload);
  const supplier = String(firstValue(source, ["supplier", "fornecedor", "beneficiario", "beneficiário", "cedente"]));
  const beneficiaryDocument = String(firstValue(source, ["beneficiaryDocument", "documentoBeneficiario", "documento_beneficiario", "cpfCnpj", "cpf_cnpj", "cnpj", "cpf"]));
  const description = String(firstValue(source, ["description", "descricao", "descrição", "historico", "histórico"]));
  const amount = normalizeAmount(firstValue(source, ["amount", "valor", "valorBoleto", "valor_boleto", "valor_documento"]));
  const dueDate = normalizeDate(firstValue(source, ["dueDate", "due_date", "vencimento", "dataVencimento", "data_vencimento"]));
  const line = String(firstValue(source, ["line", "linhaDigitavel", "linha_digitavel", "codigoDigitavel", "codigo_digitavel", "barcode", "codigoBarras", "codigo_barras"])).replace(/\D/g, "");
  const uncertain: string[] = []; if (!supplier) uncertain.push("beneficiário"); if (!amount) uncertain.push("valor"); if (!dueDate) uncertain.push("vencimento"); if (!description) uncertain.push("descrição");
  return { supplier, beneficiaryDocument, description, amount, dueDate, line, uncertain };
}
export async function extractBillDocument(file: File): Promise<BillExtraction> {
  if (file.size > 10 * 1024 * 1024) throw new Error("O documento deve ter no máximo 10 MB.");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) throw new Error("Envie um PDF, JPG ou PNG.");
  const formData = new FormData(); formData.append("file", file, file.name);
  const response = await fetch("/api/boletos/extract", { method: "POST", body: formData });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload && typeof payload.error === "string" ? payload.error : "Não foi possível enviar o documento para leitura.");
  return payload ? normalize(payload) : emptyExtraction;
}
