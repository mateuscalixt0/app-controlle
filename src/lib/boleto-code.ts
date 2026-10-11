/** FEBRABAN cobrança: campos e DVs; datas civis, sem escolher um ciclo por proximidade. */
export function mod10(value: string): number {
  let sum = 0;
  for (let i = value.length - 1, weight = 2; i >= 0; i--, weight = 3 - weight) {
    const n = Number(value[i]) * weight;
    sum += Math.floor(n / 10) + n % 10;
  }
  return (10 - sum % 10) % 10;
}
function remainder11(value: string) {
  let sum = 0;
  for (let i = value.length - 1, weight = 2; i >= 0; i--, weight = weight === 9 ? 2 : weight + 1) sum += Number(value[i]) * weight;
  return sum % 11;
}
function bankDV(value: string) { const digit = 11 - remainder11(value); return digit > 9 || digit < 2 ? 1 : digit; }
function collectionDV(value: string, reference: string) {
  if (reference === '6' || reference === '7') return mod10(value);
  const remainder = remainder11(value);
  return remainder < 2 ? 0 : 11 - remainder;
}
export function validCivilDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function plusDays(base: string, days: number) { const date = new Date(`${base}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
export type BoletoCode = { code: string; barcode: string; amount: string; dueDates: string[]; manual: boolean };
export function parseBoletoCode(input: string): BoletoCode {
  if (!/^[\d\s.\-]+$/.test(input)) throw new Error('Use somente os números do código do boleto.');
  const code = input.replace(/\D/g, '');
  if (![44, 47, 48].includes(code.length)) throw new Error('O código deve ter 44, 47 ou 48 dígitos.');
  let barcode = code;
  if (code.length === 48) {
    if (code[0] !== '8' || !'6789'.includes(code[2])) throw new Error('Código de arrecadação inválido.');
    for (let i = 0; i < 48; i += 12) if (collectionDV(code.slice(i, i + 11), code[2]) !== Number(code[i + 11])) throw new Error('Confira os dígitos do código de arrecadação.');
    barcode = [0, 12, 24, 36].map(i => code.slice(i, i + 11)).join('');
  } else if (code.length === 47) {
    for (const [start, end] of [[0, 9], [10, 20], [21, 31]]) if (mod10(code.slice(start, end)) !== Number(code[end])) throw new Error('Confira os dígitos da linha digitável.');
    barcode = code.slice(0, 4) + code[32] + code.slice(33) + code.slice(4, 9) + code.slice(10, 20) + code.slice(21, 31);
  }
  if (barcode[0] === '8') {
    if (code.length === 47 || !'6789'.includes(barcode[2]) || collectionDV(barcode.slice(0, 3) + barcode.slice(4), barcode[2]) !== Number(barcode[3])) throw new Error('Código de arrecadação inválido.');
    return { code, barcode, amount: '', dueDates: [], manual: true };
  }
  if (code.length === 48 || barcode[3] !== '9' || bankDV(barcode.slice(0, 4) + barcode.slice(5)) !== Number(barcode[4])) throw new Error('Código de boleto inválido. Confira a leitura.');
  const cents = Number(barcode.slice(9, 19));
  const factor = Number(barcode.slice(5, 9));
  const dueDates = factor === 0 ? [] : [plusDays('1997-10-07', factor), ...(factor >= 1000 ? [plusDays('2025-02-22', factor - 1000)] : [])];
  return { code, barcode, amount: cents ? `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}` : '', dueDates, manual: cents === 0 };
}
