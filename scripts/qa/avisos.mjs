/**
 * O achado de COOCORRENCIA renderiza legivel no painel que ja existe?
 *
 * A regra de par (`pair` em src/knowledge/types.ts) foi desenhada para caber nos
 * campos que a tela ja sabe mostrar — `matched`, `blockNumber`, `reason` — para
 * nao precisar de componente novo, que exigiria mockup aprovado antes (secao 4).
 * "Cabe nos campos" nao e "fica legivel", e a diferenca entre as duas coisas e
 * exatamente o que a secao 8 cobra: nunca reportar pronto so com typecheck.
 *
 * O que este roteiro NAO faz: testar a regra. Isso e `knowledge:coerencia`, com
 * 24 casos declarados. Aqui a pergunta e so de renderizacao.
 *
 * Os avisos saem pelo MESMO caminho da rota real (api/generate/artigo:162-168):
 * blocos do artigo via `articleBlocks`, nao blocos escritos a mao. Com numeracao
 * inventada o rotulo cai no travessao e esconde se a tela sabe nomear o bloco —
 * aconteceu na primeira versao deste teste.
 *
 * Uso: npm run qa:avisos   (precisa do app de pe)
 */
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { abrirNavegador, BASE, aquecer, novaPagina } from "./lib/navegador.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
register(pathToFileURL(join(ROOT, "scripts", "lib", "resolve-ts.mjs")));

const { findForbidden } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/check.ts")).href
);
const { articleBlocks } = await import(
  pathToFileURL(join(ROOT, "src/types/article.ts")).href
);

/**
 * Tagline (Nivel 01) no dek, slogan (Nivel 03) no corpo. Nenhum dos dois e
 * proibido sozinho — e por isso que so a regra de par pega.
 */
const ARTIGO = {
  title: "O que a auditoria cobra de um big bag",
  dek: "Gestao inteligente de residuos.",
  targetAudience: "Gerente de EHS",
  sections: [
    {
      heading: "O que a homologacao cobre",
      paragraphs: ["Homologacao INMETRO para residuo perigoso Classe I, em 700 kg e 1000 kg."],
    },
    {
      heading: "O custo que ninguem soma",
      paragraphs: ["5 tambores parecem mais baratos. Juntos, pesam e custam mais que 1 Resibag."],
    },
  ],
  takeaways: ["Peca o certificado INMETRO junto com o lote."],
  sources: [],
  imageIdeas: [],
  suggestedOutputs: [],
};

const warnings = findForbidden(
  articleBlocks(ARTIGO).map((b) => ({ blockNumber: b.number, text: b.text })),
  "resibag",
);

const problemas = [];
if (warnings.length === 0) {
  problemas.push("a regra de par nao disparou no artigo de teste — nada a renderizar");
}

await aquecer(["/esteira"]);
const navegador = await abrirNavegador();
const { pagina } = await novaPagina(navegador, { largura: 1900, altura: 1100, front: "resibag" });

await pagina.route("**/api/generate/artigo**", (r) =>
  r.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ article: ARTIGO, cost: null, warnings, verification: null }),
  }),
);

await pagina.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await pagina.getByText("Texto", { exact: true }).first().click();
await pagina
  .locator("textarea")
  .first()
  .fill(
    "Material de teste com folga acima do minimo exigido pela tela. Resibag " +
      "Comercial Ltda., marca do Grupo Sanwey, fundada em 2022, sede em Taboao da " +
      "Serra. Linha Standard homologada no INMETRO para residuo perigoso Classe I.",
  );
await pagina.getByRole("button", { name: /escrever o artigo/i }).click();
await pagina.waitForTimeout(1500);

const painel = pagina.getByText("Termo proibido pela marca").locator("..");
if (!(await painel.isVisible().catch(() => false))) {
  problemas.push("o painel de avisos nao apareceu");
} else {
  const texto = await painel.innerText();
  // O achado precisa carregar OS DOIS trechos e o bloco NOMEADO. Um travessao
  // no lugar do nome quer dizer que a tela nao soube localizar o achado.
  if (!texto.includes("+")) problemas.push("o achado nao mostrou os dois trechos do par");
  if (/ em . — /.test(texto)) problemas.push("o bloco saiu sem nome (travessao)");
  if (!texto.includes("O custo que ninguem soma") && !texto.includes("O custo que ningu"))
    problemas.push("o achado nao apontou o bloco onde a violacao se completou");
  console.log(`achado renderizado:\n  ${texto.replace(/\n/g, "\n  ")}`);
}

await navegador.close();

if (problemas.length) {
  console.log(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`  x ${p}`);
  process.exit(1);
}
console.log("\nok o achado de coocorrencia aparece com os dois trechos e o bloco nomeado");
