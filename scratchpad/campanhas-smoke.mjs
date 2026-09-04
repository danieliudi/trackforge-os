/**
 * Smoke do seletor de campanha da bancada — roda o `src/lib/campaigns.ts` de
 * verdade, com o `fetch` global trocado por um CRM de mentira.
 *
 * Existe porque o bug era invisível: o PostgREST respondia 200 com `[]` e a
 * tela dizia "crie no CRM" — a mesma frase de falta de credencial e de CRM
 * recusando. O caso 4 é o que garante que os motivos não se confundam mais.
 *
 * O caso 1 usa as três campanhas reais do Kanban de Campanhas em 03/09/2026 e
 * FIXA o comportamento esperado: nenhuma delas é oferecida, porque `Social` e
 * `Evento` não são canais de conteúdo. Ampliar o conjunto é decisão de
 * taxonomia do Daniel (DEC-1), não conserto de bug — se este caso um dia
 * passar a oferecer "Linkedin Resibag 2026", é porque a decisão foi tomada ou
 * porque alguém mexeu em `CONTENT_CHANNELS` sem ela.
 *
 *   node --experimental-strip-types --import ./scratchpad/campanhas-hook.mjs \
 *     scratchpad/campanhas-smoke.mjs
 */
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://crm.exemplo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-de-mentira";

const { fetchContentCampaigns, isContentChannel, CONTENT_CHANNELS } = await import(
  "@/lib/campaigns"
);

let lastUrl = null;

function crmRespondendo(rows, { status = 200, boom = null, body = null } = {}) {
  globalThis.fetch = async (url) => {
    lastUrl = String(url);
    if (boom) throw new Error(boom);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (body === "lixo") throw new SyntaxError("Unexpected token < in JSON");
        return rows;
      },
    };
  };
}

const nomes = (result) => result.campaigns.map((c) => c.name);

// ── 1. As três campanhas reais do CRM: nenhuma é de conteúdo ─────────────────
const kanbanReal = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Linkedin Resibag 2026",
    channel: "Social",
    company_ids: ["industria", "resibag"],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Eco Expo",
    channel: "Evento",
    company_ids: ["resibag"],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Mercopar",
    channel: "Evento",
    company_ids: ["industria"],
  },
];

crmRespondendo(kanbanReal);
const resibag = await fetchContentCampaigns("resibag");
const sanwey = await fetchContentCampaigns("sanwey");

// `status: "ok"` com lista vazia é a resposta CERTA aqui, e é o que a tela
// precisa distinguir do erro: não existe campanha de conteúdo, ponto.
assert.deepEqual(resibag, { status: "ok", campaigns: [] });
assert.deepEqual(sanwey, { status: "ok", campaigns: [] });

// Reetiquetar a campanha no CRM é o que a faz aparecer — sem tocar em código.
crmRespondendo([{ ...kanbanReal[0], channel: "Conteúdo" }]);
const reetiquetada = await fetchContentCampaigns("resibag");
assert.deepEqual(nomes(reetiquetada), ["Linkedin Resibag 2026"]);

console.log("1. kanban real →", {
  canaisNoCrm: kanbanReal.map((r) => `${r.name}: ${r.channel}`),
  ofertadasResibag: nomes(resibag),
  motivo: "Social e Evento não são canais de conteúdo (DEC-1 pendente)",
  seReetiquetadaComoConteudo: nomes(reetiquetada),
});

// A query não pode mais carregar filtro de canal — é o que sumia com acento.
assert.ok(!lastUrl.includes("channel="), `query ainda filtra canal: ${lastUrl}`);

