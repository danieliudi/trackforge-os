import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { brandIdSchema } from "@/constants/brands";

import { priceUsage, type GenerationCost } from "@/constants/pricing";
import { buildGroundedSystem } from "@/knowledge";
import { findForbiddenInSlides } from "@/knowledge/check";
import { jsonBody } from "@/lib/apiError";
import { failedGenerationStep, generationErrorMessage, toTokenUsage } from "@/lib/usage";
import {
  apresentacaoSchema,
  MAX_BODY_LENGTH,
  MAX_BULLET_LENGTH,
  MAX_BULLETS,
  MIN_BULLETS,
  slideSchema,
} from "@/types/carousel";


const requestSchema = z.object({
  // Teto de 20 (apresentação), não o de 12 do carrossel: aqui o documento é só
  // contexto e vale para os dois formatos. Com `carouselSchema` regerar um slide
  // de uma apresentação com mais de 12 slides era rejeitado como payload inválido.
  carousel: apresentacaoSchema,
  slideIndex: z.number().int().nonnegative(),
  instruction: z.string().optional(),
  brandId: brandIdSchema.nullable().optional(),
});

/**
 * O que se pede ao modelo: forma, sem limite. Os números estão no prompt, que é
 * onde eles de fato influenciam a resposta — a Anthropic descarta `maxLength` e
 * `minItems` antes de gerar, e cobrá-los na volta só perdia o slide reescrito.
 */
const slideContentSchema = z.object({
  headline: z.string(),
  /** Ausente em slides "bullets"/"section" — não são renderizados nesses tipos. */
  bodyText: z.string().nullish(),
  highlightTag: z.string().nullish(),
  /** Só em slides "bullets". */
  bullets: z.array(z.string()).nullish(),
});

const SYSTEM = `Você é redator de carrosséis e apresentações B2B, reescrevendo UM slide
específico dentro de um documento já existente.

Regras obrigatórias de texto (o layout quebra quem violar):
- "headline" é o texto principal do slide. Sem jargão, sem emoji.
- Em slides "data_metric" a headline é APENAS o número, nada mais.
  Válido: "22%", "3,4x", "R$ 1,2 mi". Inválido: qualquer frase.
- Em slides "bullets", preencha o array "bullets" com ${MIN_BULLETS} a ${MAX_BULLETS}
  itens curtos (até ${MAX_BULLET_LENGTH} caracteres cada) e NÃO preencha "bodyText".
- Em slides "section", só a "headline" importa — NÃO preencha "bodyText".
- Nos demais tipos, "bodyText" tem NO MÁXIMO ${MAX_BODY_LENGTH} CARACTERES — é um
  rótulo de apoio, não uma frase.
- "highlightTag" é opcional e curto (1-2 palavras).

Mantenha o mesmo "type" do slide e a coerência com o título, o público-alvo e os
outros slides do documento. Escreva em português do Brasil.`;

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { carousel, slideIndex, instruction, brandId } = parsed.data;
  const target = carousel.slides[slideIndex];
  if (!target) {
    return Response.json({ error: "slide não encontrado" }, { status: 400 });
  }

  const context = {
    title: carousel.title,
    targetAudience: carousel.targetAudience,
    slides: carousel.slides.map((slide) => ({
      type: slide.type,
      headline: slide.headline,
      bodyText: slide.bodyText,
      bullets: slide.bullets,
    })),
  };

  const brief = `Documento completo (contexto, não reescreva os outros slides):\n${JSON.stringify(context, null, 2)}\n\nReescreva o slide ${slideIndex + 1}, tipo "${target.type}". Headline atual: "${target.headline}".${instruction ? `\n\nInstrução do usuário: ${instruction}` : ""}`;

  try {
    const { object, usage } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: slideContentSchema,
      // Mesma base de fatos da geração completa: regerar um slide sozinho é
      // exatamente onde o modelo tem menos contexto e mais chance de preencher
      // a lacuna com memória.
      system: buildGroundedSystem(SYSTEM, brandId),
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    const slideUsage = toTokenUsage(usage);
    const cost: GenerationCost = {
      usd: priceUsage(slideUsage),
      steps: [
        {
          label: `Slide ${slideIndex + 1} regerado`,
          usage: slideUsage,
          webSearches: 0,
          usd: priceUsage(slideUsage),
        },
      ],
    };

    // Só o texto é da IA — imagem, QR code e o resto da estrutura do slide não mudam.
    const headline = object.headline.trim();
    const bodyText = object.bodyText?.trim();
    const highlightTag = object.highlightTag?.trim();
    const bullets = (object.bullets ?? []).map((item) => item.trim()).filter(Boolean);

    const updated = slideSchema.safeParse({
      ...target,
      headline: headline || target.headline,
      bodyText: bodyText || target.bodyText,
      highlightTag: highlightTag || target.highlightTag,
      // Lista com menos de dois itens não substitui a que já estava: o slide
      // volta com a lista antiga em vez de virar uma lista de um item só.
      bullets: bullets.length >= MIN_BULLETS ? bullets : target.bullets,
    });

    if (!updated.success) {
      return Response.json(
        {
          error: "a IA devolveu um slide fora das regras",
          issues: updated.error.issues.map(
            (issue) => `${issue.path.join(".") || "slide"}: ${issue.message}`,
          ),
          cost,
        },
        { status: 422 },
      );
    }

    const warnings = findForbiddenInSlides([updated.data], brandId);

    return Response.json({ slide: updated.data, cost, warnings });
  } catch (error) {
    // O gasto acontece antes do erro; o recibo vai junto. Ver `failedGenerationStep`.
    const descartada = failedGenerationStep(error, `Slide ${slideIndex + 1} descartado`);
    const steps = descartada ? [descartada] : [];
    const message = generationErrorMessage(error, "o slide");
    return Response.json(
      {
        error: message,
        cost: { usd: steps.reduce((total, step) => total + step.usd, 0), steps },
      },
      { status: 500 },
    );
  }
}
