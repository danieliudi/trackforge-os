#!/usr/bin/env node
/**
 * A base autorizada nao pode conter o que ela mesma proibe.
 *
 * `buildKnowledgeBlock` monta o prompt em duas partes: o bloco `facts`, que se
 * apresenta ao modelo como "a unica fonte de fatos autorizada", e o bloco
 * PROIBICOES, montado da lista `forbidden`. As duas tem papeis opostos, e a
 * linha entre elas e facil de borrar — porque escrever "nunca diga X" no meio
 * dos fatos parece cuidado, e e o contrario: poe X dentro da fonte que o modelo
 * foi mandado tratar como autorizada.
 *
 * EXISTE POR UM CASO REAL, 10/09/2026. Ao trazer a curadoria da Resibag da v2.3
 * para a v2.9 — a correcao que reduziu a contagem de homologacoes de "dupla"
 * para UMA — a primeira versao desta sessao escreveu as proibicoes dentro do
 * bloco de fatos. O texto ficou correto para um leitor humano e errado para o
 * uso: os dois termos proibidos passaram a existir na fonte autorizada, em
 * forma negada. Este roteiro pegou os dois.
 *
 * Nao substitui `check-knowledge.mjs`, que compara a curadoria com a skill de
 * origem. Este olha so para dentro, e faz duas perguntas:
 *
 *   1. A fonte autorizada contem um TERMO que ela mesma proibe?
 *   2. As regras pegam o que dizem pegar, e so isso?
 *
 * A segunda existe porque erro de regex desliga uma regra de compliance EM
 * SILENCIO: a regra continua na lista, continua indo para o prompt, e nunca
 * casa. E a mesma familia do gate apontando para o lado errado — so que sem
 * nada na tela para denunciar.
 *
 * Uso: npm run knowledge:coerencia
 */
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// O bundler do Next resolve import sem extensao e importa JSON sem atributo; o
// Node cru nao faz nenhuma das duas. Mesma necessidade de
// `scratchpad/ts-resolve.mjs`, mais o atributo de JSON, que a cadeia de
// `knowledge/index.ts` exige.
register(pathToFileURL(join(ROOT, "scripts", "lib", "resolve-ts.mjs")));

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const green = (s) => `[32m${s}[0m`;

const { getBrandKnowledge } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/index.ts")).href
);
const { brands } = await import(
  pathToFileURL(join(ROOT, "src/constants/brands.ts")).href
);
const { findForbidden } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/check.ts")).href
);
const { getNormativeFacts } = await import(
  pathToFileURL(join(ROOT, "src/knowledge/provenance.ts")).href
);
const { brands: MARCAS } = await import(
  pathToFileURL(join(ROOT, "src/constants/brands.ts")).href
);

let violacoes = 0;
let marcas = 0;

for (const brandId of Object.keys(brands)) {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) continue;
  marcas += 1;

  // Regra de COOCORRENCIA nao se aplica aqui, e a distincao e real: o bloco de
  // fatos e um documento de REFERENCIA e precisa listar os dois registros de
  // mensagem — a tagline institucional e o slogan comercial. Quem nao pode ter
  // os dois e a PECA. A pergunta deste roteiro e mais estreita: a fonte
  // autorizada contem um TERMO que ela mesma proibe? Coocorrencia nao e termo.
  const termosDePar = new Set(
    knowledge.forbidden.filter((r) => r.pair).map((r) => r.term),
  );
  const hits = findForbidden([{ blockNumber: 0, text: knowledge.facts }], brandId).filter(
    (h) => !termosDePar.has(h.term),
  );
  if (hits.length === 0) continue;

  violacoes += hits.length;
  console.log(
    `\n  ${bold(brandId)}  ${red(`${hits.length} termo(s) proibido(s) dentro do bloco de fatos`)}`,
  );
  for (const hit of hits) {
    console.log(`    - "${hit.matched}"  ${dim(`regra: ${hit.term}`)}`);
  }
}

/**
 * A MESMA pergunta, no OUTRO bloco autorizado.
 *
 * `buildGroundedSystem` cola tres coisas no system: o bloco `facts`, as
 * PROIBICOES, e — por ultimo, de proposito — o bloco NORMATIVO montado de
 * `src/knowledge/facts/*.json`. Ate 11/09/2026 este roteiro olhava so para o
 * primeiro, e o buraco era exatamente do tamanho do problema que ele existe
 * para pegar: a base proibia "prazo de adequacao atribuido a NBR 10.004" em
 * `forbidden` E afirmava "o prazo termina em 31/12/2026" num fato normativo,
 * marcado `secundaria`, que a regra de tier deixa virar alegacao com
 * atribuicao. As duas coisas iam para o mesmo prompt, na mesma execucao.
 *
 * Varre exatamente o que CHEGA ao prompt — `claim`, `source` e `url` —, e nao o
 * registro inteiro: `notes` existe para documentar a contestacao, precisa poder
 * escrever o termo contestado, e `buildNormativeBlock` nao o inclui.
 */
