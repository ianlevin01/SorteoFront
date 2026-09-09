/*
 * Prueba de punta a punta de la verificación de comprobantes:
 * genera comprobantes sintéticos, los sube a la API y muestra el veredicto.
 *   TOKEN=... RID=... node scripts/test-receipts.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const API = process.env.API || 'http://localhost:4001';
const TOKEN = process.env.TOKEN;
const RID = process.env.RID;
const TIER = process.env.TIER || 't10';
const OUT = process.env.OUT || '.screenshots/receipts';
mkdirSync(OUT, { recursive: true });

const money = (n) => n.toLocaleString('es-AR');

function receiptHtml({ amount, senderName, senderCuil, recipientName, recipientAlias, dateStr, opId }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#eef1f5;margin:0;padding:28px;width:440px}
    .card{background:#fff;border-radius:16px;padding:26px 24px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
    .ok{width:52px;height:52px;border-radius:50%;background:#00a650;color:#fff;display:grid;place-items:center;font-size:26px;margin:0 auto 12px}
    h1{font-size:17px;text-align:center;margin:0 0 2px;color:#222}
    .sub{text-align:center;color:#888;font-size:13px;margin-bottom:18px}
    .amount{text-align:center;font-size:30px;font-weight:700;color:#111;margin:14px 0 20px}
    .row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #eee;font-size:13px}
    .row .k{color:#888}.row .v{color:#222;font-weight:600;text-align:right;max-width:60%}
  </style></head><body><div class="card">
    <div class="ok">&#10003;</div>
    <h1>Transferencia realizada</h1>
    <div class="sub">${dateStr}</div>
    <div class="amount">$ ${money(amount)}</div>
    <div class="row"><span class="k">De</span><span class="v">${senderName}</span></div>
    <div class="row"><span class="k">CUIL</span><span class="v">${senderCuil}</span></div>
    <div class="row"><span class="k">Para</span><span class="v">${recipientName}</span></div>
    <div class="row"><span class="k">Alias</span><span class="v">${recipientAlias}</span></div>
    <div class="row"><span class="k">CBU destino</span><span class="v">0000076500000012345678</span></div>
    <div class="row"><span class="k">N&deg; de operaci&oacute;n</span><span class="v">${opId}</span></div>
    <div class="row"><span class="k">Moneda</span><span class="v">Pesos argentinos</span></div>
  </div></body></html>`;
}

async function j(r) {
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
const post = (p, body, form) =>
  fetch(API + p, {
    method: 'POST',
    headers: { authorization: `Bearer ${TOKEN}`, ...(form ? {} : { 'content-type': 'application/json' }) },
    body: form || JSON.stringify(body),
  }).then(j);

const today = new Date();
const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()} 14:32 hs`;

// precio del tier
const raffles = await fetch(`${API}/api/raffles`).then(j);
const raffle = raffles.find((r) => r.raffleId === RID) || raffles[0];
const total = raffle.chanceTiers.find((t) => t.id === TIER).price;
console.log(`Sorteo: ${raffle.title} · tier ${TIER} · total $${money(total)}\n`);

const cases = [
  {
    name: 'correcto',
    data: { amount: total, senderName: 'GOMEZ LUCIA', senderCuil: '27-30111222-4', recipientName: 'IMPORTADORA PRECIOS BAJOS SRL', recipientAlias: 'preciosbajos.sorteos', dateStr, opId: '48213307' },
  },
  {
    name: 'monto-menor',
    data: { amount: total - 5000, senderName: 'GOMEZ LUCIA', senderCuil: '27-30111222-4', recipientName: 'IMPORTADORA PRECIOS BAJOS SRL', recipientAlias: 'preciosbajos.sorteos', dateStr, opId: '48213308' },
  },
  {
    name: 'otro-emisor',
    data: { amount: total, senderName: 'PEREZ CARLOS ALBERTO', senderCuil: '20-40123456-7', recipientName: 'IMPORTADORA PRECIOS BAJOS SRL', recipientAlias: 'preciosbajos.sorteos', dateStr, opId: '48213309' },
  },
];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 500, height: 640 }, deviceScaleFactor: 2 });

for (const c of cases) {
  await page.setContent(receiptHtml(c.data), { waitUntil: 'networkidle' });
  const png = await page.locator('.card').screenshot({ path: `${OUT}/${c.name}.png` });

  const order = await post('/api/orders', { raffleId: RID, tierId: TIER });
  const oid = order.order?.orderId;
  if (!oid) {
    console.log(`${c.name}: no se pudo crear la orden`, order);
    continue;
  }
  const fd = new FormData();
  fd.append('receipt', new Blob([png], { type: 'image/png' }), 'comprobante.png');
  const t0 = Date.now();
  const res = await post(`/api/orders/${oid}/receipt`, null, fd);
  const ms = Date.now() - t0;

  console.log(`\n### ${c.name}  (${ms} ms)`);
  console.log(`  estado: ${res.status}  |  veredicto: ${res.verification?.outcome}`);
  (res.verification?.checks || []).forEach((ch) => {
    console.log(`  ${ch.pass ? 'OK ' : 'XX '} ${ch.label}: ${ch.detail}`);
  });
  if (res.verification?.issues?.length) console.log('  issues:', res.verification.issues);
}

await browser.close();
console.log(`\nComprobantes en ${OUT}`);
