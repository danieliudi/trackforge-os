/**
 * O lote não morre inteiro por causa de uma peça.
 *
 * Cenário: o Reels volta fora das regras, as outras cinco saem. Este teste
 * confere o que a TELA mostra — cinco cartões, um slot vermelho no lugar do
 * Reels, contagem "5 de 6 saíram", botão do lote sem laranja — e depois clica
 * em "Gerar essa de novo" para ver a sexta entrar sozinha.
 *
 * COMO RODAR: ver o cabeçalho de `artigo-navegador.mjs`.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1000 } });
const erros = [];
page.on("pageerror", (e) => erros.push(e.message));
page.on("console", (m) => m.type() === "error" && erros.push(m.text()));

await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Resibag", exact: true }).click();
await page.getByRole("button", { name: "Tema", exact: true }).click();
// Sem artigo: assim o tema chega ao prompt da peça, que é como o mock escolhe.
await page.getByText("Escrever o artigo antes").click();
await page
  .getByPlaceholder("O que muda com a revisão da ANTT 5.998")
  .fill("Descarte correto de resíduo — SO-O-REELS falha");
await page.waitForTimeout(300);

for (let i = 0; i < (await page.locator('input[type="checkbox"]').count()); i++) {
  const c = page.locator('input[type="checkbox"]').nth(i);
  if (!(await c.isChecked())) await c.check();
}

const r1 = page.waitForResponse((r) => r.url().includes("/api/generate/avulso"), { timeout: 90000 });
await page.getByRole("button", { name: /Gerar \d+ peças?/ }).click();
const corpo = await (await r1).json();
await page.waitForTimeout(1500);

console.log(`peças que saíram: ${corpo.pieces.length} — ${corpo.pieces.map((p) => p.kind).join(", ")}`);
console.log(`falhas: ${corpo.failures.map((f) => `${f.kind} (${f.issues.length} campo(s), US$ ${f.usd.toFixed(4)})`).join(" | ")}`);

const contagem = await page.locator("span", { hasText: /de \d+ saíram|marcadas/ }).first().textContent();
console.log(`contagem no topo: "${contagem.trim()}"`);
console.log(`cartões prontos na tela: ${await page.locator("text=Copiar texto").count()}`);
console.log(`slot vermelho na tela: ${await page.getByText("Gerar essa de novo").count()}`);
console.log(`banner de erro: ${(await page.locator("div.border-danger-line").count()) > 0 ? "presente" : "nenhum"}`);

const botao = page.getByRole("button", { name: /Gerar as \d+ de novo|Gerar \d+ peças?/ });
const classe = await botao.first().getAttribute("class");
console.log(`botão do lote: "${(await botao.first().textContent()).trim()}" · laranja: ${classe.includes("bg-acc") ? "SIM" : "não"}`);
console.log(`cobrança visível no slot: ${(await page.getByText(/cobrados nessa tentativa/).textContent()).trim()}`);

await page.screenshot({ path: "scratchpad/lote-parcial-1900.png" });

// ── agora refaz só a que falhou; o mock volta a responder certo ──
await page.getByPlaceholder("O que muda com a revisão da ANTT 5.998").fill("Descarte correto de resíduo");
const r2 = page.waitForResponse((r) => r.url().includes("/api/generate/avulso"), { timeout: 90000 });
await page.getByText("Gerar essa de novo").click();
const segundo = await (await r2).json();
await page.waitForTimeout(1500);

console.log(`\n── depois de "Gerar essa de novo" ──`);
console.log(`formatos pedidos na segunda chamada: ${segundo.pieces.length + segundo.failures.length} (não 6)`);
console.log(`cartões prontos na tela: ${await page.locator("text=Copiar texto").count()}`);
console.log(`slot vermelho restante: ${await page.getByText("Gerar essa de novo").count()}`);
console.log(`erros de página: ${erros.length === 0 ? "nenhum" : JSON.stringify(erros.slice(0, 3))}`);

await page.screenshot({ path: "scratchpad/lote-recuperado-1900.png" });
await browser.close();
