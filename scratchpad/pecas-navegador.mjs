/**
 * O lote de peças curtas, no app de verdade, com o modelo respondendo fixo.
 *
 * COMO RODAR: igual ao `artigo-navegador.mjs` — mock + `next dev` apontado para
 * ele. Ver o cabeçalho daquele arquivo.
 *
 * O que este teste prova: uma resposta que estoura todo limite antigo (naTela
 * longa, bloco de 45s, 11 parágrafos, 12 hashtags, 7 telas, 14 slides, lista de
 * um item) agora entrega as SEIS peças, em vez de derrubar o lote inteiro.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });

const erros = [];
page.on("console", (m) => m.type() === "error" && erros.push(m.text()));

await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Resibag", exact: true }).click();
await page.getByRole("button", { name: "Tema", exact: true }).click();
await page
  .getByPlaceholder("O que muda com a revisão da ANTT 5.998")
  .fill("Como fazer o descarte correto de resíduo perigoso");

const artigo = page.waitForResponse((r) => r.url().includes("/api/generate/artigo"));
await page.getByRole("button", { name: "Escrever o artigo" }).click();
await artigo;
await page.waitForTimeout(800);

// Marca os seis formatos, não só os sugeridos — é o lote inteiro que quebrava.
const caixas = page.locator('aside input[type="checkbox"], input[type="checkbox"]');
for (let i = 0; i < (await caixas.count()); i++) {
  const caixa = caixas.nth(i);
  const id = await caixa.getAttribute("id");
  if (id === "com-artigo") continue;
  if (!(await caixa.isChecked())) await caixa.check();
}

const pecas = page.waitForResponse((r) => r.url().includes("/api/derive"), { timeout: 60000 });
await page.getByRole("button", { name: /Gerar \d+ peças?/ }).click();
const r = await pecas;
const corpo = await r.json();
await page.waitForTimeout(1500);

console.log(`HTTP da derivação: ${r.status()}`);
if (corpo.error) console.log(`erro: ${corpo.error}`);
if (corpo.issues) console.log(`campos reprovados: ${JSON.stringify(corpo.issues)}`);

const banner = (await page.locator("div.border-danger-line").allTextContents())
  .map((t) => t.replace(/\s+/g, " ").trim())
  .join(" / ");
console.log(`banner de erro na tela: ${banner === "" ? "nenhum" : `"${banner}"`}`);

if (corpo.pieces) {
  console.log(`peças entregues: ${corpo.pieces.length} de 6 — ${corpo.pieces.map((p) => p.kind).join(", ")}`);
  for (const peca of corpo.pieces) {
    const d = peca.data;
    if (peca.kind.startsWith("carrossel-")) {
      console.log(
        `  ${peca.kind}: ${d.slides.length} slides · molduras ${d.slides[0].type}→${d.slides.at(-1).type}` +
          ` · numeração ${d.slides.every((s, i) => s.slideNumber === i + 1) ? "sequencial" : "QUEBRADA"}` +
          ` · maior bodyText ${Math.max(...d.slides.map((s) => (s.bodyText ?? "").length))} caracteres` +
          ` · assinatura "${d.slides[0].footerNote}"`,
      );
    }
    if (peca.kind === "post-texto") {
      console.log(`  post-texto: ${d.paragraphs.length} parágrafos · gancho ${d.hook.length} caracteres`);
    }
    if (peca.kind === "legenda") {
      console.log(`  legenda: ${d.hashtags.length} hashtags (${d.hashtags.join(" ")}) · ${d.body.length} blocos`);
    }
    if (peca.kind === "reels") {
      console.log(
        `  reels: ${d.beats.length} blocos · tempos ${d.beats.map((b) => `${b.seconds}s`).join(",")}` +
          ` · maior naTela ${Math.max(...d.beats.map((b) => b.naTela.length))} caracteres`,
      );
    }
    if (peca.kind === "stories") {
      console.log(`  stories: ${d.screens.length} telas · maior texto ${Math.max(...d.screens.map((s) => s.texto.length))} caracteres`);
    }
  }
  console.log(`recibo: US$ ${corpo.cost.usd.toFixed(4)} em ${corpo.cost.steps.length} linhas`);
}

// O que a TELA mostra, não o que a resposta diz.
const cartoes = await page.locator("text=Copiar texto").count();
console.log(`cartões de peça renderizados: ${cartoes}`);
await page.screenshot({ path: "scratchpad/pecas-1900.png", fullPage: false });
console.log(`erros de console: ${erros.length === 0 ? "nenhum" : JSON.stringify(erros.slice(0, 3))}`);

await browser.close();
