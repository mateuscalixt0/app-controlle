import { describe, expect, it } from 'vitest';
import { mod10, parseBoletoCode, validCivilDate } from '../src/lib/boleto-code';
import { extractBoletoText, mergeBillExtractions } from '../src/lib/boleto-text';
import { validateBillFile } from '../src/lib/bill-file';

// Synthetic values; independent check digit generation for test fixtures.
function barcode(factor = '1000', cents = '0000012956') {
  const raw = `2379${factor}${cents}0123456789012345678901234`;
  let total = 0;
  [...raw].reverse().forEach((digit, i) => { total += Number(digit) * (2 + i % 8); });
  const candidate = 11 - total % 11;
  return raw.slice(0, 4) + (candidate >= 2 && candidate <= 9 ? candidate : 1) + raw.slice(4);
}
function line(code: string) {
  const chunks = [code.slice(0, 4) + code.slice(19, 24), code.slice(24, 34), code.slice(34)];
  return chunks.map(c => c + mod10(c)).join('') + code[4] + code.slice(5, 19);
}
describe('código de boleto', () => {
  it('mantém valor exato e ambos os ciclos de vencimento', () => {
    expect(parseBoletoCode(barcode())).toMatchObject({ amount: '129,56', dueDates: ['2000-07-03', '2025-02-22'] });
    expect(parseBoletoCode(barcode('1001')).dueDates).toEqual(['2000-07-04', '2025-02-23']);
    expect(parseBoletoCode(barcode('9999')).dueDates).toEqual(['2025-02-21', '2049-10-13']);
  });
  it('converte 47 dígitos e valida todos os DVs', () => {
    const code = barcode(); const digits = line(code);
    expect(parseBoletoCode(digits).barcode).toBe(code);
    for (const i of [9, 20, 31, 32]) expect(() => parseBoletoCode(digits.slice(0, i) + (Number(digits[i]) + 1) % 10 + digits.slice(i + 1))).toThrow();
  });
  it('exige entrada manual para valor aberto e fator ausente', () => {
    expect(parseBoletoCode(barcode('0000', '0000000000'))).toMatchObject({ amount: '', dueDates: [], manual: true });
  });
  it.each(['1'.repeat(45), '1'.repeat(46), '0'.repeat(44), 'abc', barcode().slice(0, -1) + '9'])('rejeita código inválido %s', input => expect(() => parseBoletoCode(input)).toThrow());
  it('valida arrecadação sem inferir valor/data', () => {
    const raw = '816' + '0000000123400000000000000000000000000000';
    const code = raw.slice(0, 3) + mod10(raw) + raw.slice(3);
    const digits = [0, 11, 22, 33].map(i => { const part = code.slice(i, i + 11); return part + mod10(part); }).join('');
    expect(parseBoletoCode(digits)).toMatchObject({ manual: true, amount: '', dueDates: [] });
    expect(() => parseBoletoCode(digits.slice(0, -1) + (Number(digits.at(-1)) + 1) % 10)).toThrow();
  });
  it('não aceita datas impossíveis', () => {
    expect(validCivilDate('2026-02-30')).toBe(false);
    expect(validCivilDate('2024-02-29')).toBe(true);
    expect(validCivilDate('2025-02-29')).toBe(false);
  });
});
describe('extração assistida', () => {
  it('preenche a data da IA apesar do aviso local sobre dois ciclos', () => {
    const local = extractBoletoText('', [barcode()]);
    const ai = extractBoletoText('Vencimento: 22/02/2025');
    expect(mergeBillExtractions(local, ai)).toMatchObject({ dueDate: '2025-02-22', amount: '129,56', warnings: [] });
  });
  it('preserva a data válida quando há conflito no valor', () => {
    const local = extractBoletoText('', [barcode()]);
    const ai = extractBoletoText('Vencimento: 22/02/2025\nValor do documento: 307,06', [barcode()]);
    expect(mergeBillExtractions(local, ai)).toMatchObject({ dueDate: '2025-02-22', amount: '307,06' });
  });
  it('preserva data impressa divergente para conferência', () => {
    const result = mergeBillExtractions(extractBoletoText('', [barcode()]), extractBoletoText('Vencimento: 30/10/2026\nValor do documento: 307,06', [barcode()]));
    expect(result).toMatchObject({ dueDate: '2026-10-30', amount: '307,06' });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('divergência');
  });
  it('compara código de barras e linha digitável equivalentes', () => {
    expect(mergeBillExtractions(extractBoletoText('', [barcode()]), extractBoletoText('Vencimento: 22/02/2025', [line(barcode())])).dueDate).toBe('2025-02-22');
  });
  it('não mistura documentos diferentes entre leitores', () => {
    expect(mergeBillExtractions(extractBoletoText('', [barcode()]), extractBoletoText('Vencimento: 23/02/2025', [barcode('1001')]))).toMatchObject({ dueDate: '', amount: '', line: '' });
  });
  it('lê valor, vencimento e linha, deixando o fornecedor para seleção manual', () => {
    const result = extractBoletoText(`Beneficiário: LOJA FICTICIA\nPagador: CLIENTE TESTE\nValor do documento: R$ 129,56\nVencimento: 22/02/2025\n${line(barcode())}`);
    expect(result).toMatchObject({ supplier: '', amount: '129,56', dueDate: '2025-02-22', line: line(barcode()) });
  });
  it('encontra vencimento quando o rótulo e a data estão em linhas separadas', () => {
    const result = extractBoletoText('Cedente\nConselho Regional\nVencimento\n31/03/2015\nData do Processamento\n08/11/2012');
    expect(result).toMatchObject({ supplier: '', dueDate: '2015-03-31' });
  });
  it('não escolhe ciclo nem beneficiário pelo código', () => {
    const result = extractBoletoText('', [barcode()]);
    expect(result.supplier).toBe(''); expect(result.dueDate).toBe(''); expect(result.warnings.length).toBeGreaterThan(0);
  });
  it('mantém dados impressos divergentes visíveis para revisão', () => {
    expect(extractBoletoText('Valor do documento: 10,00\nVencimento: 01/01/2020', [barcode()])).toMatchObject({ amount: '10,00', dueDate: '2020-01-01' });
  });
  it('não combina dados de vários boletos', () => {
    expect(extractBoletoText('Beneficiário: TESTE\nValor do documento: 129,56', [barcode(), barcode('1001')])).toMatchObject({ supplier: '', amount: '', line: '' });
  });
  it('não confunde endereço ou CPF do beneficiário com seu nome', () => {
    expect(extractBoletoText('Endereço Beneficiário\nRUA FICTICIA\nCPF/CNPJ do Beneficiário: 00000000000').supplier).toBe('');
  });
  it('mantém data impressa mesmo com ciclo único divergente', () => {
    expect(extractBoletoText('Vencimento: 01/01/2020', [barcode('0999')]).dueDate).toBe('2020-01-01');
  });
  it('preserva desconhecidos vazios', () => expect(extractBoletoText('texto sem dados')).toMatchObject({ supplier: '', amount: '', dueDate: '', line: '' }));
});
describe('arquivos', () => {
  it('rejeita MIME falso e arquivo vazio', async () => {
    await expect(validateBillFile(new File(['html'], 'boleto.pdf', { type: 'application/pdf' }))).rejects.toThrow();
    await expect(validateBillFile(new File([], 'boleto.pdf', { type: 'application/pdf' }))).rejects.toThrow();
  });
  it('valida cabeçalho PDF e limite de 10MB', async () => {
    await expect(validateBillFile(new File(['%PDF-1.7\n'], 'boleto.pdf', { type: 'application/pdf' }))).resolves.toBeUndefined();
    await expect(validateBillFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }))).rejects.toThrow();
  });
});
