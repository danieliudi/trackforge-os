/**
 * Peça genuinamente quebrada: o 422 continua existindo, com o campo nomeado e
 * o recibo junto. Relaxar limite não é o mesmo que aceitar qualquer coisa.
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
console.log(`campos reprovados: ${JSON.stringify(corpo.issues ?? null)}`);
console.log(
  `recibo devolvido: ${corpo.cost ? `US$ ${corpo.cost.usd.toFixed(4)} em ${corpo.cost.steps.length} linha(s)` : "NENHUM (gasto escondido)"}`,
);
console.log(`banner na tela: "${banner}"`);
console.log(`peças na tela: ${await page.locator("text=Copiar texto").count()}`);

await browser.close();
