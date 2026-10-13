import { parseBoletoCode, validCivilDate } from './boleto-code';

export type BillExtraction = { supplier: string; beneficiaryDocument: string; description: string; amount: string; dueDate: string; line: string; warnings: string[] };
export const emptyExtraction = (): BillExtraction => ({ supplier: '', beneficiaryDocument: '', description: '', amount: '', dueDate: '', line: '', warnings: [] });
export function extractBoletoText(text: string, detectedCodes: string[] = []): BillExtraction {
  const result = emptyExtraction();
  // Retain line breaks: they separate beneficiary/payer and document value/discount labels.
  const normalized = text.replace(/\r/g, '').replace(/[^\S\n]+/g, ' ');
  const codes = [...detectedCodes, ...normalized.split('\n').flatMap(line => line.match(/(?<!\d)(?:\d[.\- ]?){43,47}\d(?!\d)/g) ?? []), ...(normalized.match(/\b\d{5}\.?\d{5}\s+\d{5}\.?\d{6}\s+\d{5}\.?\d{6}\s+\d\s+\d{14}\b/g) ?? [])];
  const parsed = new Map<string, ReturnType<typeof parseBoletoCode>>();
  for (const code of codes) { try { const p = parseBoletoCode(code); parsed.set(p.barcode, p); } catch { /* OCR candidates are untrusted. */ } }
  if (parsed.size > 1) { result.warnings.push('Há mais de um boleto neste documento. Separe os boletos ou preencha os dados de um deles.'); return result; }
  const unique = (values: string[]) => { const items = [...new Set(values.filter(Boolean))]; return items.length === 1 ? items[0] : ''; };
  // O fornecedor é escolhido pelo usuário para evitar associação automática de OCR ambíguo.
  result.supplier = '';
  result.amount = unique([...normalized.matchAll(/(?:valor\s*(?:do\s*)?(?:documento|boleto)|\(=\)\s*valor\s*cobrado)\s*[:\-]?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/gi)].map(m => m[1].replace(/\./g, '')));
  // Em PDFs impressos o rótulo e a data costumam ficar em linhas/colunas separadas.
  result.dueDate = unique([...normalized.matchAll(/vencimento[\s:.-]{0,100}?(\d{2})\/(\d{2})\/(\d{4})/gi)].map(m => `${m[3]}-${m[2]}-${m[1]}`).filter(validCivilDate));
  const code = [...parsed.values()][0];
  if (code) {
    result.line = code.code;
    if (code.amount && result.amount && code.amount !== result.amount) {
      result.amount = ''; result.warnings.push('O valor impresso difere do código. Confirme o valor correto.');
    } else result.amount ||= code.amount;
    const conflictingDate = Boolean(result.dueDate && code.dueDates.length && !code.dueDates.includes(result.dueDate));
    if (conflictingDate) {
      result.dueDate = ''; result.warnings.push('O vencimento impresso difere do código. Confirme a data correta.');
    }
    if (!result.dueDate && !conflictingDate && code.dueDates.length === 1) result.dueDate = code.dueDates[0];
    if (!result.dueDate && code.dueDates.length > 1) result.warnings.push('O código admite dois ciclos de vencimento. Confira a data impressa no boleto.');
    if (code.manual) result.warnings.push('Arrecadação ou valor aberto: confira valor e vencimento no documento.');
  }
  return result;
}
