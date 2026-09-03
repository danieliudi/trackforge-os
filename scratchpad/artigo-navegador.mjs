/**
 * O caminho que o Daniel clicou, no app de verdade, com a resposta do modelo fixa.
 *
 * Custa zero: quem responde é `anthropic-mock.mjs`. O que roda é a rota inteira
 * — brief, generateObject, schema de fio, normalização, schema estrito,
 * auditoria e recibo.
 *
 * COMO RODAR (o Playwright não é dependência do projeto: `npm i -D playwright`
 * uma vez, ou rode com um instalado globalmente):
 *   node scratchpad/anthropic-mock.mjs 8787
 *   ANTHROPIC_API_KEY=teste ANTHROPIC_BASE_URL=http://127.0.0.1:8787/v1 \
 *     NEXT_PUBLIC_USD_BRL=5.40 npx next dev -p 3100
 *   node scratchpad/artigo-navegador.mjs      # caminho feliz
 *   node scratchpad/artigo-falhas.mjs         # 422 e 500
 *
 * Use `localhost` e não `127.0.0.1` na URL: o Next 16 bloqueia os chunks de dev
 * para origem cruzada, e sem eles o React não hidrata e os botões não respondem.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const LARGURA = 1900;

const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: LARGURA, height: 900 } });

const erros = [];
page.on("console", (m) => m.type() === "error" && erros.push(m.text()));

await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });

// Frente Resibag, origem "Tema" — exatamente o que estava na tela do print.
await page.getByRole("button", { name: "Resibag", exact: true }).click();
await page.getByRole("button", { name: "Tema", exact: true }).click();
await page
  .getByPlaceholder("O que muda com a revisão da ANTT 5.998")
  .fill("Como fazer o descarte correto de resíduo perigoso");

const resposta = page.waitForResponse((r) => r.url().includes("/api/generate/artigo"));
await page.getByRole("button", { name: "Escrever o artigo" }).click();

const r = await resposta;
const corpo = await r.json();

console.log(`HTTP da rota: ${r.status()}`);
if (corpo.error) console.log(`erro devolvido: ${corpo.error}`);
if (corpo.issues) console.log(`campos reprovados: ${JSON.stringify(corpo.issues)}`);

await page.waitForTimeout(1500);

// O que a TELA mostra — não o que a resposta diz.
const banner = await page.locator("text=No object generated").count();
const bannerQualquer = await page
  .locator("div.border-danger-line")
  .allTextContents()
  .catch(() => []);
const titulo = await page.locator("h1, h2").first().textContent().catch(() => null);
const paragrafos = await page.locator("article p, main p").count();

console.log(`banner "No object generated" na tela: ${banner}`);
console.log(`banner de erro visível: ${bannerQualquer.length === 0 ? "nenhum" : JSON.stringify(bannerQualquer)}`);

if (corpo.article) {
  const a = corpo.article;
  console.log(`título: ${a.title}`);
  console.log(`seções entregues: ${a.sections.length} (o schema antigo cortava em 8)`);
  console.log(`parágrafos da seção 1: ${a.sections[0].paragraphs.length} (o schema antigo cortava em 6)`);
  console.log(`takeaways: ${a.takeaways.length} (o schema antigo cortava em 5)`);
  console.log(`ideias de imagem: ${a.imageIdeas.length} (o schema antigo cortava em 4)`);
  console.log(`maior "describes": ${Math.max(...a.imageIdeas.map((i) => i.describes.length))} caracteres (teto 160)`);
  console.log(`maior "reason": ${Math.max(...a.suggestedOutputs.map((s) => s.reason.length))} caracteres (teto 180)`);
  console.log(`formatos sugeridos: ${a.suggestedOutputs.map((s) => s.kind).join(", ")}`);
  console.log(`fontes: ${JSON.stringify(a.sources)}`);
  console.log(`recibo: US$ ${corpo.cost.usd.toFixed(4)} em ${corpo.cost.steps.length} linhas — ${corpo.cost.steps.map((s) => s.label).join(" | ")}`);
  console.log(`parecer da auditoria: ${corpo.verification ? `${corpo.verification.claims.length} afirmação(ões), ${corpo.verification.flagged} sem fonte` : "ausente"}`);
}

console.log(`título renderizado na tela: ${titulo}`);
console.log(`parágrafos renderizados: ${paragrafos}`);

const marcados = await page.locator('input[type="checkbox"]:checked').count();
const botaoPecas = await page.getByRole("button", { name: /Gerar \d+ peça/ }).textContent();
console.log(`caixas marcadas pela sugestão: ${marcados}`);
console.log(`botão de peças: "${botaoPecas.trim()}"`);

const custoTopo = await page.locator("header, nav").first().textContent();
console.log(`custo no topo: ${custoTopo.replace(/\s+/g, " ").trim().slice(0, 80)}`);

await page.screenshot({ path: "scratchpad/artigo-1900.png", fullPage: false });
console.log(`\nerros de console: ${erros.length === 0 ? "nenhum" : JSON.stringify(erros.slice(0, 3))}`);

await browser.close();
