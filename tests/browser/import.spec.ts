import { test, expect } from '@playwright/test';

function pdf(pages: string[][]) {
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids: number[] = [];
  for (const lines of pages) {
    const page = objects.length + 1, stream = page + 1; kids.push(page);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${stream} 0 R >>`);
    const content = 'BT /F1 16 Tf 40 750 Td ' + lines.map((line, i) => (i ? '0 -30 Td ' : '') + `(${line}) Tj`).join(' ') + ' ET';
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Kids [${kids.map(n => `${n} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let source = '%PDF-1.7\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(source)); source += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  return Buffer.from(source + `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
}
const fields = ['Cedente: FORNECEDOR FICTICIO', 'Valor do documento: 123,45', 'Vencimento: 11/10/2026'];
for (const width of [375, 1280]) {
  test(`PDF digital e formulário sem overflow em ${width}px; upload recuperável`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/browser/harness/');
    await page.locator('input[type=file]').setInputFiles({ name: 'boleto-ficticio.pdf', mimeType: 'application/pdf', buffer: pdf([fields]) });
    await expect(page.getByLabel('Valor (R$)')).toHaveValue('123,45', { timeout: 45_000 });
    await expect(page.getByLabel('Para quem vai pagar')).toHaveValue('');
    await page.getByLabel('Para quem vai pagar').fill('FORNECEDOR FICTICIO');
    await expect(page.getByLabel('Valor (R$)')).toHaveValue('123,45');
    await expect(page.getByLabel('Vencimento')).toHaveValue('2026-10-11');
    await expect(page.getByRole('button', { name: 'Confirmar e salvar boleto' })).toBeEnabled({ timeout: 45_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/revisao-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Confirmar e salvar boleto' }).click();
    await expect(page.getByRole('alert')).toContainText('arquivo ainda não');
    await page.getByRole('button', { name: 'Tentar guardar arquivo novamente' }).click();
    const saves = await page.evaluate(() => (globalThis as typeof globalThis & { saves: string[] }).saves);
    expect(saves).toHaveLength(2); expect(saves[0]).toBe(saves[1]);
  });
}
test('PDF corrompido mantém original e permite completar os dados', async ({ page }) => {
  await page.goto('/tests/browser/harness/');
  await page.locator('input[type=file]').setInputFiles({ name: 'corrompido.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 invalid') });
  await expect(page.getByRole('status')).toContainText('arquivo foi mantido', { timeout: 45_000 });
  await expect(page.getByLabel('Para quem vai pagar')).toBeEditable();
  await expect(page.getByLabel('Código de barras ou linha digitável')).toBeVisible();
});
test('permissão de câmera negada oferece alternativa e fecha', async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('denied', 'NotAllowedError'); }; });
  await page.goto('/tests/browser/harness/');
  await page.getByRole('button', { name: 'Câmera', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Acesso à câmera negado');
  await page.getByRole('button', { name: 'Fechar câmera' }).click();
  await expect(page.locator('input[type=file]')).toBeEnabled();
});
test('foto com OCR real preenche os campos', async ({ page }) => {
  await page.goto('/tests/browser/harness/');
  const image = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 450; const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1400, 450); ctx.fillStyle = 'black'; ctx.font = '32px Arial'; ['Cedente: FORNECEDOR FICTICIO', 'Valor do documento: 123,45', 'Vencimento: 11/10/2026'].forEach((line, i) => ctx.fillText(line, 40, 100 + i * 100)); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.locator('input[type=file]').setInputFiles({ name: 'foto-ficticia.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await expect(page.getByLabel('Valor (R$)')).toHaveValue('123,45', { timeout: 80_000 });
  await expect(page.getByLabel('Para quem vai pagar')).toHaveValue('');
  await expect(page.getByLabel('Valor (R$)')).toHaveValue('123,45');
  await expect(page.getByLabel('Vencimento')).toHaveValue('2026-10-11');
});

test('câmera lê ITF automaticamente, guarda captura e encerra vídeo', async ({ page }) => {
  await page.addInitScript(() => {
    const code = '23793100000000129560123456789012345678901234';
    const patterns = ['00110', '10001', '01001', '11000', '00101', '10100', '01100', '00011', '10010', '01010'];
    const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 700;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1800, 700);
    ctx.fillStyle = 'black'; let x = 100;
    const draw = (wide: boolean, black: boolean) => { const width = wide ? 9 : 3; if (black) ctx.fillRect(x, 200, width, 300); x += width; };
    [true, false, true, false].forEach(black => draw(false, black));
    for (let i = 0; i < code.length; i += 2) for (let j = 0; j < 5; j++) { draw(patterns[Number(code[i])][j] === '1', true); draw(patterns[Number(code[i + 1])][j] === '1', false); }
    draw(true, true); draw(false, false); draw(false, true);
    const stream = canvas.captureStream(10);
    (globalThis as typeof globalThis & { cameraTrack: MediaStreamTrack }).cameraTrack = stream.getVideoTracks()[0];
    navigator.mediaDevices.getUserMedia = async () => stream;
  });
  await page.goto('/tests/browser/harness/');
  await page.getByRole('button', { name: 'Câmera', exact: true }).click();
  await expect(page.getByText(/Arquivo: boleto-.*jpg/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Código de barras ou linha digitável')).toHaveValue('23793100000000129560123456789012345678901234');
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { cameraTrack: MediaStreamTrack }).cameraTrack.readyState)).toBe('ended');
  await expect(page.getByLabel('Valor (R$)')).toHaveValue('129,56');
});

