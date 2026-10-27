import { expect, test } from '@playwright/test';

const xml = `<?xml version="1.0"?><nfeProc><NFe><infNFe versao="4.00"><ide><mod>55</mod><serie>1</serie><nNF>1002</nNF><dhEmi>2026-10-11T10:00:00-03:00</dhEmi></ide><emit><CNPJ>22333444000192</CNPJ><xNome>Distribuidora Beta Ltda</xNome></emit><det nItem="1"><prod><cProd>BE-100</cProd><cEAN>SEM GTIN</cEAN><xProd>TORN P/PIA PRETO 1/2</xProd><NCM>84818019</NCM><uCom>UN</uCom><qCom>2.0000</qCom><vUnCom>79.8000000000</vUnCom><vProd>159.60</vProd></prod></det><total><ICMSTot><vNF>159.60</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;

for (const width of [375, 1280]) test(`revisão NF-e sem overflow em ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/tests/browser/harness/nfe.html');
  await page.locator('input[type=file]').setInputFiles({ name: 'nota-sem-chave.xml', mimeType: 'application/xml', buffer: Buffer.from(xml) });
  await expect(page.getByText('A chave de acesso não veio no arquivo')).toBeVisible();
  await expect(page.getByRole('listitem').getByText('TORN P/PIA PRETO 1/2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /TORNEIRA PRETA PIA 1\/2 · 100%/ })).toBeVisible();
  await expect(page.getByText(/Encontrei o produto.*TORNEIRA PRETA PIA 1\/2.*É o mesmo produto/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'É o mesmo produto' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Não é o mesmo — cadastrar separado' })).toBeVisible();
  await page.getByRole('button', { name: 'Analisar depois' }).click();
  await expect(page.getByRole('status')).toHaveText('Item mantido para analisar depois.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
