/**
 * Contraste dos rótulos/métricas do painel Situação, nos dois temas.
 *   node scratchpad/painel-contraste.mjs
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const b = await chromium.launch({ args: ["--no-proxy-server"] });

async function medir(escuro) {
  const p = await b.newPage({
    viewport: { width: 1900, height: 1100 },
    colorScheme: escuro ? "dark" : "light",
  });
  await p.addInitScript((dark) => {
    try {
      localStorage.setItem("trackforge:tema:v1", dark ? "escuro" : "claro");
    } catch {}
  }, escuro);

  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);

  const res = await p.evaluate(() => {
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
        if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") return bg;
        n = n.parentElement;
      }
      return "rgb(255,255,255)";
    };

    const h1 = document.querySelector("h1");
    const label = document.querySelector("main .uppercase");
    const metric = document.querySelector("main .tabular-nums");
    const alvos = [
      ["título h1", h1, 4.5],
      ["rótulo KPI", label, 3],
      ["métrica KPI", metric, 4.5],
    ];

    return alvos.map(([nome, el, min]) => {
      if (!el) return { nome, ok: false, motivo: "elemento ausente" };
      const cor = getComputedStyle(el).color;
      const fundo = fundoDe(el);
      const r = ratio(cor, fundo);
      return { nome, ok: r >= min, ratio: Number(r.toFixed(2)), min, cor, fundo };
    });
  });

  console.log(escuro ? "tema escuro" : "tema claro");
  for (const row of res) {
    console.log(
      row.ok
        ? `  ok  ${row.nome}: ${row.ratio}:1 (mín ${row.min})`
        : `  FAIL ${row.nome}: ${row.ratio ?? "—"}:1 (mín ${row.min}) ${row.motivo ?? ""}`,
    );
  }
  if (res.some((r) => !r.ok)) throw new Error("contraste reprovado");
  await p.close();
}

await medir(false);
await medir(true);
await b.close();
console.log("contraste ok");
