import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import {
  carouselSchema,
  MAX_BODY_LENGTH,
  MAX_BULLET_LENGTH,
  MAX_BULLETS,
  MIN_BULLETS,
  slideSchema,
} from "@/types/carousel";

const requestSchema = z.object({
  carousel: carouselSchema,
  slideIndex: z.number().int().nonnegative(),
  instruction: z.string().optional(),
});

const slideContentSchema = z.object({
  headline: z.string().min(1),
  /** Ausente em slides "bullets"/"section" — não são renderizados nesses tipos. */
  bodyText: z.string().max(MAX_BODY_LENGTH).optional(),
  highlightTag: z.string().min(1).optional(),
  /** Só em slides "bullets". */
  bullets: z.array(z.string().min(1).max(MAX_BULLET_LENGTH)).min(MIN_BULLETS).max(MAX_BULLETS).optional(),
});

const SYSTEM = `Você é redator de carrosséis e apresentações B2B, reescrevendo UM slide
específico dentro de um documento já existente.

Regras obrigatórias de texto (o layout quebra quem violar):
- "headline" é o texto principal do slide. Sem jargão, sem emoji.
- Em slides "data_metric" a headline é APENAS o número, nada mais.
  Válido: "22%", "3,4x", "R$ 1,2 mi". Inválido: qualquer frase.
- Em slides "bullets", preencha o array "bullets" com 2 a 6 itens curtos (até 70
  caracteres cada) e NÃO preencha "bodyText".
- Em slides "section", só a "headline" importa — NÃO preencha "bodyText".
- Nos demais tipos, "bodyText" tem NO MÁXIMO 30 CARACTERES — é um rótulo de apoio,
  não uma frase.
- "highlightTag" é opcional e curto (1-2 palavras).

Mantenha o mesmo "type" do slide e a coerência com o título, o público-alvo e os
outros slides do documento. Escreva em português do Brasil.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { carousel, slideIndex, instruction } = parsed.data;
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
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: slideContentSchema,
      system: SYSTEM,
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    // Só o texto é da IA — imagem, QR code e o resto da estrutura do slide não mudam.
    const updated = slideSchema.safeParse({
      ...target,
      headline: object.headline,
      bodyText: object.bodyText ?? target.bodyText,
      highlightTag: object.highlightTag ?? target.highlightTag,
      bullets: object.bullets ?? target.bullets,
    });

    if (!updated.success) {
      return Response.json(
        {
          error: "a IA devolveu um slide fora das regras",
          issues: updated.error.issues.map((issue) => issue.message),
        },
        { status: 422 },
      );
    }

    return Response.json(updated.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
