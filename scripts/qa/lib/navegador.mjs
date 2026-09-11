/**
 * Playwright para a suíte de QA, resolvido sem entrar nas dependências do
 * projeto.
 *
 * POR QUE NÃO É `devDependency`: o Playwright baixa navegador — centenas de MB
 * por máquina, em `npm install`, para uma ferramenta que roda em fim de entrega
 * e em auditoria. Quem só quer subir o app não deveria pagar esse download.
 *
 * POR QUE NÃO É CAMINHO FIXO: a primeira versão destes roteiros apontava para
 * `/opt/pw-browsers/...`, que é o sandbox de uma sessão e não existe em mais
 * lugar nenhum. Suíte que só roda numa máquina não é suíte. Aqui a resolução
 * tenta, em ordem: o projeto, a instalação global, e então explica como
 * instalar em vez de estourar com "Cannot find module".
 */

import { readFileSync } from "node:fs";

const CAMINHOS = [
  "playwright",
  "playwright-core",
  // instalação global do npm em imagens Linux
  "/usr/lib/node_modules/playwright/index.mjs",
  "/usr/local/lib/node_modules/playwright/index.mjs",
  "/opt/node22/lib/node_modules/playwright/index.mjs",
];

export async function abrirNavegador() {
  let playwright = null;
  for (const caminho of CAMINHOS) {
    try {
      playwright = await import(caminho);
      break;
    } catch {
      // tenta o próximo
    }
  }

  if (!playwright) {
    console.error(
      "\nPlaywright não encontrado. Ele fica FORA das dependências do projeto de\n" +
        "propósito (baixa navegador). Para rodar a suíte:\n\n" +
        "  npm i -g playwright && npx playwright install chromium\n",
    );
    process.exit(1);
  }

  // Sem `executablePath`: o Playwright acha o navegador dele. Em imagem que já
  // traz o navegador, `PLAYWRIGHT_BROWSERS_PATH` cuida do resto.
  return playwright.chromium.launch();
}

/** Onde o app está de pé. Sobrescreva com `QA_BASE` para apontar para outra. */
export const BASE = process.env.QA_BASE ?? "http://localhost:3000";

/**
 * Senha do `src/proxy.ts`, quando a instância varrida tem uma.
 *
 * ISTO EXISTE POR CAUSA DA ARMADILHA DA SEÇÃO 12: com `APP_PASSWORD` definida,
 * toda rota responde 401 e a varredura reportaria N telas limpas que são N telas
 * de bloqueio. As marcas de cada rota já pegam isso — foi medido, 22 de 22
 * reprovaram. O que faltava era o outro lado: sem forma de PASSAR a senha, a
 * suíte não roda contra o app publicado, que é justamente onde a variável está
 * definida e onde uma auditoria importa mais.
 *
 * Só o nome sai em log, nunca o valor (CLAUDE.md seção 3).
 */
const SENHA = process.env.QA_SENHA;
export const CREDENCIAIS = SENHA ? { username: "trackforge", password: SENHA } : undefined;

/**
 * Compila cada rota ANTES de medir.
 *
 * O `next dev` compila sob demanda: a primeira visita a `/` num servidor recém
 * subido levou 33s aqui, e o `goto` do roteiro estoura em 25s. O resultado é uma
 * reprovação que não é do app — e reprovação falsa custa mais que cobertura
 * faltando, porque é o que faz alguém parar de rodar a suíte.
 *
 * Um GET simples por rota basta: o custo de compilação é pago uma vez, e o
 * corpo é descartado. Erro de rede aqui é ignorado de propósito — quem reporta
 * rota fora do ar é o roteiro, com a marca dela.
 */
export async function aquecer(rotas) {
  const cabecalhos = SENHA
    ? { authorization: `Basic ${Buffer.from(`trackforge:${SENHA}`).toString("base64")}` }
    : {};
  const comeco = Date.now();
  for (const rota of rotas) {
    try {
      await fetch(`${BASE}${rota}`, { headers: cabecalhos, signal: AbortSignal.timeout(120_000) });
    } catch {
      // Silêncio proposital: a varredura é quem julga se a rota responde.
    }
  }
  const s = Math.round((Date.now() - comeco) / 1000);
  if (s > 3) console.log(`(compilou ${rotas.length} rotas em ${s}s antes de medir)`);
}

/**
 * Página com a rede presa e o estado semeado.
 *
 * TODA rota de API é interceptada: a suíte não pode gastar a chave da Anthropic
 * nem depender do CRM estar de pé. O `publish` responde separado porque a casca
 * e a home leem dele para saber o que espera decisão.
 */