for (const brandId of Object.keys(brands)) {
  const knowledge = getBrandKnowledge(brandId);
  if (!knowledge) continue;

  const termosDePar = new Set(
    knowledge.forbidden.filter((r) => r.pair).map((r) => r.term),
  );

  for (const fato of getNormativeFacts(brandId)) {
    const noPrompt = [fato.claim, fato.source, fato.url ?? ""].join(" ");
    const achados = findForbidden([{ blockNumber: 0, text: noPrompt }], brandId).filter(
      (h) => !termosDePar.has(h.term),
    );
    if (achados.length === 0) continue;

    violacoes += achados.length;
    console.log(
      `\n  ${bold(brandId)}/${bold(fato.id)}  ${red(`${achados.length} termo(s) proibido(s) no fato normativo`)}`,
    );
    for (const hit of achados) {
      console.log(`    - "${hit.matched}"  ${dim(`regra: ${hit.term}`)}`);
    }
  }
}


/**
 * A TERCEIRA pergunta: a assinatura que a ferramenta CARIMBA passa na propria
 * lista da marca?
 *
 * `brands[].tagline` nao e conteudo gerado — e valor fixo que o servidor
 * ESCREVE POR CIMA do que o modelo produziu (`normalizeCarousel(object,
 * tagline)`), porque assinatura institucional e fato de marca e nao
 * criatividade. Isso a torna a unica string do sistema que entra na peca sem
 * passar por decisao de ninguem.
 *
 * EXISTE POR UM CASO REAL, 11/09/2026. A canonical-facts tirou "industriais" da
 * tagline da Resibag em 09/09 e mandou a versao antiga para nunca-citar; a
 * curadoria em `src/knowledge/resibag.ts` ganhou a proibicao no mesmo dia; e o
 * `brands.ts` ficou para tras. Resultado: toda peca Resibag saia carimbada com
 * o termo que a varredura acusava tres linhas depois — a ferramenta produzindo
 * o proprio aviso. Duas listas dizendo coisas opostas sobre a mesma frase, e
 * nada olhando para as duas ao mesmo tempo.
 */
for (const brandId of Object.keys(brands)) {
  const marca = MARCAS[brandId];
  if (!marca?.tagline) continue;

  const achados = findForbidden(
    [{ blockNumber: 0, text: marca.tagline }],
    brandId,
  ).filter((h) => !new Set(
    (getBrandKnowledge(brandId)?.forbidden ?? []).filter((r) => r.pair).map((r) => r.term),
  ).has(h.term));

  if (achados.length === 0) continue;

  violacoes += achados.length;
  console.log(
    `\n  ${bold(brandId)}  ${red("a tagline carimbada pela ferramenta e proibida pela propria marca")}`,
  );
  console.log(`    brands.ts carimba: "${marca.tagline}"`);
  for (const hit of achados) {
    console.log(`    - "${hit.matched}"  ${dim(`regra: ${hit.term}`)}`);
  }
}

/**
 * Casos declarados: frase real de um lado, veredito do outro.
 *
 * O caso de coocorrencia declara TAMBEM qual regra deve disparar, e isso nao e
 * zelo: a primeira versao destes casos so conferia "algum achado saiu", e o
 * caso do par passava por causa de OUTRA regra — o slogan antigo tambem e
 * proibido sozinho. Plantar a quebra no par nao reprovava. Cobertura que existe
 * no papel e nao existe no teste e pior que cobertura faltando, porque ninguem
 * volta para olhar.
 *
 * Declarado e nao improvisado, pela mesma razao que os alvos de contraste sao
 * (secao 12): varredura que so sabe dizer verde nao prova nada. Cada frase aqui
 * ou ja saiu errada em material real, ou e a formulacao correta que nao pode
 * disparar falso alarme.
 */
const PAR_NIVEIS =
  "tagline institucional (Nível 01/02) na mesma peça que o slogan comercial (Nível 03)";
const PAR_C1_C2 =
  "assinatura (C1) empilhada com a linha de posicionamento (C2) na mesma peça";
