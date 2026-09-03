/**
 * NENHUMA peça saiu — o extremo do lote parcial.
 *
 * Aqui não se desenham seis cartões vermelhos repetindo o mesmo problema: um
 * aviso só, as caixas em vermelho e o recibo. Com peça na mão o slot vale;
 * sem nenhuma, ele vira ruído. Relaxar limite não é aceitar qualquer coisa.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });

await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Resibag", exact: true }).click();
await page.getByRole("button", { name: "Tema", exact: true }).click();
await page
  .getByPlaceholder("O que muda com a revisão da ANTT 5.998")
  .fill("Tema PECA-QUEBRADA para forçar peça inválida");

// Sem artigo antes: assim o tema vai direto no prompt da peça, que é como o
// mock sabe devolver a resposta quebrada. Exercita a rota `avulso`.
await page.getByText("Escrever o artigo antes").click();
await page.waitForTimeout(400);

const caixas = page.locator('input[type="checkbox"]');
for (let i = 0; i < (await caixas.count()); i++) {
  const caixa = caixas.nth(i);
  if (await caixa.isChecked()) continue;
  if ((await caixa.locator("xpath=ancestor::label").count()) > 0) {
    const rotulo = await caixa.locator("xpath=ancestor::label").first().innerText();
    if (rotulo.includes("Escrever o artigo")) continue;
  }
  await caixa.check();
}

const espera = page.waitForResponse((r) => r.url().includes("/api/generate/avulso"), {
  timeout: 60000,
});
await page.getByRole("button", { name: /Gerar \d+ peças?/ }).click();
const r = await espera;
const corpo = await r.json();
await page.waitForTimeout(1200);

const banner = (await page.locator("div.border-danger-line").allTextContents())
  .map((t) => t.replace(/\s+/g, " ").trim())
  .join(" / ");

console.log(`HTTP: ${r.status()}`);
console.log(`peças que saíram: ${corpo.pieces.length}`);
console.log(`falhas devolvidas: ${corpo.failures.length} — ${corpo.failures.map((f) => f.kind).join(", ")}`);
console.log(`campos nomeados na primeira: ${JSON.stringify(corpo.failures[0]?.issues ?? null)}`);
console.log(
  `recibo devolvido: ${corpo.cost ? `US$ ${corpo.cost.usd.toFixed(4)} em ${corpo.cost.steps.length} linha(s)` : "NENHUM (gasto escondido)"}`,
);
console.log(`aviso na tela: "${banner}"`);
console.log(`cartões de peça na tela: ${await page.locator("text=Copiar texto").count()}`);
console.log(`slots vermelhos na tela: ${await page.getByText("Gerar essa de novo").count()} (esperado 0)`);
console.log(`caixas em vermelho: ${await page.locator("label.border-danger-line").count()}`);

await browser.close();
