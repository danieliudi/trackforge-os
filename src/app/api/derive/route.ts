import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { brands, type BrandId } from "@/constants/brands";
import type { Platform } from "@/constants/format";
import { priceUsage, type CostStep, type GenerationCost } from "@/constants/pricing";
import { findForbiddenInSlides } from "@/knowledge/check";
import { buildCarrosselSystem } from "@/lib/prompts";
import { toTokenUsage } from "@/lib/usage";
import { verifySlides } from "@/lib/verify";
import { articleSchema, articleToMarkdown, type Article } from "@/types/article";
import { carouselBaseSchema, carouselSchema, type Carousel } from "@/types/carousel";

/**
 * Deriva as peças curtas a partir do artigo.
 *
 * A ORDEM É A REGRA, não uma conveniência: LinkedIn sai do artigo, Instagram
 * sai do LinkedIn. Escrever os três em paralelo a partir do tema é o que produz
 * a afirmação que existe só na peça curta e não no artigo — e essa é justamente
 * a que ninguém confere, porque o artigo passou pela auditoria e ela não.
 *
 * Por isso a auditoria de cada peça derivada recebe o artigo junto da base de
 * fatos: aqui "rastreado" significa rastreado até a origem, não até o mundo.
 */

const requestSchema = z.object({
  article: articleSchema,
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
});

/** Regra que separa derivar de escrever do zero. Vale para os dois passos. */
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

async function writePiece({
  platform,
  brandId,
  sourceLabel,
  sourceText,
}: {
  platform: Platform;
  brandId: BrandId | null | undefined;
  sourceLabel: string;
  sourceText: string;
}) {
  const { object, usage } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: carouselBaseSchema,
    system: `${buildCarrosselSystem(platform, brandId)}\n${DERIVE_RULES}`,
    prompt: `${sourceLabel}:\n\n${sourceText}`,
    providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
  });

  return { object, usage: toTokenUsage(usage) };
}

type DerivedPiece = {
  platform: Platform;
  carousel: Carousel;
  warnings: ReturnType<typeof findForbiddenInSlides>;
  verification: Awaited<ReturnType<typeof verifySlides>>["verification"] | null;
};

/** Renumera pela ordem do array e crava a assinatura canônica da marca. */
function normalize(object: z.infer<typeof carouselBaseSchema>, brandId: BrandId | null | undefined) {
  const tagline = brandId ? brands[brandId].tagline : undefined;
  return {
    ...object,
    slides: object.slides.map((slide, index) => ({
      ...slide,
      slideNumber: index + 1,
      footerNote: tagline ?? slide.footerNote,
    })),
  };
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { article, brandId } = parsed.data;
  const costSteps: CostStep[] = [];

  try {
    const articleText = articleToMarkdown(article as Article);

    // Passo 1 — LinkedIn a partir do artigo.
    const linkedin = await writePiece({
      platform: "linkedin",
      brandId,
      sourceLabel: "Artigo de origem",
      sourceText: articleText,
    });
    costSteps.push({
      label: "LinkedIn a partir do artigo",
      usage: linkedin.usage,
      webSearches: 0,
      usd: priceUsage(linkedin.usage),
    });

    const linkedinCarousel = carouselSchema.safeParse(normalize(linkedin.object, brandId));
    if (!linkedinCarousel.success) {
      return Response.json(
        {
          error: "a IA devolveu o post de LinkedIn fora das regras",
          issues: linkedinCarousel.error.issues.map((issue) => issue.message),
          cost: { usd: costSteps.reduce((t, s) => t + s.usd, 0), steps: costSteps },
        },
        { status: 422 },
      );
    }

    // Passo 2 — Instagram a partir do LinkedIn, não do artigo. O artigo vai
    // junto só como referência de fato, para o Instagram não herdar um erro que
    // o LinkedIn tenha introduzido sem ter como conferir.
    const linkedinText = linkedinCarousel.data.slides
      .map((slide) => `${slide.headline}${slide.bodyText ? ` — ${slide.bodyText}` : ""}`)
      .join("\n");

    const instagram = await writePiece({
      platform: "instagram",
      brandId,
      sourceLabel: "Peça de origem (post de LinkedIn já aprovado internamente)",
      sourceText: `${linkedinText}\n\nArtigo completo, para conferir fato — não para copiar estrutura:\n\n${articleText}`,
    });
    costSteps.push({
      label: "Instagram a partir do LinkedIn",
      usage: instagram.usage,
      webSearches: 0,
      usd: priceUsage(instagram.usage),
    });

    const instagramCarousel = carouselSchema.safeParse(normalize(instagram.object, brandId));
    if (!instagramCarousel.success) {
      return Response.json(
        {
          error: "a IA devolveu o post de Instagram fora das regras",
          issues: instagramCarousel.error.issues.map((issue) => issue.message),
          cost: { usd: costSteps.reduce((t, s) => t + s.usd, 0), steps: costSteps },
        },
        { status: 422 },
      );
    }

    const cost: GenerationCost = {
      usd: costSteps.reduce((total, step) => total + step.usd, 0),
      steps: costSteps,
    };

    // O artigo entra como contexto da auditoria: numa peça derivada, "rastreado"
    // quer dizer rastreado até a origem.
    const sourceContext = `Artigo de origem desta peça. Uma afirmação que aparece aqui É rastreada, mesmo que a base de fatos não a repita. Uma afirmação que NÃO aparece aqui nem na base é "sem-fonte", ainda que soe plausível:\n\n${articleText}`;

    const pieces: DerivedPiece[] = [];

    for (const [platform, carousel] of [
      ["linkedin", linkedinCarousel.data],
      ["instagram", instagramCarousel.data],
    ] as const) {
      let verification: DerivedPiece["verification"] = null;
      try {
        const result = await verifySlides(carousel.slides, brandId, sourceContext);
        verification = result.verification;
        cost.steps.push({ ...result.costStep, label: `Conferência do ${platform}` });
        cost.usd += result.costStep.usd;
      } catch {
        // segue sem parecer — a peça já foi paga
      }

      pieces.push({
        platform,
        carousel,
        warnings: findForbiddenInSlides(carousel.slides, brandId),
        verification,
      });
    }

    return Response.json({ pieces, cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
