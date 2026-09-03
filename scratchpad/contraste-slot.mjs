/**
 * Contraste do cartão de falha, nos dois temas.
 *
 * Gate do projeto: corpo ≥ 4,5:1, rótulo pequeno e ornamento ≥ 3:1. Roda sobre
 * o app de verdade porque um token que passa no claro pode reprovar no escuro.
 */
import { chromium } from "playwright";

const b = await chromium.launch({ args: ["--no-proxy-server"] });

async function medir(escuro) {
  const p = await b.newPage({
    viewport: { width: 1900, height: 1000 },
    colorScheme: escuro ? "dark" : "light",
  });
  await p.goto("http://localhost:3100/esteira", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Resibag", exact: true }).click();
  await p.getByRole("button", { name: "Tema", exact: true }).click();
  await p.getByText("Escrever o artigo antes").click();
  await p.getByPlaceholder("O que muda com a revisão da ANTT 5.998").fill("Descarte — SO-O-REELS falha");
  await p.waitForTimeout(300);
  for (let i = 0; i < (await p.locator('input[type="checkbox"]').count()); i++) {
    const c = p.locator('input[type="checkbox"]').nth(i);
    if (!(await c.isChecked())) await c.check();
  }
  await p.getByRole("button", { name: /Gerar \d+ peças?/ }).click();
  await p.waitForResponse((r) => r.url().includes("/api/generate/avulso"), { timeout: 90000 });
  await p.waitForTimeout(1800);

  const res = await p.evaluate(() => {
    // Resolve QUALQUER notação de cor (oklab, oklch, rgb) e compõe o alfa
    // sobre o fundo. Ler os canais crus quebrava no `oklab(… / .8)` que o
    // Tailwind emite para `text-danger/80` — e um medidor que erra é pior que
    // medidor nenhum, porque dá alarme falso e esconde o real.
    const rgba = (cor) => {
      const cv = document.createElement("canvas").getContext("2d");
      cv.fillStyle = "#000";
      cv.fillStyle = cor;
      const resolvida = cv.fillStyle;
      if (resolvida.startsWith("#")) {
        const h = resolvida.slice(1);
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
      }
      const n = resolvida.match(/[\d.]+/g).map(Number);
      return [n[0], n[1], n[2], n[3] ?? 1];
    };
    const sobre = (frente, fundo) => {
      const [r, g, b, a] = rgba(frente);
      const [fr, fg, fb] = rgba(fundo);
      return [r * a + fr * (1 - a), g * a + fg * (1 - a), b * a + fb * (1 - a)];
    };
    const lumDe = ([r, g, b]) => {
      const [lr, lg, lb] = [r, g, b].map((v) => {
        const sc = v / 255;
        return sc <= 0.03928 ? sc / 12.92 : Math.pow((sc + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };
    const ratio = (frente, fundo) => {
      const [x, y] = [lumDe(sobre(frente, fundo)), lumDe(rgba(fundo).slice(0, 3))].sort(
        (m, n) => n - m,
      );
      return (x + 0.05) / (y + 0.05);
    };
    const fundoDe = (el) => {
      let n = el;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && !bg.includes("rgba(0, 0, 0, 0)")) return bg;
        n = n.parentElement;
      }
      return "rgb(255,255,255)";
    };
    const card = document.querySelector("div.border-danger-line");
    if (!card) return null;
    const alvos = [
      ["título da peça", card.querySelector("span.font-semibold"), 4.5],
      ["meta 'não saiu'", card.querySelector("span.font-mono"), 3],
      ["motivo", card.querySelectorAll("span.flex.items-start > span")[0], 4.5],
      ["campos reprovados", card.querySelectorAll("span.font-mono")[1], 4.5],
      ["cobrança", card.querySelector(".ml-auto"), 3],
    ];
    return alvos.filter(([, el]) => el).map(([nome, el, min]) => ({
      nome,
      min,
      razao: +ratio(getComputedStyle(el).color, fundoDe(el)).toFixed(2),
    }));
  });

  await p.close();
  return res;
}

for (const escuro of [false, true]) {
  const linhas = await medir(escuro);
  console.log(`\n── tema ${escuro ? "escuro" : "claro"} ──`);
  for (const l of linhas) {
    console.log(`${l.razao >= l.min ? "passa " : "REPROVA"} ${l.nome}: ${l.razao}:1 (mínimo ${l.min}:1)`);
  }
}
await b.close();
