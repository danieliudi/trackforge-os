/**
 * O contador de plataforma aparece no cartão da peça — e diz a verdade.
 *
 * POR QUE ESTE ROTEIRO EXISTE. O contador tem três comportamentos que um
 * typecheck não distingue: contar, dizer "sem lastro" quando ninguém conferiu o
 * limite, e SUMIR nos formatos em que contar seria medir a coisa errada. Os três
 * são regra de produto, não de tipo — e o terceiro é o mais fácil de quebrar sem
 * perceber, porque o roteiro do Reels tem texto e parece contável.
 *
 * A conta também é verificada CONTRA O QUE O BOTÃO COPIA, não contra um número
 * que este roteiro recalcula do seu jeito: ele lê o `toPlainText` do próprio app
 * pela área de transferência e compara. Recalcular aqui provaria que duas contas
 * minhas batem, não que a tela conta certo.
 */
import { abrirNavegador, aquecer, BASE, medirContraste, novaPagina } from "./lib/navegador.mjs";

/**
 * O artigo tem `sections`, não `blocks` — conferido em `src/types/article.ts`.
 * A primeira versão deste roteiro inventou a forma e a tela estourou com
 * "article.sections is not iterable": fixture errado reprova como se fosse
 * defeito do app.
 */
const ARTIGO = {
  title: "Quem responde pelo resíduo depois que o caminhão sai",
  dek: "A norma classifica; a responsabilidade não embarca junto.",
  targetAudience: "Gestores de resíduo em indústria",
  sections: [
    {
      heading: "O que a norma faz",
      paragraphs: ["A NBR 10.004:2024 classifica o resíduo sólido quanto à periculosidade."],
    },
    {
      heading: "O que ela não faz",
      paragraphs: ["Classificar não é transferir: o gerador responde pela destinação até o fim."],
    },
  ],
  takeaways: ["Confira a documentação do transportador antes de contratar."],
  sources: [],
  // `suggestedOutputs` e `imageIdeas` têm `.default([])` no schema, então uma
  // resposta REAL nunca chega sem eles. Uma resposta forjada chega — e a tela
  // estoura em ".find of undefined". O fixture precisa do artigo inteiro.
  suggestedOutputs: [],
  imageIdeas: [],
};

const PECAS = [
  {
    kind: "post-texto",
    data: {
      hook: "O caminhão sai, o resíduo continua seu.",
      paragraphs: [
        "A NBR 10.004:2024 classifica o resíduo quanto à periculosidade.",
        "Classificar não é transferir.",
      ],
      cta: "Confira a documentação do seu transportador.",
    },
    from: "derivado do artigo",
    warnings: [],
    verification: null,
  },
  {
    kind: "reels",
    data: {
      hook: "Seu resíduo saiu do portão. Ele ainda é seu.",
      beats: [
        { seconds: 8, fala: "O caminhão leva o resíduo, não a responsabilidade.", naTela: "NÃO EMBARCA" },
        { seconds: 9, fala: "A norma classifica. Quem responde é o gerador.", naTela: "NBR 10.004:2024" },
        { seconds: 7, fala: "Exija a documentação.", naTela: "DOCUMENTE" },
      ],
      cta: "Salve para conferir depois.",
    },
    from: "derivado do artigo",
    warnings: [],
    verification: null,
  },
];

const problemas = [];

await aquecer(["/esteira"]);
const navegador = await abrirNavegador();
const { pagina } = await novaPagina(navegador, { largura: 1900, altura: 1200, front: "resibag" });
await pagina.context().grantPermissions(["clipboard-read", "clipboard-write"]);

await pagina.route("**/api/generate/artigo**", (r) =>
  r.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ article: ARTIGO, cost: null, warnings: [], verification: null }),
  }),
);
await pagina.route("**/api/derive**", (r) =>
  r.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ pieces: PECAS, failures: [], cost: null }),
  }),
);

