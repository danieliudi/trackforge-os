import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { carouselBaseSchema, carouselSchema } from "@/types/carousel";

const requestSchema = z.object({
  input: z.string().min(3, "informe uma URL ou um tema"),
});

const SYSTEM = `Você é redator de carrosséis B2B de alta conversão para LinkedIn.

Regras obrigatórias de estrutura:
- Entre 4 e 12 slides. Você decide a quantidade pela densidade do conteúdo:
  - Notícia direta, anúncio ou recado curto: 5 a 6 slides.
  - Guia tático, playbook ou estudo de caso denso: 7 a 10 slides.
  - Só passe de 10 se o conteúdo sustentar; nunca estique com enchimento.
- O primeiro slide é sempre type "cover"; o último é sempre type "cta".
- Numere slideNumber de 1 até N na ordem do array, onde N é o total que você escolheu.
- Use "data_metric" para um número concreto e "quote" para uma tese forte.

Regras obrigatórias de texto (o layout quebra quem violar):
- "headline" é o texto principal do slide. Máximo 90 caracteres, sem jargão, sem emoji.
  Headline longa demais é reduzida ao corpo mínimo e cortada na renderização.
- Em slides "data_metric" a headline é APENAS o número, nada mais.
  Válido: "22%", "3,4x", "R$ 1,2 mi". Inválido: qualquer frase.
- "bodyText" tem NO MÁXIMO 30 CARACTERES. É um rótulo de apoio, não uma frase.
  Exemplos válidos: "Guia para diretores", "22% em 9 meses", "Agende um diagnóstico".
- "highlightTag" é opcional e curto (1-2 palavras).
- "footerNote" é a assinatura institucional, no máximo 45 caracteres, igual em todos os slides.

Escreva em português do Brasil. Foque em dor concreta, número e próximo passo.`;

const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

async function fetchUrlText(url: string) {
  const response = await fetch(url, { headers: { "user-agent": "carousel-builder" } });
  if (!response.ok) {
    throw new Error(`não foi possível ler a URL (HTTP ${response.status})`);
  }
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { input } = parsed.data;

  try {
    const brief = isUrl(input)
      ? `Baseie o carrossel neste conteúdo extraído de ${input}:\n\n${await fetchUrlText(input)}`
      : `Tema do carrossel: ${input}`;

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: carouselBaseSchema,
      system: SYSTEM,
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    // A ordem do array é a verdade; renumera antes de validar as regras finais.
    const normalized = {
      ...object,
      slides: object.slides.map((slide, index) => ({
        ...slide,
        slideNumber: index + 1,
      })),
    };

    const validated = carouselSchema.safeParse(normalized);
    if (!validated.success) {
      return Response.json(
        {
          error: "a IA devolveu um carrossel fora das regras",
          issues: validated.error.issues.map((issue) => issue.message),
        },
        { status: 422 },
      );
    }

    return Response.json(validated.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
