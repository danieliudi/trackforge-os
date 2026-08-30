import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { priceUsage, type GenerationCost } from "@/constants/pricing";
import { buildProhibitionsBlock } from "@/knowledge";
import { toTokenUsage } from "@/lib/usage";

const requestSchema = z.object({
  context: z.string().min(1, "informe o contexto da marca"),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
});

const suggestionsSchema = z.object({
  topics: z.array(z.string().min(1)).length(4),
});

const SYSTEM = `Você sugere temas de carrossel B2B para LinkedIn a partir do contexto
estratégico de uma marca (posicionamento, prioridades, documentos internos).

Cada tema é uma frase curta (até 90 caracteres), específica o bastante pra virar
um carrossel denso — nunca genérica ("dicas de logística" é fraco; "3 erros que
atrasam a homologação ANTT de um big bag" é forte). Português do Brasil.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const { object, usage } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: suggestionsSchema,
      // Só as proibições, não a base inteira: um tema sugerido não é publicado,
      // mas semeia o brief — e não faz sentido sugerir algo que a geração final
      // teria de recusar.
      system: [SYSTEM, buildProhibitionsBlock(parsed.data.brandId)]
        .filter(Boolean)
        .join("\n\n"),
      prompt: `Contexto estratégico da marca:\n${parsed.data.context}\n\nSugira 4 temas de carrossel alinhados a esse contexto.`,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    const suggestionsUsage = toTokenUsage(usage);
    const cost: GenerationCost = {
      usd: priceUsage(suggestionsUsage),
      steps: [
        {
          label: "Sugestões de tema",
          usage: suggestionsUsage,
          webSearches: 0,
          usd: priceUsage(suggestionsUsage),
        },
      ],
    };

    return Response.json({ ...object, cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