await pagina.goto(`${BASE}/esteira`, { waitUntil: "networkidle" });
await pagina.getByText("Texto", { exact: true }).first().click();
await pagina
  .locator("textarea")
  .first()
  .fill(
    // O mínimo da tela reprova texto curto: o botão fica desabilitado e o
    // roteiro estoura num timeout que parece bug do app e é do teste.
    "Material de teste com folga acima do minimo exigido pela tela. O gerador " +
      "responde pela destinacao do residuo ate o fim da cadeia, e a norma de " +
      "classificacao nao transfere essa responsabilidade para o transportador. " +
      "Resibag Comercial Ltda., marca do Grupo Sanwey, fundada em 2022, com sede " +
      "em Taboao da Serra. Linha Standard homologada no INMETRO.",
  );
await pagina.getByRole("button", { name: /escrever o artigo/i }).click();
await pagina.waitForTimeout(1400);

// A tela nasce com "0 DE 6 MARCADAS" e o botão de gerar DESABILITADO — marcar é
// passo obrigatório, não detalhe. Os dois formatos aqui são escolhidos de
// propósito: um que tem régua e um que não tem.
// A célula é `<label>` com a caixa `sr-only` dentro. Clicar na CAIXA não
// funciona — ela não tem área — e é o rótulo que o dedo acerta na tela real.
// Clicar no texto é o gesto do usuário, e é o que o `<label>` existe para fazer.
await pagina.getByText("Post de texto", { exact: true }).click();
await pagina.getByText("Roteiro de Reels", { exact: true }).click();
await pagina.waitForTimeout(300);
await pagina.getByRole("button", { name: /^Gerar \d+ pe/i }).click();
await pagina.waitForTimeout(1800);

/**
 * O texto da coluna de saída, fatiado por cartão.
 *
 * POR QUE NÃO POR ANCESTRAL NO DOM: a primeira versão pegava o cartão com
 * `filter({hasText})` + `.last()` e casava com um contêiner que continha OS DOIS
 * cartões — as três asserções reprovaram com o contador funcionando na tela.
 * Fatiar o texto pelos títulos é menos esperto e não mente.
 */
const paginaToda = await pagina.locator("body").innerText();
// `lastIndexOf`, e não `indexOf`: cada título aparece DUAS vezes na página — na
// grade de formatos, lá em cima, e no cartão da peça gerada. Buscar do começo
// fatiava a grade e devolvia quase nada, e as asserções reprovavam com o
// contador funcionando na tela.
const fatiar = (titulo, proximo) => {
  const i = paginaToda.lastIndexOf(titulo);
  if (i < 0) return "";
  const j = proximo ? paginaToda.indexOf(proximo, i + titulo.length) : -1;
  return paginaToda.slice(i, j < 0 ? undefined : j);
};
const textoPost = fatiar("Post de texto", "Roteiro de Reels");
const textoReels = fatiar("Roteiro de Reels", null);

if (!textoPost) problemas.push("o cartão do post de texto não renderizou");
if (!textoReels) problemas.push("o cartão do Reels não renderizou");

// ── 1 ── O post de texto conta, e diz que não tem lastro ────────────────────
if (!/sem lastro/i.test(textoPost)) {
  problemas.push("o post de texto NÃO mostrou o selo 'sem lastro' — com a régua `nao-verificado`, mostrar número seria fingir lastro");
} else {
  console.log("post de texto: selo 'sem lastro' presente ✓");
}

// Nenhum limite pode aparecer enquanto a fonte não foi conferida. Os dois
// números da tabela estão aqui de propósito: é o vazamento que esta fase impede.
if (/3\.000|2\.200/.test(textoPost)) {
  problemas.push("apareceu um LIMITE na tela com a régua ainda `nao-verificado` — é exatamente o número sem lastro que esta fase existe para impedir");
} else {
  console.log("nenhum limite vazou para a tela sem fonte ✓");
}

