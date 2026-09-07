/**
 * Painel de Situação: rotas, nav e interceptação da fila do CRM.
 *
 *   npx next dev -p 3100
 *   node scratchpad/painel-navegador.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://localhost:3100";
const LARGURA = 1900;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "painel-shots");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: LARGURA, height: 1100 } });

const erros = [];
page.on("console", (m) => m.type() === "error" && erros.push(m.text()));
page.on("pageerror", (e) => erros.push(String(e)));

await page.route("**/api/publish**", async (route) => {
  if (route.request().method() === "GET") {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        configured: true,
        pending: [
          {
            id: "pending-1",
            title: "Checklist ANTT na fila",
            summary: "Peça de teste",
            priority: "high",
            createdAt: "2026-09-04T12:00:00.000Z",
          },
        ],
      }),
    });
    return;
  }
  await route.continue();
});

await page.route("**/api/instalacao", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      integrations: [
        {
          id: "signals",
          label: "Sinais de mercado",
          env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
          configured: true,
        },
        {
          id: "crm_publish",
          label: "Fila de aprovação (CRM)",
          env: ["SUPABASE_URL", "CRM_AGENT_KEY"],
          configured: true,
        },
        {
          id: "shortener",
          label: "Encurtador (QR curto)",
          env: ["NEXT_PUBLIC_SHORTENER_BASE"],
          configured: false,
        },
        {
          id: "usd_brl",
          label: "Cotação USD → BRL",
          env: ["NEXT_PUBLIC_USD_BRL"],
          configured: true,
        },
        {
          id: "campaigns",
          label: "Campanhas de conteúdo",
          env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
          configured: true,
        },
      ],
    }),
  });
});

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

const titulo = await page.locator("h1").first().textContent();
const nav = await page.locator("header nav a").allTextContents();
const kpis = await page.locator("main section").first().locator("div.rounded-lg").count();
const pendingText = await page.getByText("Na fila do CRM").count();
const emptyOrCharts = await page.getByText(/Gasto por tipo|Gerações no mês/).count();

console.log(`título: ${titulo}`);
console.log(`nav: ${nav.join(" · ")}`);
console.log(`cards KPI (aprox): ${kpis}`);
console.log(`rótulo fila CRM presente: ${pendingText > 0}`);
console.log(`gráficos presentes: ${emptyOrCharts}`);

await page.screenshot({ path: join(OUT, "situacao-1900.png"), fullPage: true });

await page.getByRole("link", { name: "Instalação" }).click();
await page.waitForURL("**/esteira/instalacao");
await page.getByText("O que está ligado aqui").waitFor();
await page.locator("[data-status]").first().waitFor({ timeout: 8000 });
const instalacaoTitulo = await page.locator("h1").first().textContent();
const ligado = await page.locator('[data-status="on"]').count();
const desligado = await page.locator('[data-status="off"]').count();
console.log(`instalação título: ${instalacaoTitulo}`);
console.log(`integracoes ligadas: ${ligado}; desligadas: ${desligado}`);
await page.screenshot({ path: join(OUT, "instalacao-1900.png"), fullPage: true });

await page.getByRole("link", { name: "Fatos" }).click();
await page.waitForURL("**/esteira/fatos");
const fila = await page.getByText(/Para conferir, em ordem de risco/).count();
console.log(`fila de fatos presente: ${fila > 0}`);
await page.screenshot({ path: join(OUT, "fatos-1900.png"), fullPage: true });

await page.getByRole("link", { name: "Custos" }).click();
await page.waitForURL("**/esteira/custos");
const porTipo = await page.getByText(/Por tipo neste mês|neste mês/).count();
console.log(`custos com resumo: ${porTipo > 0}`);
await page.screenshot({ path: join(OUT, "custos-1900.png"), fullPage: true });

// Tema escuro no painel
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Tema:/ }).click();
await page.getByRole("button", { name: /Tema:/ }).click(); // sistema -> claro -> escuro (ou similar)
await page.screenshot({ path: join(OUT, "situacao-escuro-1900.png"), fullPage: true });

console.log(`erros de console: ${erros.length === 0 ? "nenhum" : JSON.stringify(erros.slice(0, 8))}`);
if (!titulo?.includes("Situação")) throw new Error("home não renderizou o painel");
if (!nav.includes("Situação") || !nav.includes("Instalação")) {
  throw new Error(`nav incompleta: ${nav.join(",")}`);
}
if (ligado < 1 || desligado < 1) throw new Error("instalação não mostrou ligado/desligado");

await browser.close();
console.log("ok");
