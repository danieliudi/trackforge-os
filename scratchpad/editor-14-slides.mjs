/**
 * O carrossel de 14 slides abre no editor, que trava os botões em 12.
 *
 * Relaxar o teto do schema só é seguro se o editor degradar: "adicionar" some,
 * o resto funciona. Sem isto, entregar 14 slides seria trocar um erro visível
 * por uma tela quebrada.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1000 } });
const erros = [];
page.on("pageerror", (e) => erros.push(e.message));
page.on("console", (m) => m.type() === "error" && erros.push(m.text()));

await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Resibag", exact: true }).click();
await page.getByRole("button", { name: "Tema", exact: true }).click();
await page.getByPlaceholder("O que muda com a revisão da ANTT 5.998").fill("Descarte de resíduo");
await page.getByRole("button", { name: "Escrever o artigo" }).click();
await page.waitForResponse((r) => r.url().includes("/api/generate/artigo"));
await page.waitForTimeout(600);

await page.getByRole("button", { name: /Gerar \d+ peças?/ }).click();
await page.waitForResponse((r) => r.url().includes("/api/derive"), { timeout: 60000 });
await page.waitForTimeout(1200);

await page.getByRole("button", { name: "Abrir no editor" }).first().click();
await page.waitForURL(/\/editor/, { timeout: 15000 });
await page.waitForTimeout(2500);

const cartoes = await page.locator('[id^="slide-"], textarea').count();
const adicionar = page.getByRole("button", { name: /Adicionar|Novo slide|\+ Slide/i }).first();
const temAdicionar = (await adicionar.count()) > 0;

console.log(`URL: ${new URL(page.url()).pathname}`);
console.log(`campos de slide na tela: ${cartoes}`);
console.log(
  `botão de adicionar: ${temAdicionar ? (await adicionar.isDisabled()) ? "presente e DESABILITADO (correto, 14 > 12)" : "presente e ATIVO" : "ausente"}`,
);

const preview = await page.locator("canvas, [data-slide-preview], .aspect-square, .aspect-\\[4\\/5\\]").count();
console.log(`prévias renderizadas: ${preview}`);
console.log(`erros de página: ${erros.length === 0 ? "nenhum" : JSON.stringify(erros.slice(0, 3))}`);

await page.screenshot({ path: "scratchpad/editor-1900.png" });
await browser.close();