const PAR_TAGLINES = "tagline oficial empilhada com a sub-tagline de legado";

const CASOS = {
  resibag: {
    reprova: [
      ["contagem: dupla", ["A Resibag tem dupla homologacao: INMETRO + ANTT 5998."]],
      ["contagem: tripla", ["Somos tripla homologacao no setor."]],
      ["ANTT como selo", ["Big bag com homologacao ANTT para perigosos."]],
      ["ANP", ["Certificacao ANP para Oil & Gas."]],
      ["Passaporte de Compliance", ["Nosso Passaporte de Compliance cobre tudo."]],
      ["tagline antiga", ["Gestao inteligente de residuos industriais."]],
      ["slogan suspenso", ["Nem todo big bag passa na auditoria. O nosso passa."]],
      ["capacidade fora do certificado", ["Homologado em 500 kg, 1500 kg e 2000 kg."]],
      ["Decreto 12.688 em Classe I", ["O Decreto 12.688/2025 obriga logistica reversa do seu Classe I."]],
      ["exclusividade", ["Unico no Brasil com essa cobertura."]],
      ["ANTT 6.078", ["A ANTT 6.078/2026 atualizou a 5.998."]],
      ["NORMAM", ["Homologacao NORMAM da Marinha."]],
      ["4 tambores", ["1 big bag substitui 4 tambores."]],
      ["prazo inventado para a NBR", ["O prazo de transicao da NBR 10.004:2024 termina em 31/12/2026."]],
      ["edicao antiga da NBR", ["Classificacao conforme NBR 10.004:2004."]],
      ["OCP como codigo do produto", ["Codigo INMETRO OCP-0041."]],
      ["organismo da ISO em peca Resibag", ["ISO 9001:2015 certificada pela SGS."]],
      ["premissa falsa em outra roupagem", ["Ninguem compra big bag. Compra a prova de que o big bag passa na auditoria."]],
      ["e-mail nao canonico", ["Fale com comercial@resibag.com.br."]],
      // Coocorrencia: nenhum lado e proibido sozinho. A capa que a propria
      // sessao montou errado no mockup da Fase 3, em 08/09/2026.
      ["par 01+03, blocos vizinhos", [
        "Resibag - Gestao inteligente de residuos.",
        "Nem todo big bag passa na auditoria.",
      ], PAR_NIVEIS],
      ["par 01+03, blocos distantes", [
        "Gestao inteligente de residuos.",
        "Homologacao INMETRO para residuo perigoso Classe I.",
        "5 tambores parecem mais baratos. Juntos, pesam e custam mais que 1 Resibag.",
      ], PAR_NIVEIS],
    ],
    passa: [
      ["contagem certa", ["A Resibag tem homologacao INMETRO para residuo perigoso Classe I."]],
      ["ANTT como obrigacao do cliente", ["A ANTT 5998/2022 exige embalagem certificada para o transporte."]],
      ["ISO como sistema de gestao", ["Fabricado sob sistema de gestao da qualidade certificado ISO 9001:2015 do Grupo Sanwey."]],
      ["tagline nova", ["Gestao inteligente de residuos."]],
      ["capacidades certas", ["Disponivel em 700 kg e 1000 kg."]],
      // A formulacao CORRETA sobre a NBR nao pode disparar a regra do prazo.
      ["NBR sem prazo, dito certo", ["A NBR 10.004 e norma de classificacao e nao tem prazo de adequacao."]],
      ["NBR na edicao certa", ["Classificacao conforme NBR 10.004:2024."]],
      ["OCP citado como acreditador", ["Organismo certificador ABRACE, OCP-0041, acreditado ABNT NBR ISO/IEC 17065."]],
      ["ISO sem nomear organismo", ["Fabricado sob sistema de gestao da qualidade certificado ISO 9001:2015."]],
      ["e-mail canonico", ["Fale com vendas@resibag.com.br."]],
      ["so Nivel 03 — ads", [
        "5 tambores parecem mais baratos. Juntos, pesam e custam mais que 1 Resibag.",
        "Fale com a gente: vendas@resibag.com.br",
      ]],
      ["so Nivel 01+02 — institucional", [
        "Gestao inteligente de residuos.",
        "Transformamos a gestao de residuos em eficiencia, seguranca e vantagem competitiva.",
        "Resibag - Uma marca Sanwey",
      ]],
    ],
  },
  sanwey: {
    reprova: [
      ["tempo vago", ["Decadas de experiencia no setor."]],
      ["FSSC como certificacao", ["Certificados FSSC 22000 desde 2018."]],
      ["frase aposentada — embalagem", ["A embalagem certa para cada carga."]],
      ["frase aposentada — solucao", ["A solucao em Sanbag."]],
      ["endosso errado", ["Resibag, uma empresa Sanwey."]],
      ["preco por quilo", ["Nossa precificacao por quilo e a mais competitiva."]],
      // Empilhamento: cada linha, sozinha, esta correta. O erro e a peca ter as duas.
      ["par C1+C2 na mesma peca", [
        "A marca que valoriza o seu produto.",
        "A carga define o projeto.",
      ], PAR_C1_C2],
      ["par C1+C2 curta, blocos distantes", [
        "A marca que valoriza o seu produto.",
        "Fator de seguranca 8:1 para granulado abrasivo.",
        "Engenharia por carga.",
      ], PAR_C1_C2],
      ["par tagline + sub-tagline", [
        "A marca que valoriza o seu produto.",
        "Sanwey preserva o presente para o futuro.",
      ], PAR_TAGLINES],
    ],
    passa: [
      ["tempo exato", ["42 anos de pioneirismo documentado."]],
      ["frase que substituiu a aposentada", ["O contentor certo para cada carga."]],
      ["C1 sozinha — rodape", ["A marca que valoriza o seu produto."]],
      ["C2 + C3 — o unico empilhamento permitido", [
        "A carga define o projeto.",
        "Primeiro a homologar contentores flexiveis para perigosos no INMETRO. 2008.",
      ]],
      ["sub-tagline sozinha — peca de legado", [
        "Sanwey preserva o presente para o futuro.",
        "Sun Way: caminho do sol, caminhos iluminados.",
      ]],
      ["ANP e Marinha sao da Sanwey", [
        "Type-C condutivo com certificacao ANP.",
        "Primeiro brasileiro homologado pelo Ministerio da Marinha, 1996.",
      ]],
    ],
  },
};

