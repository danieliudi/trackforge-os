import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { brands } from "@/constants/brands";
import { jsonBody } from "@/lib/apiError";
import { buildBrief } from "@/lib/brief";
import { buildCarrosselSystem } from "@/lib/prompts";
import { buildGroundedSystem } from "@/knowledge";
import { findForbiddenInSlides } from "@/knowledge/check";
import { verifySlides } from "@/lib/verify";
import { priceUsage, type CostStep, type GenerationCost } from "@/constants/pricing";
import { failedGenerationStep, generationErrorMessage, toTokenUsage } from "@/lib/usage";
import {
  apresentacaoSchema,
  carouselSchema,
  carouselWireSchema,
  normalizeCarousel,
} from "@/types/carousel";

const requestSchema = z.object({
  input: z.string().min(3, "informe uma URL ou um tema"),
  /** Estratégia/posicionamento da marca ativa, colado na aba Contexto. */
  context: z.string().optional(),
  includeNews: z.boolean().optional(),
  /** Sinais curados do CRM. Grátis e verificados — o default ligado. */
  useSignals: z.boolean().optional().default(true),
  /** Ids dos sinais escolhidos. Vazio = todos os recentes da marca. */
  signalIds: z.array(z.string()).optional(),
  /** Conferir a peça depois de gerar. */
  verify: z.boolean().optional().default(true),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
  format: z.enum(["carrossel", "apresentacao"]).optional().default("carrossel"),
  /** Só importa para o carrossel — Apresentação é sempre 16:9, tom único. */
  platform: z.enum(["linkedin", "instagram", "facebook", "tiktok"]).optional().default("linkedin"),
});

const APRESENTACAO_SYSTEM = `Você é redator de apresentações executivas internas em português do Brasil —
não é material de venda, é material de decisão para diretoria.

Regras obrigatórias de estrutura:
- Entre 4 e 20 slides, pela densidade do conteúdo pedido. Não estique com enchimento.
- O primeiro slide é sempre type "cover"; o último é sempre type "cta" (funciona como
  encerramento/próximos passos).
- Use "bullets" para agenda, listas de pontos, riscos ou prioridades — preencha o array
  "bullets" com 2 a 6 itens curtos (uma linha cada, até 70 caracteres); "headline" é o
  título da lista (ex.: "Agenda", "Riscos", "Próximas 3 etapas").
- Use "section" para dividir blocos temáticos da apresentação — é tela cheia, quase sem
  texto, só a headline (e opcionalmente "highlightTag" como categoria).
- "quote" carrega uma citação ou mensagem de destaque.
- "data_metric" é OPCIONAL e condicionado: só use quando existir, na base de fatos ou
  na origem, um número real que sustente o slide — e a headline é esse número copiado.
  Sem número verificável, não crie o slide. Inventar estatística é o pior erro
  possível nesta ferramenta.
- Numere slideNumber de 1 até N na ordem do array.

Regras obrigatórias de texto (o layout quebra quem violar):
- "headline" é o título do slide. Direto, sem jargão forçado.
- Em "data_metric" a headline é APENAS o número, nada mais.
- Em "bullets", NÃO preencha "bodyText" — o conteúdo vai todo em "bullets".
- Em "section", NÃO preencha "bodyText".
- Nos demais tipos, "bodyText" é um subtítulo curto de apoio (opcional, até 30 caracteres).
- "highlightTag" é opcional, 1-2 palavras.
- "footerNote" é a assinatura institucional, igual em todos os slides.

Escreva em português do Brasil. Tom claro e objetivo, para leitura rápida de liderança.`;

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { input, context, includeNews, useSignals, signalIds, verify, brandId, format, platform } =
    parsed.data;
  const isApresentacao = format === "apresentacao";

  // Fora do `try` para o recibo sobreviver ao erro: a busca na web é a linha
  // mais cara da geração e ela já foi cobrada quando a redação falha.
  const costSteps: CostStep[] = [];

  try {
    const { brief, costSteps: briefSteps } = await buildBrief({
      input,
      context,
      includeNews,
      useSignals,
      signalIds,
      brandId,
      piece: isApresentacao ? "apresentação" : "carrossel",
      pieceArticle: isApresentacao ? "a" : "o",
    });
    costSteps.push(...briefSteps);

    const { object, usage } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: carouselWireSchema,
      system: isApresentacao
        ? buildGroundedSystem(APRESENTACAO_SYSTEM, brandId)
        : buildCarrosselSystem(platform, brandId),
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    const writeUsage = toTokenUsage(usage);
    costSteps.push({
      label: isApresentacao ? "Redação da apresentação" : "Redação do carrossel",
      usage: writeUsage,
      webSearches: 0,
      usd: priceUsage(writeUsage),
    });

    const cost: GenerationCost = {
      usd: costSteps.reduce((total, step) => total + step.usd, 0),
      steps: costSteps,
    };

    // footerNote é fato de marca, não criatividade — a IA nunca sabe o texto
    // real, então o servidor sobrescreve pelo canônico em vez de confiar nela.
    const tagline = brandId ? brands[brandId].tagline : undefined;

    // Renumera, crava a assinatura e acerta a moldura do primeiro e do último
    // slide antes de validar. Ver `normalizeCarousel`.
    const normalized = normalizeCarousel(object, tagline);

    const validated = (isApresentacao ? apresentacaoSchema : carouselSchema).safeParse(
      normalized,
    );
    if (!validated.success) {
      // O custo vai junto no erro: os tokens foram cobrados mesmo com a
      // resposta inválida, e uma geração que falhou é exatamente a que o
      // usuário não deveria pagar sem saber.
      return Response.json(
        {
          error: "a IA devolveu um carrossel fora das regras",
          issues: validated.error.issues.map(
            (issue) => `${issue.path.join(".") || "peça"}: ${issue.message}`,
          ),
          cost,
        },
        { status: 422 },
      );
    }

    // Checagem determinística: o prompt manda não usar termo proibido, isto
    // confere se ele obedeceu. Não bloqueia — quem edita é o usuário; só não
    // deixa a violação passar despercebida até a publicação.
    const warnings = findForbiddenInSlides(validated.data.slides, brandId);

    // Verificação semântica: pega o que a varredura de string não alcança —
    // número sem lastro, data que a fonte não declara. Falha aqui não invalida a
    // peça: o usuário já pagou pela geração, e ficar sem o parecer é melhor que
    // perder o carrossel.
    let verification = null;
    if (verify) {
      try {
        const result = await verifySlides(validated.data.slides, brandId);
        verification = result.verification;
        cost.steps.push(result.costStep);
        cost.usd += result.costStep.usd;
      } catch {
        // segue sem parecer
      }
    }

    return Response.json({ carousel: validated.data, cost, warnings, verification });
  } catch (error) {
    // O gasto acontece antes do erro; o recibo vai junto. Ver `failedGenerationStep`.
    const descartada = failedGenerationStep(
      error,
      isApresentacao ? "Redação da apresentação (descartada)" : "Redação do carrossel (descartada)",
    );
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
