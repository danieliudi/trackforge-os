/**
 * Os dois caminhos de falha, na tela: o que a mensagem diz e o que o recibo mostra.
 *
 * O 422 é artigo genuinamente quebrado (o que a normalização não conserta).
 * O 500 é a API fora do ar no meio da redação. Nos dois o gasto tem que aparecer.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--no-proxy-server"] });

async function rodar(tema, titulo) {
  const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });
  await page.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resibag", exact: true }).click();
  await page.getByRole("button", { name: "Tema", exact: true }).click();
  await page.getByPlaceholder("O que muda com a revisão da ANTT 5.998").fill(tema);

  const espera = page.waitForResponse((r) => r.url().includes("/api/generate/artigo"));
  await page.getByRole("button", { name: "Escrever o artigo" }).click();
  const r = await espera;
  const corpo = await r.json();
  await page.waitForTimeout(1200);

  const banner = (await page.locator("div.border-danger-line").allTextContents())
    .map((t) => t.replace(/\s+/g, " ").trim())
    .join(" / ");

  console.log(`\n── ${titulo} ──`);
  console.log(`HTTP: ${r.status()}`);
  console.log(`campos reprovados: ${JSON.stringify(corpo.issues ?? null)}`);
  console.log(
    `recibo devolvido: ${corpo.cost ? `US$ ${corpo.cost.usd.toFixed(4)} em ${corpo.cost.steps.length} linha(s) — ${corpo.cost.steps.map((s) => s.label).join(" | ")}` : "NENHUM (gasto escondido)"}`,
  );
  console.log(`banner na tela: "${banner}"`);
  console.log(`artigo na tela: ${(await page.locator("text=Baixar .md").count()) > 0 ? "sim" : "não"}`);
  await page.screenshot({ path: `scratchpad/falha-${titulo.replace(/\W+/g, "-")}.png` });
  await page.close();
  return corpo;
}

await rodar("Tema QUEBRADO para forçar artigo inválido", "422 artigo invalido");

await rodar("Tema FORA-DE-FORMA que nem o schema de fio aceita", "500 resposta sem forma");

await browser.close();
