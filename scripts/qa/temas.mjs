/**
 * Os oito temas de marca renderizam dentro do piso, no slide de verdade.
 *
 * POR QUE EXISTE. O gate `check-paleta` prova que nenhuma cor MORTA entrou —
 * é análise de texto, não vê a tela. Cor viva e autorizada também reprova
 * contraste quando o par está errado, e foi assim que o `sanwey-impacto`
 * carregou um acento a 1,66:1 até 16/09/2026. Uma coisa não substitui a outra.
 *
 * `/slides-preview` renderiza a MESMA amostra em todos os temas, sem gastar a
 * chave da Anthropic — é a única tela do repo feita para isto.
 *
 * Alvo declarado, nunca improvisado (seção 12): seletor que deixa de casar é
 * reprovação. E o medidor é o de `lib/navegador.mjs`, nunca um segundo.
 */
import { abrirNavegador, aquecer, BASE, medirContraste, novaPagina } from "./lib/navegador.mjs";

const CORPO = 4.5;
const GRANDE = 3;
/** Rótulo pequeno e ornamento, seção 4. */
const ROTULO = 3;

/** [rótulo do tema no HTML, marca]. Os genéricos não respondem a manual. */
const TEMAS = [
  ["Resibag (ESG)", "resibag"],
  ["Resibag Escuro", "resibag-escuro"],
  ["Resibag Ativo", "resibag-ativo"],
  ["Resibag Selo", "resibag-selo"],
  ["Sanwey (institucional)", "sanwey"],
  ["Sanwey Industrial", "sanwey-industrial"],
  ["Sanwey Impacto", "sanwey-impacto"],
  ["Sanwey Preto", "sanwey-preto"],
];

/**
 * O que medir dentro de cada slide, e com que piso.
 *
 * DECLARADO POR PAPEL, NÃO POR ETIQUETA (seção 12). A primeira versão disto
 * media `"p"`, e `"p"` é a manchete de 187px do slide de métrica, a atribuição
 * da citação em caixa alta e o corpo de 34px — três papéis com três pisos
 * diferentes somados num número só. Reprovou quatro vezes, e as quatro eram o
 * seletor, não o produto. É exatamente a falha que a seção 12 descreve.
 *
 * `[data-papel]` vem do layout, então seletor que deixa de casar é reprovação
 * e não silêncio — e renomear um papel no produto quebra o alvo aqui de cara,
 * em vez de medir o elemento errado calado.
 */
const ALVOS = [
  ["manchete", GRANDE, 3],
  ["metrica", GRANDE, 1],
  ["corpo", CORPO, 4],
  ["etiqueta", ROTULO, 9],
];

/**
 * Slide com FOTO de fundo não entra na medição, e isto não é conveniência.
 *
 * O que o leitor vê ali é a foto coberta por `from-black/90 via-black/70
 * to-black/40` — um gradiente com alfa, num irmão absoluto. O medidor sobe pelos
 * ANCESTRAIS até achar fundo opaco, então ele não vê nem a foto nem o gradiente:
 * ele mede contra o `theme.background`, uma cor que naquele slide ninguém enxerga.
 *
 * Medir assim dá número errado com cara de certo, que é o defeito que a seção 12
 * inteira existe para evitar. Aqui o número saía PESSIMISTA (2,71 onde o
 * composto real é claro sobre quase-preto), e otimista seria pior.
 *
 * O que se perde: o par `accentInk` × foto. O que não se perde: `accentInk`
 * continua medido, sobre a superfície de verdade, no número do slide de métrica
 * e na etiqueta — mesmo token, mesmo piso, slide que o medidor enxerga.
 */
const SEM_FOTO = ":not([data-foto='fundo'] *)";

/**
 * A CONTAGEM É DECLARADA, e ela é metade do alvo.
 *
 * A amostra do `/slides-preview` é fixa: capa, conteúdo, métrica, citação e CTA.
 * Fora a citação (excluída acima, tem foto de fundo), cada tema rende 3
 * manchetes, 1 métrica, 4 corpos e 9 etiquetas — 3 tarjas, 5 contadores e
 * 1 assinatura de rodapé. Se o produto parar de casar com um papel, o número
 * muda e o roteiro REPROVA, em vez de medir menos e continuar verde.
 */

await aquecer(["/slides-preview"]);
const navegador = await abrirNavegador();
const { pagina } = await novaPagina(navegador, { largura: 1900, altura: 1400, front: "resibag" });
await pagina.goto(`${BASE}/slides-preview`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(1200);

// Marca: sem ela, uma tela de bloqueio por senha passaria como oito temas limpos.
const corpo = await pagina.locator("body").innerText();
if (!/Reduza custo|38%/.test(corpo)) {
  console.error("\x1b[31m✖\x1b[0m /slides-preview não renderizou a amostra — nada foi medido.");
  await navegador.close();
  process.exit(1);
}

let medidos = 0;
const reprovou = [];

for (const [rotulo, id] of TEMAS) {
  const titulo = pagina.getByText(rotulo, { exact: true }).first();
  if ((await titulo.count()) === 0) {
    console.log(`  \x1b[31mALVO\x1b[0m   tema "${rotulo}" não está na página`);
    reprovou.push({ tema: id, o: "o tema sumiu de /slides-preview" });
    continue;
  }
  const caixa = titulo.locator("xpath=ancestor::*[self::section or self::div][1]");
  const linha = [];

  for (const [nome, piso, esperados] of ALVOS) {
    const alvos = caixa.locator(`[data-papel='${nome}']${SEM_FOTO}`);
    const n = await alvos.count();
    if (n !== esperados) {
      console.log(`  \x1b[31mALVO\x1b[0m   ${id}: "${nome}" casou ${n}, esperava ${esperados}`);
      reprovou.push({ tema: id, o: `o alvo "${nome}" casou ${n} elementos, e não ${esperados}` });
      continue;
    }
    let pior = Infinity;
    let texto = "";
    for (let i = 0; i < n; i += 1) {
      const m = await alvos.nth(i).evaluate(medirContraste);
      medidos += 1;
      if (m.razao < pior) [pior, texto] = [m.razao, m.texto];
    }
    const ok = pior >= piso;
    // O texto medido sai junto do pior número: é o que denuncia alvo que casou
    // com o elemento errado, e sem ele o relatório é só uma coluna de números.
    if (!ok) {
      reprovou.push({ tema: id, o: `${nome} a ${pior.toFixed(2)}:1 (piso ${piso}) em "${texto}"` });
    }
    linha.push(`${nome} ${ok ? "\x1b[32m" : "\x1b[31m"}${pior.toFixed(2)}\x1b[0m`);
  }
  console.log(`  ${id.padEnd(20)} ${linha.join("  ")}`);
}

await navegador.close();

if (reprovou.length > 0) {
  console.log(`\n\x1b[31m✖ ${reprovou.length} reprovação(ões)\x1b[0m em ${medidos} medições`);
  for (const r of reprovou) console.log(`   · ${r.tema}: ${r.o}`);
  process.exit(1);
}
console.log(`\n\x1b[32m✓\x1b[0m ${medidos} medições nos ${TEMAS.length} temas de marca, todas no piso\n`);
