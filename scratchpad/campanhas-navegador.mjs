/**
 * O seletor de campanha na bancada de verdade, com o CRM interceptado.
 *
 * O bug: com as três campanhas que existem no Kanban de Campanhas (canais
 * `Social` e `Evento`), a lista vinha vazia e a tela mandava criar campanha no
 * CRM — a mesma frase que aparecia quando faltava credencial ou quando o CRM
 * recusava. Este teste prova os quatro estados na tela, sem gastar geração:
 * a produção é semeada no localStorage e reaberta por `?abrir=`.
 *
 * COMO RODAR:
 *   npx next dev -p 3100
 *   node scratchpad/campanhas-navegador.mjs [http://localhost:3100]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";

const producao = {
  id: "smoke-campanha",
  at: Date.now(),
  brandId: "resibag",
  source: "Descarte de resíduo perigoso",
  origin: { mode: "tema", input: "Descarte de resíduo perigoso", signalId: null, fileName: null },
  title: "Descarte de resíduo perigoso",
  article: {
    title: "Descarte de resíduo perigoso",
    dek: "O que muda no transporte com a Resolução ANTT nº 5.998/2022.",
    targetAudience: "Gestores de resíduo industrial",
    sections: [
      {
        heading: "O documento de transporte",
        paragraphs: ["O MTR acompanha a carga do gerador ao destino final."],
      },
    ],
    takeaways: ["Confira o MTR antes de liberar a carga."],
    sources: [{ label: "Resolução ANTT nº 5.998/2022" }],
    suggestedOutputs: [],
    imageIdeas: [],
  },
  images: [],
  pieces: [
    {
      kind: "post-texto",
      data: {
        hook: "O MTR não é burocracia: é a prova de que o resíduo chegou onde devia.",
        paragraphs: ["Sem o documento, a responsabilidade continua com o gerador."],
        cta: "Confira o MTR antes de liberar a carga.",
      },
      from: "derivado do artigo",
      flagged: 0,
    },
  ],
  sent: false,
  contentId: "rb-7a2f",
  campaignId: null,
  campaignName: null,
};

const CENARIOS = [
  {
    nome: "campanhas-listadas",
    corpo: {
      status: "ok",
      campaigns: [
        { id: "11111111-1111-4111-8111-111111111111", name: "Linkedin Resibag 2026", channel: "Social" },
        { id: "44444444-4444-4444-8444-444444444444", name: "resibag-202609-rapp", channel: "Conteúdo" },
      ],
    },
    espera: "Linkedin Resibag 2026 · Social",
  },
  {
    nome: "sem-campanha-de-conteudo",
    corpo: { status: "ok", campaigns: [] },
    espera: "Nenhuma campanha de conteúdo encontrada",
  },
  {
    nome: "sem-credencial",
    corpo: { status: "sem-credencial", campaigns: [] },
    espera: "SUPABASE_SERVICE_ROLE_KEY",
  },
  {
    nome: "crm-recusou",
    corpo: { status: "erro", campaigns: [], detail: "o CRM respondeu HTTP 401" },
    espera: "Erro ao carregar campanhas",
  },
];

const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const erros = [];

// Claro E escuro: um token que passa no claro pode reprovar no escuro, e a
// mensagem de erro nova usa `text-danger`/`text-warn`, que mudam de valor.
for (const tema of ["light", "dark"]) {
for (const cenario of CENARIOS) {
  const page = await browser.newPage({
    viewport: { width: 1900, height: 1000 },
    colorScheme: tema,
  });
  page.on("console", (m) => m.type() === "error" && erros.push(`${cenario.nome}: ${m.text()}`));
  page.on("pageerror", (e) => erros.push(`${cenario.nome}: ${e.message}`));

  await page.addInitScript(
    ([run]) => {
      localStorage.setItem("carousel-builder:front:v1", "resibag");
      localStorage.setItem("carousel-builder:producoes:v1", JSON.stringify([run]));
    },
    [producao],
  );

  await page.route("**/api/publish**", (route) =>
    route.fulfill({ json: { configured: true, pending: [] } }),
  );
  await page.route("**/api/signals**", (route) =>
    route.fulfill({ json: { configured: true, signals: [] } }),
  );
  await page.route("**/api/campaigns**", (route) => route.fulfill({ json: cenario.corpo }));

  await page.goto(`${BASE}/esteira?abrir=${producao.id}`, { waitUntil: "networkidle" });

  const select = page.locator("select").first();
  await select.waitFor({ state: "visible", timeout: 15000 });

  const opcoes = await select.locator("option").allInnerTexts();
  const rodape = await page
    .locator("label", { has: page.locator("select") })
    .locator("span")
    .last()
    .innerText();

  await page.screenshot({
    path: `scratchpad/campanha-${cenario.nome}-${tema}.png`,
    clip: { x: 1180, y: 0, width: 720, height: 1000 },
  });

  const texto = `${opcoes.join(" | ")} ${rodape}`;
  if (!texto.includes(cenario.espera)) {
    erros.push(`${cenario.nome}: esperava "${cenario.espera}" e a tela mostrou "${texto}"`);
  }

  console.log(`${cenario.nome} (${tema})`, {
    opcoes: opcoes.map((o) => o.trim()),
    rodape: rodape.replace(/\s+/g, " ").trim(),
  });
  await page.close();
}
}

await browser.close();

if (erros.length > 0) {
  console.error("FALHOU:", erros);
  process.exit(1);
}
console.log(`ok — ${CENARIOS.length} estados do seletor em claro e escuro, sem erro de console`);