let casosRodados = 0;
const casosErrados = [];

for (const [brandId, grupos] of Object.entries(CASOS)) {
  for (const [esperado, lista] of [["reprova", grupos.reprova], ["passa", grupos.passa]]) {
    for (const [nome, blocos, termoEsperado] of lista ?? []) {
      casosRodados += 1;
      const partes = blocos.map((text, i) => ({ blockNumber: i + 1, text }));
      const todos = findForbidden(partes, brandId);
      // Com termo declarado, o caso so passa se AQUELA regra disparou — outra
      // regra acertando o mesmo texto nao vale como cobertura.
      const hits = termoEsperado ? todos.filter((h) => h.term === termoEsperado) : todos;
      const reprovou = hits.length > 0;
      if (reprovou !== (esperado === "reprova")) {
        casosErrados.push(
          `${brandId}/${nome}: esperava ${esperado}` +
            (termoEsperado ? ` pela regra de par` : "") +
            ", " +
            (reprovou
              ? `pegou "${hits[0].matched}"`
              : todos.length
                ? `so pegou outra regra ("${todos[0].term}")`
                : "nao pegou nada"),
        );
      }
    }
  }
}

if (casosErrados.length > 0) {
  console.log(`\n  ${bold("regras")}  ${red(`${casosErrados.length} caso(s) fora do esperado`)}`);
  for (const c of casosErrados) console.log(`    - ${c}`);
  console.log(
    `\n  Regra que nao casa continua na lista e continua indo para o prompt.`,
  );
  console.log(`  Ela so para de proteger — em silencio.\n`);
  process.exit(1);
}

if (violacoes === 0) {
  console.log(
    `${green("ok")} base coerente com as proprias proibicoes  ${dim(`(${marcas} frente(s))`)}`,
  );
  console.log(
    `${green("ok")} regras pegam o que dizem pegar  ${dim(`(${casosRodados} casos declarados)`)}`,
  );
  console.log(
    `${green("ok")} a tagline que a ferramenta carimba passa na lista da propria marca`,
  );
  process.exit(0);
}

console.log(`\n  A proibicao mora em ${bold("forbidden")}, que vira a secao PROIBICOES do prompt.`);
console.log(`  O bloco ${bold("facts")} e os fatos de ${bold("src/knowledge/facts/")} sao a fonte`);
console.log(`  autorizada, e se escrevem no positivo. Fato que a marca contesta sai da lista —`);
console.log(`  rebaixar o tier nao resolve, porque ${bold("secundaria")} ainda e publicavel com atribuicao.\n`);
process.exit(1);
