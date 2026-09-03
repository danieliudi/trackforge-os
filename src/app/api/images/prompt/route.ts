import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { SUGGESTION_MODEL, priceUsage, type GenerationCost } from "@/constants/pricing";
import { jsonBody } from "@/lib/apiError";
import { failedGenerationStep, generationErrorMessage, toTokenUsage } from "@/lib/usage";

const requestSchema = z.object({
  headline: z.string().min(1),
  bodyText: z.string().optional(),
  slideType: z.string().optional(),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
  /** Artigo/blog: contexto extra além do slide. */
  context: z.string().optional(),
});

const promptSchema = z.object({
  /** Prompt longo, em inglês, pronto para gerador de imagem. */
  generationPrompt: z.string().min(20),
  /** Termo curto em inglês para busca Unsplash. */
  searchQuery: z.string().min(3).max(80),
  /** Nota em PT-BR: o que a foto deve (e não deve) mostrar. */
  briefPt: z.string().min(10),
});

const SYSTEM = `You write image briefs for B2B industrial packaging / waste management
carousels (Resibag / Sanwey). Output JSON only via the schema.

Rules:
- generationPrompt: English, photographic, editorial magazine quality. Describe
  lighting, subject, crop, mood. NO logos, NO readable product labels, NO brand
  names, NO fake certifications, NO people holding branded bags as if they were
  the real product. Prefer atmosphere, industrial texture, documentary stills.
- searchQuery: 3–6 English words for Unsplash stock search.
- briefPt: one Portuguese sentence for the editor explaining the visual idea.
- Never invent a photo of a specific commercial product SKU.`;

/**
 * Gera prompt de imagem a partir do brief do slide.
 *
 * A política do repo proíbe foto sintética de produto real. Este endpoint
 * produz o texto; a geração (se houver chave) e a busca Unsplash usam o texto.
 */
export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { headline, bodyText, slideType, brandId, context } = parsed.data;

  try {
    const { object, usage } = await generateObject({
      model: anthropic(SUGGESTION_MODEL),
      schema: promptSchema,
      system: SYSTEM,
      prompt: [
        brandId ? `Marca: ${brandId}` : null,
        slideType ? `Tipo de slide: ${slideType}` : null,
        `Headline: ${headline}`,
        bodyText ? `Apoio: ${bodyText}` : null,
        context ? `Contexto: ${context.slice(0, 800)}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const tokenUsage = toTokenUsage(usage);
    const usd = priceUsage(tokenUsage, 0, SUGGESTION_MODEL);
    const cost: GenerationCost = {
      usd,
      steps: [
        {
          label: "Prompt de imagem",
          usage: tokenUsage,
          webSearches: 0,
          usd,
        },
      ],
    };

    return Response.json({
      ...object,
      cost,
      generateConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    const descartada = failedGenerationStep(
      error,
      "Prompt de imagem (descartado)",
      SUGGESTION_MODEL,
    );
    const steps = descartada ? [descartada] : [];
    return Response.json(
      {
        error: generationErrorMessage(error, "o prompt de imagem"),
        cost: { usd: steps.reduce((total, step) => total + step.usd, 0), steps },
      },
      { status: 502 },
    );
  }
}
