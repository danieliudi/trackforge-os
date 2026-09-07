import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "telas-shots");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await browser.newPage({ viewport: { width: 1900, height: 1100 } });

const routes = [
  ["pecas", "/esteira/pecas", "O que já foi produzido"],
  ["fatos", "/esteira/fatos", "O que a ferramenta pode afirmar"],
  ["custos", "/esteira/custos", "O que a API cobrou"],
  ["instalacao", "/esteira/instalacao", "O que está ligado aqui"],
  ["biblioteca", "/biblioteca", "Imagens da frente"],
];

for (const [name, path, title] of routes) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  console.log(`${name}: ${h1}`);
  if (!h1?.includes(title.split(" ")[0])) throw new Error(`${name} título inesperado: ${h1}`);
  await page.screenshot({ path: join(OUT, `${name}-1900.png`), fullPage: true });
}

await browser.close();
console.log("ok");
