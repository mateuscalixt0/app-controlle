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
        await page.getByRole('button', {name:'Ver detalhes de Cimento de teste'}).click();
        await expect(page.getByRole('dialog')).toContainText('15/10/2026');
        await expect(page.getByRole('dialog')).toContainText('sem selecionar um produto do catálogo');
        await page.keyboard.press('Escape');
        const pageHeading = page.locator('h1');
        await page.getByLabel('Ordenação').selectOption('oldest');
        await expect(page).toHaveURL(/sort=oldest/);
        await expect(pageHeading).toBeVisible();
        await expect(page.locator('.missing-card h2').first()).toHaveText('Areia de teste');
        await page.getByLabel('Empresa').selectOption('Empresa de teste');
        await expect(page).toHaveURL(/company=Empresa\+de\+teste|company=Empresa%20de%20teste/);
        await expect(page.getByRole('heading',{name:'Cimento de teste'})).toBeVisible();
        await expect(page.getByRole('heading',{name:'Areia de teste'})).toHaveCount(0);
        await page.getByLabel('Marcar Cimento de teste como comprado').check();
        await expect(page.getByRole('button', { name: 'Marcar 1 produto como comprado' })).toBeVisible();
        await page.getByRole('button', { name: 'Marcar 1 produto como comprado' }).click();
        await expect(page.getByRole('button', { name: 'Confirmando itens comprados' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Confirmando itens comprados' }).locator('.confirmation-check')).toBeVisible();
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

for (const width of [375,1280]) test(`selecionar produto do catálogo e consultar preços em ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width,height:900 });
  await page.route('**/api/produtos?*', route => {
    const id = new URL(route.request().url()).searchParams.get('id');
    return route.fulfill({ json: id ? { prices: [{ id:'price-1',unit_price:'12.3456',unit:'UN',recorded_on:'2026-10-27',supplier_name:'Fornecedor de teste' }] } : { products:[{id:'catalog-1',name:'Serrote de teste',unit:'UN',suppliers:['Fornecedor de teste','Materiais Silva']}] } });
  });
  await page.goto(`${url}?path=/faltas`);
  await page.getByRole('button',{name:'Anotar produto faltante'}).click();
  await page.getByLabel('Produto cadastrado').fill('Serrote');
  await page.getByRole('button',{name:'Serrote de teste · UN'}).click();
  await expect(page.locator('input[name="product_id"]')).toHaveValue('catalog-1');
  await expect(page.getByRole('status')).toContainText('Selecionado: Serrote de teste');
  await expect(page.getByRole('status')).toContainText('Vendido por Fornecedor de teste, Materiais Silva');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Ver detalhes de Areia de teste'}).click();
  await expect(page.getByRole('dialog')).toContainText('Fornecedor de teste');
  await expect(page.getByRole('dialog')).toContainText('Menor preço registrado');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