export async function novaPagina(navegador, opcoes = {}) {
  const {
    largura = 1900,
    altura = 1000,
    tema = "claro",
    front = "resibag",
    producoes = [],
    publish = { configured: false, pending: [] },
    /**
     * A tela de Instalação lista o que a rota devolve. Com a resposta genérica
     * (`integrations: []`) ela renderiza zero linhas e os alvos de contraste
     * dela não têm o que medir — cobertura que evapora em silêncio. O padrão
     * traz uma faltando de propósito: é o estado que a tela existe para avisar.
     */
    instalacao = {
      integrations: [
        { id: "signals", label: "Sinais de mercado", env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"], configured: true },
        { id: "crm_publish", label: "Fila de aprovação (CRM)", env: ["SUPABASE_URL", "CRM_AGENT_KEY"], configured: true },
        { id: "imagens", label: "Busca de imagem", env: ["UNSPLASH_ACCESS_KEY"], configured: true },
        { id: "senha", label: "Senha na frente do app", env: ["APP_PASSWORD"], configured: false },
      ],
    },
    localStorage: extra = {},
  } = opcoes;

  const pagina = await navegador.newPage({
    viewport: { width: largura, height: altura },
    colorScheme: tema === "escuro" ? "dark" : "light",
    // `undefined` quando não há senha: o Playwright ignora a chave, e a
    // varredura em localhost continua sem cerimônia nenhuma.
    httpCredentials: CREDENCIAIS,
  });

  const problemas = [];
  pagina.on("pageerror", (e) => problemas.push(`exceção: ${e.message}`));
  pagina.on("console", (m) => {
    if (m.type() === "error") problemas.push(`console: ${m.text().slice(0, 140)}`);
  });

  // Genérica primeiro, específica depois: no Playwright a ÚLTIMA rota
  // registrada é a que vence, e a ordem contrária já engoliu um teste inteiro.
  await pagina.route("**/api/**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        configured: false,
        pending: [],
        signals: [],
        campaigns: [],
        images: [],
        integrations: [],
      }),
    }),
  );
  await pagina.route("**/api/publish**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(publish) }),
  );
  await pagina.route("**/api/instalacao**", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(instalacao) }),
  );

  /**
   * SEMEIA, NÃO REINICIA. O `addInitScript` roda a CADA carregamento de
   * documento, então gravar por cima aqui apagaria toda escolha feita por clique
   * assim que o teste navegasse para a próxima tela — e um teste de persistência
   * que zera o estado antes de conferir passa sempre, medindo a própria semente.
   * Foi o que aconteceu na primeira rodada: "a frente sobrevive à troca de tela"
   * reprovou por causa disto, não por causa do app.
   *
   * `tema` e `front` são string crua; `producoes` é JSON. É o formato que cada
   * store grava — semear no formato errado faz o store cair no padrão em
   * silêncio, que também é um verde falso.
   */
  await pagina.addInitScript(
    ([t, f, p, ex]) => {
      const semear = (chave, valor) => {
        if (localStorage.getItem(chave) === null) localStorage.setItem(chave, valor);
      };
      semear("trackforge:tema:v1", t);
      semear("trackforge:front:v1", f);
      semear("trackforge:producoes:v1", JSON.stringify(p));
      for (const [k, v] of Object.entries(ex)) semear(k, v);
    },
    [tema, front, producoes, extra],
  );

  return { pagina, problemas };
}

/**
 * Contraste de um elemento REAL, medido dentro da página.
 *
 * TRÊS ERROS DE MEDIÇÃO JÁ ACONTECERAM NESTE PROJETO, e cada linha aqui existe
 * por causa de um deles:
 *
 * 1. LER OS CANAIS DA STRING. O Tailwind v4 emite `oklab(… / .7)` para
 *    `text-paper/70`; pegar os três primeiros números de lá e chamar de RGB dá
 *    um número inventado. A resolução passa pelo canvas, que aceita qualquer
 *    notação e devolve rgb.
 * 2. IGNORAR O `opacity` DO ELEMENTO. A faixa usa `opacity-70` nos itens de
 *    navegação — opacidade de elemento, não alfa de cor. Sem multiplicar pelos
 *    ancestrais, um item medido "16:1" na verdade é 10:1.
 * 3. TRATAR `transparent` COMO FUNDO. O fundo real é o do primeiro ancestral
 *    opaco; parar no elemento dá contraste contra o nada.
 *
 * É função de verdade, não string: o Playwright serializa o código para dentro
 * da página, e por isso ela não pode fechar sobre nada deste módulo.
 *
 * 4. NÃO ENXERGAR PSEUDO-ELEMENTO. `placeholder` não está no DOM: a sonda
 *    percorre nós e não o vê, e nenhum alvo o declarava. Em 11/09/2026 os
 *    placeholders do composer e do campo de ângulo estavam em **3,56:1 no tema
 *    claro** — reprovando — e passando no escuro, sem que nada olhasse. Daí o
 *    segundo parâmetro: `medirContraste(el, "::placeholder")`. É o MESMO
 *    medidor, e tem de ser: um segundo medidor é como o número sai errado e
 *    parece certo (seção 4).
 */
