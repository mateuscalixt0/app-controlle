import { parseBoletoCode, validCivilDate } from './boleto-code';

export type BillExtraction = { supplier: string; beneficiaryDocument: string; description: string; amount: string; dueDate: string; line: string; warnings: string[] };
export const emptyExtraction = (): BillExtraction => ({ supplier: '', beneficiaryDocument: '', description: '', amount: '', dueDate: '', line: '', warnings: [] });
// Reconcile fields independently: an ambiguous barcode date must not discard a
// printed date found by the second reader, nor may an amount conflict erase it.
export function mergeBillExtractions(local: BillExtraction, ai: BillExtraction): BillExtraction {
  const warnings = [...new Set([...local.warnings, ...ai.warnings])];
  if (warnings.some(w => w.includes('mais de um boleto'))) return { ...emptyExtraction(), warnings };
  if (local.line && ai.line && parseBoletoCode(local.line).barcode !== parseBoletoCode(ai.line).barcode) {
    return { ...emptyExtraction(), warnings: [...warnings, 'As leituras identificaram códigos diferentes. Confira o documento.'] };
  }
  const result = { ...local, supplier: '', line: local.line || ai.line, warnings };
  for (const field of ['amount', 'dueDate'] as const) {
    const label = field === 'amount' ? 'valor' : 'vencimento';
    const conflict = local[field] && ai[field] && local[field] !== ai[field];
    const previouslyConflicting = warnings.some(w => w.includes(`${label} impresso difere`));
    result[field] = conflict || previouslyConflicting ? '' : local[field] || ai[field];
    if (conflict) warnings.push(`As leituras divergem no ${label}. Confirme o dado impresso.`);
  }
  const date = result.dueDate.split('-').reverse().join('/');
  const checked = extractBoletoText(`Vencimento: ${date}\nValor do documento: ${result.amount}`, result.line ? [result.line] : []);
  // Validation can clear conflicts, but must not refill an intentionally empty field.
  if (result.dueDate) result.dueDate = checked.dueDate;
  if (result.amount) result.amount = checked.amount;
  result.warnings = [...new Set([...warnings, ...checked.warnings])].filter(w => !result.dueDate || !w.includes('dois ciclos de vencimento'));
  return result;
}
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
