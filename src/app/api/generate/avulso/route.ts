import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import {brands, brandIdSchema} from "@/constants/brands";
import type { Platform } from "@/constants/format";
import { priceUsage, type CostStep, type GenerationCost } from "@/constants/pricing";
import { jsonBody } from "@/lib/apiError";
import { buildBrief } from "@/lib/brief";
import { findForbidden } from "@/knowledge/check";
import { buildCarrosselSystem, buildOutputSystem } from "@/lib/prompts";
import {
  failedGenerationStep,
  generationErrorMessage,
  isContentFailure,
  toTokenUsage,
} from "@/lib/usage";
import { verifyBlocks } from "@/lib/verify";
import {
  isCarousel,
  normalizeOutput,
  outputBlocks,
  OUTPUT_META,
  OUTPUT_SCHEMAS,
  OUTPUT_WIRE_SCHEMAS,
  type PieceFailure,
  outputKindSchema,
  type OutputKind,
} from "@/types/outputs";

/**
 * Peça avulsa: sem artigo por trás.
 *
 * A DIFERENÇA QUE IMPORTA está no modo. Com "texto", o material colado é a
 * fonte, e valem as mesmas regras da derivação — nada de número ou norma que
 * não esteja lá, e a auditoria confere contra ele. Com "tema", não há fonte
 * nenhuma além da base de fatos da marca, e é ela que decide o que pode virar
 * dado. Tratar os dois igual daria a um texto colado a permissividade de um
 * tema aberto, ou o contrário — e é justamente o contrário que o usuário quer
 * quando cola um documento.
 */

const requestSchema = z.object({
  mode: z.enum(["tema", "texto"]),
  /** No modo tema: o assunto ou uma URL. No modo texto: o material inteiro. */
  input: z.string().min(3, "informe um tema ou cole o texto"),
  kinds: z.array(outputKindSchema).min(1, "escolha ao menos um formato").max(6),
  brandId: brandIdSchema.nullable().optional(),
  includeNews: z.boolean().optional(),
  useSignals: z.boolean().optional().default(true),
  signalIds: z.array(z.string()).optional(),
});

const FROM_SOURCE_RULES = `
REGRA DA ORIGEM — o material abaixo é a fonte factual desta peça.

- Nenhum número, percentual, prazo, data, norma ou alegação pode aparecer se não
  estiver no material. Se o formato pediria um dado que não está lá, escreva sem.
- Não invente exemplo, caso ou cliente que o material não cita.
- Não é resumo: escolha um ângulo do material que funcione neste formato.`;

const PLATFORM_OF: Record<OutputKind, Platform> = {
  "carrossel-linkedin": "linkedin",
  "carrossel-instagram": "instagram",
  "post-texto": "linkedin",
  legenda: "instagram",
  reels: "instagram",
  stories: "instagram",
};

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { mode, input, kinds, brandId, includeNews, useSignals, signalIds } = parsed.data;
  const costSteps: CostStep[] = [];

  try {
    // No modo texto o material já é o brief: buscar notícia ou ler URL não faz
    // sentido quando o usuário acabou de dizer qual é a fonte.
    let brief: string;
    if (mode === "texto") {
      brief = `Material de origem:\n\n${input}`;
    } else {
      const built = await buildBrief({
        input,
        includeNews,
        useSignals,
        signalIds,
        brandId,
        piece: "peça",
        pieceArticle: "a",
      });
      costSteps.push(...built.costSteps);
      brief = built.brief;
    }

    const pieces = [];
    const failures: PieceFailure[] = [];

    for (const kind of kinds) {
      const meta = OUTPUT_META[kind];
      const base = isCarousel(kind)
        ? buildCarrosselSystem(PLATFORM_OF[kind], brandId)
        : buildOutputSystem(kind, brandId);

      // Uma peça que falha não derruba as outras — mesma regra da derivação.
      try {
        const { object, usage } = await generateObject({
          model: anthropic("claude-sonnet-5"),
          schema: OUTPUT_WIRE_SCHEMAS[kind],
          system: mode === "texto" ? `${base}\n${FROM_SOURCE_RULES}` : base,
          prompt: brief,
          providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
        });

        const tokens = toTokenUsage(usage);
        const usd = priceUsage(tokens);

        // Normaliza e valida TODA peça, não só o carrossel: o schema de geração
        // agora é o de fio, que de propósito não valida nada.
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

        pieces.push({
          kind,
          data: validated.data as unknown,
          from: mode === "texto" ? "do material colado" : "do tema",
          warnings: [] as ReturnType<typeof findForbidden>,
          verification: null as Awaited<ReturnType<typeof verifyBlocks>>["verification"] | null,
        });
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

    // Com material colado, ele conta como fonte na auditoria — do mesmo jeito
    // que o artigo conta para as peças derivadas dele.
    const sourceContext =
      mode === "texto"
        ? `Material de origem desta peça. Uma afirmação que aparece aqui É rastreada, mesmo que a base de fatos não a repita. Uma afirmação que NÃO aparece aqui nem na base é "sem-fonte":\n\n${input}`
        : "";

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
        // segue sem parecer
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
