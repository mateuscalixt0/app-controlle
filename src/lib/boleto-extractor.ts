import { extractTextFromDigitalPdf } from "./pdf-text";
import { extractCodeWithZxing, extractTextWithOcr } from "./document-ocr";
import { parseBoletoCode } from "./boleto-code";

export type BillExtraction = {
  supplier: string;
  beneficiaryDocument: string;
  description: string;
  amount: string;
  dueDate: string;
  line: string;
  uncertain: string[];
};

function brazilianDateToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

export async function extractBillDocument(file: File, onProgress?: (progress: number) => void): Promise<BillExtraction> {
  const empty: BillExtraction = {
    supplier: "",
    beneficiaryDocument: "",
    description: "",
    amount: "",
    dueDate: "",
    line: "",
    uncertain: ["beneficiário", "valor", "vencimento", "descrição"],
  };

  if (file.size > 10 * 1024 * 1024) throw new Error("O documento deve ter no máximo 10 MB.");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Envie um PDF, JPG ou PNG.");
  }
  let text = file.type === "application/pdf" ? await extractTextFromDigitalPdf(file) : "";
  const code = file.type === "application/pdf" ? "" : await extractCodeWithZxing(file);
  if (!text) text = await extractTextWithOcr(file, onProgress);
  if (!text && !code) return empty;

  const line = ((text.match(/(?:\d[ .-]?){44,48}/)?.[0] ?? "") || code).replace(/\D/g, "");
  const codeData = line ? parseBoletoCode(line) : null;
  const amount = codeData?.valid ? codeData.amount : text.match(/(?:valor(?:\s+do\s+documento)?|r\$)\s*[:\-]?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i)?.[1] ?? "";
  const date = codeData?.valid ? codeData.dueDate : text.match(/vencimento\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] ?? "";
  const supplier = text.match(/(?:benefici[áa]rio|cedente)\s*[:\-]?\s*([A-ZÀ-Ý0-9 .&-]{3,160})/i)?.[1]?.trim() ?? "";
  const beneficiaryDocument = text.match(/(?:cpf|cnpj)\s*[:\-]?\s*([\d./-]{11,18})/i)?.[1] ?? "";

  const uncertain: string[] = [];
  if (!supplier) uncertain.push("beneficiário");
  if (!amount) uncertain.push("valor");
  if (!date) uncertain.push("vencimento");
  uncertain.push("descrição");

  return {
    supplier,
    beneficiaryDocument,
    description: "",
    amount,
    dueDate: date.includes("-") ? date : brazilianDateToIso(date),
    line,
    uncertain,
  };
}
