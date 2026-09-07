import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import {brands, brandIdSchema} from "@/constants/brands";
import { priceUsage, type CostStep, type GenerationCost } from "@/constants/pricing";
import { findForbidden } from "@/knowledge/check";
import { jsonBody } from "@/lib/apiError";
import { buildCarrosselSystem, buildOutputSystem } from "@/lib/prompts";
import {
  failedGenerationStep,
  generationErrorMessage,
  isContentFailure,
  toTokenUsage,
} from "@/lib/usage";
import { verifyBlocks } from "@/lib/verify";
import { articleSchema, articleToMarkdown, type Article } from "@/types/article";
import type { Carousel } from "@/types/carousel";
import {
  isCarousel,
  normalizeOutput,
  outputBlocks,
  OUTPUT_META,
  OUTPUT_SCHEMAS,
  OUTPUT_WIRE_SCHEMAS,
  outputKindSchema,
  type OutputKind,
  type PieceFailure,
} from "@/types/outputs";

/**
 * Deriva as peças escolhidas a partir do artigo.
 *
 * A REGRA QUE NÃO MUDA: nada aqui é escrito do zero. A fonte factual de toda
 * peça é o artigo — é o que impede a afirmação que existe só na peça curta e
 * não no artigo, que é justamente a que ninguém confere, porque o artigo passou
 * pela auditoria e ela não.
 *
 * O carrossel do Instagram é a única exceção de origem, e é a original: quando
 * o do LinkedIn também foi pedido, ele deriva do LinkedIn, com o artigo junto
 * só como referência de fato. Assim os dois carrosséis não divergem entre si.
 */

const requestSchema = z.object({
  article: articleSchema,
  brandId: brandIdSchema.nullable().optional(),
  kinds: z.array(outputKindSchema).min(1, "escolha ao menos um formato").max(6),
});

const DERIVE_RULES = `
REGRA DA DERIVAÇÃO — esta peça NÃO é escrita do zero.

A fonte factual dela é o texto de origem que você vai receber, e só ele (mais a
base de fatos da marca, quando houver).

- Nenhum número, percentual, prazo, data, norma ou alegação pode aparecer aqui
  se não estiver no texto de origem. Se o formato pediria um dado que não está
  lá, escreva sem o dado.
- Não invente exemplo, caso ou cliente que a origem não cita.
- Isto também não é resumo. Escolha UM ângulo da origem que funcione neste
  formato e desenvolva esse ângulo; deixar assunto de fora é esperado.
- O CTA pode ser mais direto que a origem, desde que não prometa nada que a
  origem não sustente.`;

const PLATFORM_OF: Record<OutputKind, "linkedin" | "instagram"> = {
  "carrossel-linkedin": "linkedin",
  "carrossel-instagram": "instagram",
  "post-texto": "linkedin",
  legenda: "instagram",
  reels: "instagram",
  stories: "instagram",
};