// ── 2 ── A conta bate com o que o botão COPIA ───────────────────────────────
const mCont = textoPost.match(/([\d.]+)\s+caracteres/);
if (!mCont) {
  problemas.push("não achei o número de caracteres no cartão do post");
} else {
  // A ORDEM é a de `OUTPUT_META`: post-texto vem antes de reels, então o
  // primeiro "Copiar texto" é o do post.
  await pagina.getByRole("button", { name: /copiar texto/i }).first().click();
  await pagina.waitForTimeout(500);
  const copiado = await pagina.evaluate(() => navigator.clipboard.readText());
  const naTela = Number(mCont[1].replace(/\./g, ""));
  if (copiado.length !== naTela) {
    problemas.push(`a tela diz ${naTela} caracteres e o botão copiou ${copiado.length} — o contador não mede o que vai para a área de transferência`);
  } else {
    console.log(`conta confere com o que o botão copia: ${naTela} caracteres ✓`);
  }
}

// ── 3 ── O Reels NÃO conta. É roteiro, não legenda. ─────────────────────────
if (/sem lastro/i.test(textoReels)) {
  problemas.push("o Reels mostrou selo de régua — roteiro de vídeo não tem limite de legenda para comparar");
}
if (/[\d.]+\s+caracteres/.test(textoReels)) {
  problemas.push("o Reels CONTOU caracteres — o texto dele traz 'GANCHO:' e '[8s]', que não vão para campo nenhum; contar isso mede a coisa errada com número de aparência correta");
} else if (/sem régua/i.test(textoReels)) {
  console.log("reels: diz 'sem régua' e não conta ✓");
} else {
  problemas.push("o Reels não contou, mas também não explicou por quê — silêncio aqui parece defeito");
}

/**
 * ── 5 ── CONTRASTE DOS ELEMENTOS NOVOS, NO APP DE VERDADE ──────────────────
 *
 * O mockup foi medido (340 medições), mas o gate só vigia o que alguém declarou
 * — e o mockup não é o app. Aqui os alvos são os do contador RENDERIZADO, nos
 * dois temas, com o MESMO medidor de `lib/navegador.mjs`: ele resolve a cor pelo
 * canvas (o Tailwind emite `oklab` para alpha) e multiplica o `opacity` dos
 * ancestrais. Medidor novo é como o número sai errado e parece certo.
 *
 * O selo é o alvo mais frágil: `warn` sobre `warn-bg`, e o par troca de lado
 * entre os temas.
 */
const ALVOS = [
  ["selo sem lastro", () => pagina.getByText("sem lastro", { exact: true }).last(), 3],
  ["rótulo régua", () => pagina.getByText("régua", { exact: true }).last(), 3],
  ["rótulo sem régua", () => pagina.getByText("sem régua", { exact: true }).last(), 3],
  ["frase da procedência", () => pagina.getByText(/nenhum limite com fonte conferida/).last(), 4.5],
  ["explicação do roteiro", () => pagina.getByText(/Roteiro, não legenda/).last(), 4.5],
];

for (const tema of ["claro", "escuro"]) {
  await pagina.evaluate((t) => {
    document.documentElement.dataset.tema = t;
  }, tema);
  await pagina.waitForTimeout(200);

  for (const [nome, achar, piso] of ALVOS) {
    const alvo = achar();
    if ((await alvo.count()) === 0) {
      // Seletor que deixa de casar é REPROVAÇÃO, não silêncio (seção 12).
      problemas.push(`alvo de contraste "${nome}" casou com 0 elementos no tema ${tema}`);
      continue;
    }
    const { razao } = await alvo.evaluate(medirContraste);
    if (razao < piso) {
      problemas.push(`"${nome}" no tema ${tema}: ${razao.toFixed(2)}:1 — abaixo do piso ${piso}`);
    } else {
      console.log(`contraste ${tema} · ${nome}: ${razao.toFixed(2)}:1 (piso ${piso}) ✓`);
    }
  }
}

await navegador.close();

if (problemas.length === 0) {
  console.log("\n\x1b[32m✓\x1b[0m 4 verificações de comportamento + 10 medições de contraste nos dois temas");
  process.exit(0);
}
console.log(`\n\x1b[31m✖ ${problemas.length} problema(s)\x1b[0m`);
for (const p of problemas) console.log(`  · ${p}`);
process.exit(1);
