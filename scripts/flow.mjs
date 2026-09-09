/*
 * Recorre el flujo de compra y saca capturas de cada paso.
 *   TOKEN=... RID=... OUT=... node scripts/flow.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:5180';
const OUT = process.env.OUT || '.screenshots/flow';
const TOKEN = process.env.TOKEN;
const RID = process.env.RID;
mkdirSync(OUT, { recursive: true });

let USER = '';
if (TOKEN) {
  const r = await fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${TOKEN}` } });
  if (r.ok) USER = await r.text();
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });

// sesión
await page.goto(`${BASE}/`);
await page.evaluate(
  ([t, u]) => {
    localStorage.setItem('sorteo.token', t);
    if (u) localStorage.setItem('sorteo.user', u);
  },
  [TOKEN, USER],
);

// 1. detalle
await page.goto(`${BASE}/sorteos/${RID}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await shot('1-detalle');

// 2. elegir 5 y participar
await page.getByRole('button', { name: /^5\s*n/i }).first().click().catch(() => {});
await page.waitForTimeout(300);
await shot('2-selector');
await page.getByRole('button', { name: 'Participar' }).click();
await page.waitForURL(/\/comprar\//, { timeout: 10000 });
await page.waitForTimeout(800);
await shot('3-checkout');

// 3. subir comprobante (archivo dummy)
const buf = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
await page.setInputFiles('input[type=file]', {
  name: 'comprobante.png',
  mimeType: 'image/png',
  buffer: buf,
});
await page.waitForTimeout(300);
await shot('4-comprobante-listo');
await page.getByRole('button', { name: /enviar comprobante/i }).click();
await page.waitForTimeout(2500); // deja correr el revelado
await shot('5-confirmacion');

// 4. mis números
await page.goto(`${BASE}/mis-numeros`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('6-mis-numeros');

await page.goto(`${BASE}/mis-numeros/${RID}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('7-tickets');

// abrir un ticket
await page.locator('button:has-text("Número")').first().click().catch(() => {});
await page.waitForTimeout(600);
await shot('8-ticket-abierto');

await browser.close();
console.log('Flujo capturado en', OUT);