type Piece = {
  kind: OutputKind;
  data: unknown;
  from: string;
  warnings: ReturnType<typeof findForbidden>;
  verification: Awaited<ReturnType<typeof verifyBlocks>>["verification"] | null;
};

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { article, brandId, kinds } = parsed.data;
  const costSteps: CostStep[] = [];

  try {
    const articleText = articleToMarkdown(article as Article);

    // LinkedIn antes de Instagram, para o carrossel do Instagram poder sair do
    // dele. Fora isso a ordem do pedido é respeitada.
    const ordered = [...kinds].sort(
      (a, b) => Number(b === "carrossel-linkedin") - Number(a === "carrossel-linkedin"),
    );

    const pieces: Piece[] = [];
    const failures: PieceFailure[] = [];
    let linkedinCarousel: string | null = null;

    for (const kind of ordered) {
      const meta = OUTPUT_META[kind];
      const derivesFromLinkedin = kind === "carrossel-instagram" && linkedinCarousel !== null;
      const from = derivesFromLinkedin ? "derivado do carrossel do LinkedIn" : "derivado do artigo";

      const sourceText = derivesFromLinkedin
        ? `Peça de origem (carrossel do LinkedIn):\n\n${linkedinCarousel}\n\nArtigo completo, para conferir fato — não para copiar estrutura:\n\n${articleText}`
        : `Artigo de origem:\n\n${articleText}`;

      // UMA PEÇA QUE FALHA NÃO DERRUBA AS OUTRAS. Antes o `return` aqui dentro
      // descartava o lote inteiro — inclusive as peças que já tinham saído e
      // sido pagas. Agora ela vira um slot com o motivo, e o laço continua.
      try {
        const { object, usage } = await generateObject({
          model: anthropic("claude-sonnet-5"),
          schema: OUTPUT_WIRE_SCHEMAS[kind],
          system: isCarousel(kind)
            ? `${buildCarrosselSystem(PLATFORM_OF[kind], brandId)}\n${DERIVE_RULES}`
            : `${buildOutputSystem(kind, brandId)}\n${DERIVE_RULES}`,
          prompt: sourceText,
          providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
        });

        const tokens = toTokenUsage(usage);
        const usd = priceUsage(tokens);

        // Normaliza e valida TODA peça, não só o carrossel. As de texto passavam
        // direto porque o schema de geração já as tinha validado — agora ele é o
        // de fio, que não valida nada de propósito, então a conferência é aqui.
        const validated = OUTPUT_SCHEMAS[kind].safeParse(
          normalizeOutput(kind, object, brandId ? brands[brandId].tagline : undefined),
        );

        costSteps.push({
          label: validated.success
            ? `${meta.label} · ${meta.platform}`
            : `${meta.label} · ${meta.platform} (descartada)`,
          usage: tokens,
          webSearches: 0,
          usd,
        });

        if (!validated.success) {
          failures.push({
            kind,
            issues: validated.error.issues.map(
              (issue) => `${issue.path.join(".") || "peça"}: ${issue.message}`,
            ),
            usd,
          });
          continue;
        }

        const data: unknown = validated.data;
        if (kind === "carrossel-linkedin") {
          // Via `data`, que é `unknown` declarado: ler `validated.data` aqui
          // fecharia um ciclo de inferência com `linkedinCarousel` logo acima.
          linkedinCarousel = (data as Carousel).slides
            .map((slide) => `${slide.headline}${slide.bodyText ? ` — ${slide.bodyText}` : ""}`)
            .join("\n");
        }

        pieces.push({ kind, data, from, warnings: [], verification: null });
      } catch (error) {
        // Só erro de conteúdo fica com a peça; rede e chave são do lote e sobem.
        if (!isContentFailure(error)) throw error;

        const descartada = failedGenerationStep(
          error,
          `${meta.label} · ${meta.platform} (descartada)`,
        );
        if (descartada) costSteps.push(descartada);

        failures.push({
          kind,
          issues: [generationErrorMessage(error, "a peça")],
          usd: descartada?.usd ?? 0,
        });
      }
    }

    const cost: GenerationCost = {
      usd: costSteps.reduce((total, step) => total + step.usd, 0),
      steps: costSteps,
    };

    // O artigo entra como contexto da auditoria: numa peça derivada, "rastreado"
    // quer dizer rastreado até a origem.
    const sourceContext = `Artigo de origem desta peça. Uma afirmação que aparece aqui É rastreada, mesmo que a base de fatos não a repita. Uma afirmação que NÃO aparece aqui nem na base é "sem-fonte", ainda que soe plausível:\n\n${articleText}`;

    for (const piece of pieces) {
      const blocks = outputBlocks(piece.kind, piece.data);
      piece.warnings = findForbidden(
        blocks.map((block) => ({ blockNumber: block.number, text: block.text })),
        brandId,
      );

      try {
        const result = await verifyBlocks(blocks, brandId, sourceContext);
        piece.verification = result.verification;
        cost.steps.push({
          ...result.costStep,
          label: `Conferência · ${OUTPUT_META[piece.kind].label}`,
        });
        cost.usd += result.costStep.usd;
      } catch {
        // segue sem parecer — a peça já foi paga
      }
    }

    return Response.json({ pieces, failures, cost });
  } catch (error) {
    // O gasto acontece antes do erro; o recibo vai junto — inclusive as peças que
    // já tinham saído antes de esta falhar. Ver `failedGenerationStep`.
    const descartada = failedGenerationStep(error, "Peça descartada");
    if (descartada) costSteps.push(descartada);

    const message = generationErrorMessage(error, "a peça");
    return Response.json(
      {
        error: message,
        cost: { usd: costSteps.reduce((total, step) => total + step.usd, 0), steps: costSteps },
      },
      { status: 500 },
    );
  }
}
