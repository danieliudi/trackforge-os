import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { brands, type BrandId } from "@/constants/brands";
import type { Platform } from "@/constants/format";
import { buildGroundedSystem } from "@/knowledge";
import {
  EMPTY_USAGE,
  priceUsage,
  WEB_SEARCH_PRICE,
  type CostStep,
  type GenerationCost,
} from "@/constants/pricing";
import { countWebSearchesAcrossSteps, toTokenUsage } from "@/lib/usage";
import {
  apresentacaoBaseSchema,
  apresentacaoSchema,
  carouselBaseSchema,
  carouselSchema,
} from "@/types/carousel";

const requestSchema = z.object({
  input: z.string().min(3, "informe uma URL ou um tema"),
  /** Estratégia/posicionamento da marca ativa, colado na aba Contexto. */
  context: z.string().optional(),
  includeNews: z.boolean().optional(),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
  format: z.enum(["carrossel", "apresentacao"]).optional().default("carrossel"),
  /** Só importa para o carrossel — Apresentação é sempre 16:9, tom único. */
  platform: z.enum(["linkedin", "facebook", "tiktok"]).optional().default("linkedin"),
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
  const { text, totalUsage, steps } = await generateText({
    model: anthropic("claude-sonnet-5"),
    system: NEWS_SYSTEM,
    prompt: `Tema: ${topic}`,
    tools: { web_search: anthropic.tools.webSearch_20260209({ maxUses: 3 }) },
  });

  // `totalUsage` e não `usage`: com ferramenta a Anthropic devolve uma etapa por
  // rodada de busca, e `usage` descreve só a última delas.
  const usage = toTokenUsage(totalUsage);
  const searches = countWebSearchesAcrossSteps(steps);

  // A busca vira linha própria no recibo. Diluída no total ela some, e é
  // justamente o item mais caro: US$ 0,01 por busca contra centavos de token.
  const costSteps: CostStep[] = [
    { label: "Leitura das notícias", usage, webSearches: 0, usd: priceUsage(usage) },
  ];
  if (searches > 0) {
    costSteps.push({
      label: `${searches} ${searches === 1 ? "busca" : "buscas"} na web`,
      usage: EMPTY_USAGE,
      webSearches: searches,
      usd: searches * WEB_SEARCH_PRICE,
    });
  }

  return { text, costSteps };
}

const CARROSSEL_SYSTEM_BASE = `Você é redator de carrosséis B2B de alta conversão para redes sociais.

Regras obrigatórias de estrutura:
- Entre 4 e 12 slides. Você decide a quantidade pela densidade do conteúdo:
  - Notícia direta, anúncio ou recado curto: 5 a 6 slides.
  - Guia tático, playbook ou estudo de caso denso: 7 a 10 slides.
  - Só passe de 10 se o conteúdo sustentar; nunca estique com enchimento.
- O primeiro slide é sempre type "cover"; o último é sempre type "cta".
- Numere slideNumber de 1 até N na ordem do array, onde N é o total que você escolheu.
- "quote" carrega uma tese forte.
- "data_metric" é OPCIONAL e condicionado: só use quando existir, na base de fatos
  ou na origem, um número real que sustente o slide — e a headline é esse número
  copiado. Sem número verificável, não crie o slide. Inventar estatística
  ("100%", "38%", "3 em cada 4") é o pior erro possível nesta ferramenta.

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

/**
 * Tom por plataforma, além da proporção do canvas (que já é tratada na
 * renderização). Achado de pesquisa: LinkedIn e Facebook toleram o mesmo
 * pipeline com ajuste de tom; TikTok precisa de uma regra própria, porque o
 * mesmo carrossel do LinkedIn redimensionado lê errado lá.
 */
const PLATFORM_TONE: Record<Platform, string> = {
  linkedin: `Plataforma: LinkedIn (post de documento/carrossel). Tom autoral e orientado a dado — a audiência já está em modo "aprender", pode sustentar mais densidade de informação por slide.`,
  facebook: `Plataforma: Facebook (carrossel de feed). Frases mais curtas e diretas que no LinkedIn, tom mais coloquial, um único CTA claro por post. Evite jargão corporativo denso — a audiência aqui é mais ampla que no LinkedIn.`,
  tiktok: `Plataforma: TikTok (carrossel de fotos). A capa PRECISA ser um gancho que para o scroll em menos de 1 segundo — pergunta direta, número chocante ou afirmação contra-intuitiva, nunca um título de relatório. Texto mínimo por slide, frases curtas tipo lista. Isto NÃO é o carrossel do LinkedIn redimensionado: se o texto ficaria bem num documento PDF, está denso demais para o TikTok.`,
};

function buildCarrosselSystem(platform: Platform, brandId: BrandId | null | undefined) {
  return buildGroundedSystem(
    `${CARROSSEL_SYSTEM_BASE}\n\n${PLATFORM_TONE[platform]}`,
    brandId,
  );
}

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

  const { input, context, includeNews, brandId, format, platform } = parsed.data;
  const urlInput = isUrl(input);
  const isApresentacao = format === "apresentacao";

  try {
    const costSteps: CostStep[] = [];
    const briefParts = [
      urlInput
        ? `Baseie ${isApresentacao ? "a apresentação" : "o carrossel"} neste conteúdo extraído de ${input}:\n\n${await fetchUrlText(input)}`
        : `Tema ${isApresentacao ? "da apresentação" : "do carrossel"}: ${input}`,
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
        const news = await fetchNewsBrief(input);
        costSteps.push(...news.costSteps);
        briefParts.push(
          `Notícias recentes do setor (use se forem relevantes ao tema, ignore se não forem):\n${news.text}`,
        );
      } catch {
        // segue sem notícias
      }
    }

    const brief = briefParts.join("\n\n");

    const { object, usage } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: isApresentacao ? apresentacaoBaseSchema : carouselBaseSchema,
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

    // A ordem do array é a verdade; renumera antes de validar as regras finais.
    const normalized = {
      ...object,
      slides: object.slides.map((slide, index) => ({
        ...slide,
        slideNumber: index + 1,
        footerNote: tagline ?? slide.footerNote,
      })),
    };

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
          issues: validated.error.issues.map((issue) => issue.message),
          cost,
        },
        { status: 422 },
      );
    }

    return Response.json({ carousel: validated.data, cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
