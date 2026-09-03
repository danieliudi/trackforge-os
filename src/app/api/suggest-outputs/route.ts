import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { priceUsage, SUGGESTION_MODEL, type GenerationCost } from "@/constants/pricing";
import { failedGenerationStep, generationErrorMessage, toTokenUsage } from "@/lib/usage";
import { OUTPUT_META, outputSuggestionSchema, type OutputKind } from "@/types/outputs";
import { jsonBody } from "@/lib/apiError";

/**
 * Que peças este material sustenta.
 *
 * No fluxo completo essa resposta vem de graça junto do artigo — o redator já
 * leu tudo e diz de quebra o que dá pra tirar dali. Na peça avulsa não existe
 * artigo, então a leitura precisa acontecer aqui, sozinha, antes de qualquer
 * gasto de redação. Por isso o modelo é o barato e o material entra cortado:
 * pra dizer se um assunto vira Reels ou post de texto não é preciso ler as
 * quarenta mil palavras, é preciso saber do que ele trata e com que densidade.
 */

const requestSchema = z.object({
  material: z.string().min(200, "material curto demais para sugerir formato"),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
});

const responseSchema = z.object({
  suggestions: z.array(outputSuggestionSchema).min(1).max(4),
});

/** O bastante para julgar assunto e densidade sem pagar o documento inteiro. */
const SAMPLE_CHARS = 6000;

const CATALOG = (Object.keys(OUTPUT_META) as OutputKind[])
  .map((kind) => `- "${kind}" (${OUTPUT_META[kind].platform}): ${OUTPUT_META[kind].note}`)
  .join("\n");

const SYSTEM = `Você lê um material e diz que peças de rede social ele sustenta.

Formatos disponíveis:
${CATALOG}

Regras:
- De 1 a 4 formatos. Sugira pelo que o material pede, não pelo que dá mais peça.
- Em "reason", uma frase curta dizendo por que aquele formato serve a ESTE
  material — o que nele funciona no formato. Não descreva o formato.
- Material de uma ideia só não vira carrossel de oito slides sem virar
  enchimento. Passo a passo e comparação são carrossel. Prazo com data cabe em
  post de texto e em stories. Material sem número nem prazo raramente vira Reels.
- Se o material não sustentar nada além de um formato, sugira só um.

Português do Brasil.`;

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { material } = parsed.data;

  try {
    const { object, usage } = await generateObject({
      model: anthropic(SUGGESTION_MODEL),
      schema: responseSchema,
      system: SYSTEM,
      prompt: `Material:\n\n${material.slice(0, SAMPLE_CHARS)}`,
    });

    const tokens = toTokenUsage(usage);
    const usd = priceUsage(tokens, 0, SUGGESTION_MODEL);
    const cost: GenerationCost = {
      usd,
      steps: [{ label: "Leitura do material", usage: tokens, webSearches: 0, usd }],
    };

    return Response.json({ suggestions: object.suggestions, cost });
  } catch (error) {
    // O gasto acontece antes do erro; o recibo vai junto. Ver `failedGenerationStep`.
    const descartada = failedGenerationStep(
      error,
      "Leitura do material (descartada)",
      SUGGESTION_MODEL,
    );
    const steps = descartada ? [descartada] : [];

    return Response.json(
      {
        error: generationErrorMessage(error, "as sugestões"),
        cost: { usd: steps.reduce((total, step) => total + step.usd, 0), steps },
      },
      { status: 500 },
    );
  }
}