// ── 2. Acento e caixa ────────────────────────────────────────────────────────
crmRespondendo([
  { id: "a1", name: "acentuada", channel: "Conteúdo", company_ids: [] },
  { id: "a2", name: "sem-acento", channel: "conteudo", company_ids: [] },
  { id: "a3", name: "caixa-alta", channel: "CONTEÚDO", company_ids: [] },
  { id: "a4", name: "com-espaco", channel: " Digital ", company_ids: [] },
  { id: "a5", name: "social", channel: "Social", company_ids: [] },
  { id: "a6", name: "social-minuscula", channel: "social", company_ids: [] },
  { id: "a7", name: "email", channel: "Email", company_ids: [] },
  { id: "a8", name: "outdoor", channel: "Outdoor", company_ids: [] },
  { id: "a9", name: "evento", channel: "Evento", company_ids: [] },
  { id: "a10", name: "sem-canal", channel: null, company_ids: [] },
]);
const variantes = await fetchContentCampaigns("resibag");
assert.deepEqual(nomes(variantes), ["acentuada", "sem-acento", "caixa-alta", "com-espaco"]);

// Normalizar acento/caixa não pode virar porta de entrada pra canal novo:
// `Social` e `social` são recusados do mesmo jeito.
assert.equal(isContentChannel("Social"), false);
assert.equal(isContentChannel("social"), false);

console.log("2. variantes de canal →", {
  canaisDeConteudo: [...CONTENT_CHANNELS],
  aceitos: nomes(variantes),
  recusados: ["Social", "social", "Email", "Outdoor", "Evento", "(null)"],
});

// ── 3. Escopo por frente ─────────────────────────────────────────────────────
crmRespondendo([
  { id: "b1", name: "so-sanwey", channel: "Conteúdo", company_ids: ["industria"] },
  { id: "b2", name: "so-resibag", channel: "Conteúdo", company_ids: ["resibag"] },
  { id: "b3", name: "grupo-todo", channel: "Conteúdo", company_ids: [] },
]);
assert.deepEqual(nomes(await fetchContentCampaigns("resibag")), ["so-resibag", "grupo-todo"]);
assert.deepEqual(nomes(await fetchContentCampaigns("sanwey")), ["so-sanwey", "grupo-todo"]);
assert.deepEqual(nomes(await fetchContentCampaigns(null)), [
  "so-sanwey",
  "so-resibag",
  "grupo-todo",
]);
console.log("3. escopo por frente → resibag e sanwey veem só a própria + a do grupo");

// ── 4. Os três motivos de lista vazia, distinguíveis ─────────────────────────
crmRespondendo([]);
const vazio = await fetchContentCampaigns("resibag");
assert.deepEqual(vazio, { status: "ok", campaigns: [] });

crmRespondendo([], { status: 401 });
const recusado = await fetchContentCampaigns("resibag");
assert.equal(recusado.status, "erro");
assert.match(recusado.detail, /HTTP 401/);

crmRespondendo([], { boom: "fetch failed" });
const fora = await fetchContentCampaigns("resibag");
assert.equal(fora.status, "erro");
assert.match(fora.detail, /fetch failed/);

crmRespondendo(null, { body: "lixo" });
const lixo = await fetchContentCampaigns("resibag");
assert.equal(lixo.status, "erro");
assert.match(lixo.detail, /não é JSON/);

delete process.env.SUPABASE_SERVICE_ROLE_KEY;
const semChave = await fetchContentCampaigns("resibag");
assert.deepEqual(semChave, { status: "sem-credencial" });
process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-de-mentira";

console.log("4. motivos distinguíveis →", {
  semCampanha: vazio.status,
  crmRecusou: `${recusado.status}: ${recusado.detail}`,
  crmForaDoAr: `${fora.status}: ${fora.detail}`,
  corpoInvalido: `${lixo.status}: ${lixo.detail}`,
  semVariavelDeAmbiente: semChave.status,
});

// Nenhuma mensagem pode carregar o valor da chave de serviço.
for (const r of [recusado, fora, lixo]) {
  assert.ok(!r.detail.includes("chave-de-mentira"), "detalhe vazou a credencial");
}

assert.equal(isContentChannel("Conteúdo"), true);
assert.equal(isContentChannel("Digital"), true);
assert.equal(isContentChannel("Evento"), false);

console.log("ok — 4 casos, nenhum detalhe de erro carrega credencial");