test('cancelar leitura preserva formulário e ignora resultado tardio', async ({ page }) => {
  await page.route('**/pdf.worker.min.mjs', route => new Promise<void>(resolve => setTimeout(() => { void route.abort().then(resolve); }, 3000)));
  await page.goto('/tests/browser/harness/');
  await page.locator('input[type=file]').setInputFiles({ name: 'lento.pdf', mimeType: 'application/pdf', buffer: pdf([fields]) });
  await page.getByRole('button', { name: 'Interromper e preencher manualmente' }).click();
  await expect(page.getByLabel('Para quem vai pagar')).toBeEditable();
  await page.getByLabel('Para quem vai pagar').fill('PREENCHIDO MANUALMENTE');
  await expect(page.getByRole('status')).toContainText('Leitura interrompida');
  await expect(page.getByLabel('Para quem vai pagar')).toHaveValue('PREENCHIDO MANUALMENTE');
});

test('PDF escaneado lê imagem da segunda página', async ({ page }) => {
  await page.goto('/tests/browser/harness/');
  const jpeg = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 450; const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1400, 450); ctx.fillStyle = 'black'; ctx.font = '32px Arial'; ['Cedente: FORNECEDOR FICTICIO', 'Valor do documento: 123,45', 'Vencimento: 11/10/2026'].forEach((line, i) => ctx.fillText(line, 40, 100 + i * 100)); return canvas.toDataURL('image/jpeg', 1).split(',')[1]; });
  const hex = Buffer.from(jpeg, 'base64').toString('hex') + '>';
  const stream = 'q 600 0 0 193 0 550 cm /Im0 Do Q';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << >> >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 6 0 R >>',
    `<< /Type /XObject /Subtype /Image /Width 1400 /Height 450 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${hex.length} >>\nstream\n${hex}\nendstream`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let source = '%PDF-1.7\n'; const offsets: number[] = [];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(source)); source += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(source);
  source += 'xref\n0 7\n0000000000 65535 f \n' + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer << /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  await page.locator('input[type=file]').setInputFiles({ name: 'duas-paginas-escaneadas.pdf', mimeType: 'application/pdf', buffer: Buffer.from(source) });
  await expect(page.getByRole('button', { name: 'Confirmar e salvar boleto' })).toBeEnabled({ timeout: 80_000 });
  await expect(page.getByLabel('Para quem vai pagar')).toHaveValue('');
  await expect(page.getByLabel('Valor (R$)')).toHaveValue('123,45');
  await expect(page.getByLabel('Vencimento')).toHaveValue('2026-10-11');
});
