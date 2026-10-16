import { test, expect } from '@playwright/test';
const url = '/tests/browser/harness/design.html';
for (const width of [375, 1280]) {
  test(`visual, teclado e detalhes em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of ['/', '/boletos', '/faltas', '/login']) {
      await page.goto(`${url}?path=${path}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === '/') {
        await page.getByRole('button', {name:'Ocultar total'}).click();
        await expect(page.locator('.balance-value')).toContainText('•••••');
        await page.getByRole('button', {name:'Mostrar total'}).click();
        await expect(page.locator('.balance-value')).toContainText('1.234,56');
      }
      if (path === '/boletos') {
        await page.getByRole('button', {name:/Ver detalhes de/}).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', {name:'Linha digitável'})).toBeVisible();
        await page.route('**/api/boletos/*/download', r => r.fulfill({status:500,body:'erro'}));
        await page.getByRole('button', {name:'Baixar boleto'}).click();
        await expect(page.getByRole('alert')).toContainText('Não foi possível baixar');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
      if (path === '/faltas') {
        await page.getByRole('button', {name:/Cimento de teste/}).click();
        await expect(page.getByRole('dialog')).toContainText('15/10/2026');
        await expect(page.getByRole('dialog')).toContainText('Nenhum preço é estimado');
        await page.keyboard.press('Escape');
        await page.getByLabel('Ordenar por').selectOption('oldest');
        await page.getByLabel('Empresa de referência').selectOption('Empresa de teste');
        await expect(page.getByLabel('Ordenar por')).toHaveValue('oldest');
      }
      if (path === '/login') await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');
      await page.screenshot({path:`/tmp/controle-${width}-${path.replaceAll('/','') || 'inicio'}.png`,fullPage:true});
    }
    expect(errors).toEqual([]);
  });
}
test('copiar e salvar: sucesso, carregamento e erro sem sucesso falso', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto(`${url}?path=/boletos`);
  await page.getByRole('button',{name:/Copiar código de/}).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('12345678901234567890112345678901112345678901234');
  await page.getByRole('button',{name:/Ver detalhes de/}).click();
  await page.getByRole('button',{name:'Marcar como pago'}).click();
  await expect(page.getByRole('button',{name:'Salvando…'})).toBeDisabled();
  await expect(page.locator('dialog dd').last()).toHaveText('Pago');
  await page.goto(`${url}?path=/boletos&fail=1`);
  await page.getByRole('button',{name:/Ver detalhes de/}).click();
  await page.getByRole('button',{name:'Marcar como pago'}).click();
  await expect(page.getByRole('alert')).toContainText('Falha de teste');
  await expect(page.locator('dialog dd').last()).toHaveText('Em aberto');
});

test('download do original, código ausente e cancelamento', async ({page}) => {
  await page.route('**/api/boletos/*/download', r => r.fulfill({json:{url:'https://files.example.test/boleto.pdf'}}));
  await page.route('https://files.example.test/boleto.pdf', r => r.fulfill({headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="boleto.pdf"'},body:'%PDF-1.7 fixture'}));
  await page.goto(`${url}?path=/boletos`);
  await page.getByRole('button',{name:/Ver detalhes de/}).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button',{name:'Baixar boleto'}).click();
  expect((await download).suggestedFilename()).toBe('boleto.pdf');
  await page.getByRole('button',{name:'Cancelar boleto',exact:true}).click();
  await expect(page.locator('dialog dd').last()).toHaveText('Cancelado');
  await expect(page.getByRole('button',{name:'Marcar como pago'})).toHaveCount(0);
  await page.goto(`${url}?path=/boletos&absent=1`);
  await expect(page.getByRole('button',{name:/Copiar código de/})).toBeDisabled();
  await page.getByRole('button',{name:/Ver detalhes de/}).click();
  await expect(page.getByRole('button',{name:'Baixar boleto'})).toBeDisabled();
  await expect(page.getByRole('dialog')).toContainText('Nenhum documento anexado');
});