export function medirContraste(el, pseudo) {
  const cv = document.createElement("canvas").getContext("2d");
  const rgba = (cor) => {
    cv.fillStyle = "#000";
    cv.fillStyle = cor;
    const r = cv.fillStyle;
    if (r.startsWith("#")) {
      const h = r.slice(1);
      return [...[0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), 1];
    }
    const n = r.match(/[\d.]+/g).map(Number);
    return [n[0], n[1], n[2], n[3] ?? 1];
  };

  // Fundo real: primeiro ancestral com cor de fundo opaca.
  let base = el;
  let fundo = null;
  while (base) {
    const c = getComputedStyle(base).backgroundColor;
    if (c && rgba(c)[3] > 0) {
      fundo = rgba(c).slice(0, 3);
      break;
    }
    base = base.parentElement;
  }
  if (!fundo) fundo = [255, 255, 255];

  // Opacidade acumulada do elemento até (sem incluir) quem pinta o fundo.
  let opacidade = 1;
  for (let n = el; n && n !== base; n = n.parentElement) {
    opacidade *= Number(getComputedStyle(n).opacity);
  }

  const cor = rgba(getComputedStyle(el, pseudo ?? null).color);
  const a = cor[3] * opacidade;
  const frente = [cor[0], cor[1], cor[2]].map((c, i) => c * a + fundo[i] * (1 - a));

  const lum = (canais) => {
    const [r, g, b] = canais.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [alto, baixo] = [lum(frente), lum(fundo)].sort((m, n) => n - m);

  return {
    razao: Math.round(((alto + 0.05) / (baixo + 0.05)) * 100) / 100,
    // O texto medido volta junto de propósito: seletor que casa com o elemento
    // errado é a falha mais cara desta suíte, e ela fica invisível se o
    // relatório só imprime números.
    texto: (pseudo === "::placeholder"
      ? el.placeholder ?? ""
      : el.innerText || el.textContent || ""
    ).replace(/\s+/g, " ").trim().slice(0, 32),
    opacidade: Math.round(opacidade * 100) / 100,
  };
}

/**
 * Nomes dos tokens de cor, lidos do `globals.css`.
 *
 * Serve ao detector de colisão abaixo. Ler do CSS em vez de manter uma lista
 * aqui é o que impede o detector de envelhecer em silêncio: token novo entra
 * na varredura no mesmo commit em que nasce.
 */
export function tokensDeCor() {
  const css = readFileSync(new URL("../../../src/app/globals.css", import.meta.url), "utf8");
  return [...new Set([...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]))];
}

/**
 * Elementos que declaram DUAS cores para a mesma propriedade.
 *
 * POR QUE ISTO EXISTE: `clsx(panelClass, urgent && "bg-acc")` deixa `bg-surface`
 * e `bg-acc` na mesma lista de classes, e quem vence é a ordem do CSS GERADO,
 * não a ordem da string. O Tailwind emite os utilitários em ordem alfabética do
 * token, então `bg-acc` sai antes de `bg-surface` e PERDE — silenciosamente.
 *
 * Custou dois defeitos no mesmo componente: o cartão urgente que nunca ficou
 * laranja (1,04:1 no escuro) e o rótulo dele (1,79:1 no claro). Nenhum dos dois
 * quebra typecheck ou lint, e no tema claro o primeiro parecia certo.
 *
 * É função de verdade porque o Playwright a serializa para dentro da página.
 */
export function colisoesDeCor(nomes) {
  const propriedades = ["bg", "text", "border"];
  const achados = [];

  for (const el of document.querySelectorAll("*")) {
    const classes = (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
    if (classes.length < 2) continue;

    for (const prop of propriedades) {
      const cores = new Set();
      for (const c of classes) {
        // Classe COM modificador não colide: `hover:bg-acc-soft`,
        // `focus-visible:border-acc` e `placeholder:text-faint` valem em outro
        // estado ou noutro pseudo-elemento. Considerar só as incondicionais —
        // ignorar isto encheu a primeira rodada de alarme falso.
        if (c.includes(":")) continue;
        const token = c.split("/")[0].slice(prop.length + 1);
        if (c.startsWith(prop + "-") && nomes.includes(token)) cores.add(token);
      }
      if (cores.size > 1) {
        achados.push({
          prop,
          cores: [...cores].sort(),
          tag: el.tagName.toLowerCase(),
          classe: classes.join(" ").slice(0, 110),
          texto: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
        });
      }
    }
  }
  return achados;
}
