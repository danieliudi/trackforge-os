import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { brands } from "@/constants/brands";
import { carouselBaseSchema, carouselSchema } from "@/types/carousel";

const requestSchema = z.object({
  input: z.string().min(3, "informe uma URL ou um tema"),
  /** Estratégia/posicionamento da marca ativa, colado na aba Contexto. */
  context: z.string().optional(),
  includeNews: z.boolean().optional(),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
});

const NEWS_SYSTEM = `Você pesquisa notícias recentes do setor de embalagem industrial,
logística e gestão de resíduos para dar contexto atual a um redator de conteúdo B2B.

Priorize, nessa ordem:
- Regulação e compliance (INMETRO, ANTT, ANP)
- Logística e big bags
- ESG e gestão de resíduos

Responda com um resumo de 3 a 5 linhas das notícias mais relevantes e recentes
relacionadas ao tema pedido. Se não encontrar nada relevante e recente, diga isso
em vez de inventar. Português do Brasil.`;

/** Busca ao vivo — sem feed pra manter, sem banco de dados. */
async function fetchNewsBrief(topic: string) {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-5"),
    system: NEWS_SYSTEM,
    prompt: `Tema: ${topic}`,
    tools: { web_search: anthropic.tools.webSearch_20260209({ maxUses: 3 }) },
  });
  return text;
}

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

  const { input, context, includeNews, brandId } = parsed.data;
  const urlInput = isUrl(input);

  try {
    const briefParts = [
      urlInput
        ? `Baseie o carrossel neste conteúdo extraído de ${input}:\n\n${await fetchUrlText(input)}`
        : `Tema do carrossel: ${input}`,
    ];

    if (context?.trim()) {
      briefParts.push(
        `Contexto estratégico da marca (use para alinhar tom e prioridades):\n${context.trim()}`,
      );
    }

    // Notícia só faz sentido ancorando um tema aberto — uma URL já é a fonte concreta.
    // Busca de notícia é um bônus: se falhar (ex.: busca web desativada na conta
    // Anthropic), o carrossel segue sem ela em vez de derrubar a geração inteira.
    if (includeNews && !urlInput) {
      try {
        briefParts.push(
          `Notícias recentes do setor (use se forem relevantes ao tema, ignore se não forem):\n${await fetchNewsBrief(input)}`,
        );
      } catch {
        // segue sem notícias
      }
    }

    const brief = briefParts.join("\n\n");

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: carouselBaseSchema,
      system: SYSTEM,
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    // footerNote é fato de marca, não criatividade — a IA nunca sabe o texto
    // real, então o servidor sobrescreve pelo canônico em vez de confiar nela.
    const tagline = brandId ? brands[brandId].tagline : undefined;

    // A ordem do array é a verdade; renumera antes de validar as regras finais.
    const normalized = {
      ...object,
      slides: object.slides.map((slide, index) => ({
        ...slide,
        slideNumber: index + 1,
        footerNote: tagline ?? slide.footerNote,
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
