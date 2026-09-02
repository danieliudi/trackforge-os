import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { buildBrief } from "@/lib/brief";
import { buildGroundedSystem } from "@/knowledge";
import { findForbidden } from "@/knowledge/check";
import { verifyBlocks } from "@/lib/verify";
import { priceUsage, type GenerationCost } from "@/constants/pricing";
import { toTokenUsage } from "@/lib/usage";
import {
  articleBlocks,
  articleSchema,
  MAX_PARAGRAPHS,
  MAX_SECTIONS,
  MAX_TAKEAWAYS,
  MIN_SECTIONS,
  MIN_TAKEAWAYS,
  TARGET_WORDS,
} from "@/types/article";

const requestSchema = z.object({
  input: z.string().min(3, "informe uma URL ou um tema"),
  context: z.string().optional(),
  includeNews: z.boolean().optional(),
  useSignals: z.boolean().optional().default(true),
  signalIds: z.array(z.string()).optional(),
  verify: z.boolean().optional().default(true),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
});

const ARTIGO_SYSTEM = `Você escreve o artigo de blog que abre um ciclo editorial B2B.

Este artigo é o ativo permanente: o post de LinkedIn e o de Instagram vão ser
derivados DELE depois. Toda afirmação que você quiser ver nas peças curtas
precisa existir aqui primeiro, com lastro.

Regras obrigatórias de estrutura:
- Entre ${MIN_SECTIONS} e ${MAX_SECTIONS} seções, cada uma com título próprio e
  até ${MAX_PARAGRAPHS} parágrafos. Deixe o texto entre ${TARGET_WORDS.min} e
  ${TARGET_WORDS.max} palavras — densidade real, sem enchimento para bater meta.
- "dek" é a linha de apoio sob o título: uma frase que diz do que trata e para quem.
- "takeaways" tem de ${MIN_TAKEAWAYS} a ${MAX_TAKEAWAYS} itens, e cada um é uma
  AÇÃO que o leitor executa, não um resumo do que ele acabou de ler.
- "sources" lista o que sustenta o texto. Norma se identifica pelo número e pelo
  órgão ("Resolução ANTT nº 5.998/2022") e não precisa de link; só inclua "url"
  se a URL vier do material que você recebeu. NUNCA invente uma URL.

Regras obrigatórias de fato — a razão de esta ferramenta existir:
- Todo número, percentual, prazo, data e citação de norma tem que vir da base de
  fatos ou do material recebido. Se não veio, não escreva.
- Se faltar o dado que a frase pediria, escreva a frase sem ele. Não estime,
  não arredonde de cabeça, não use "cerca de" para disfarçar chute.
- Não invente nome de cliente, caso, prêmio, volume produzido ou capacidade.

Regras de "suggestedOutputs" — o que o conteúdo sustenta:
- Liste de 1 a 5 formatos entre: "carrossel-linkedin", "carrossel-instagram",
  "post-texto", "legenda", "reels", "stories". Em "reason", uma frase dizendo por que aquele formato serve a ESTE
  conteúdo — não o que o formato é.
- Sugira pelo que o assunto pede, não pelo que dá mais peça. Notícia de uma
  linha não vira carrossel de oito slides sem virar enchimento; prazo com data
  cabe em post de texto e em stories; passo a passo é carrossel.
- Não liste um formato só para completar a lista.

Regras de "imageIdeas" — que imagem o artigo pede:
- De 1 a 4 ideias. "slot" é "capa" ou o título EXATO de uma das seções que você
  escreveu — nunca um título que não existe no artigo.
- "describes" é o que a foto deve mostrar, em português, concreto: "operador
  movimentando big bag com empilhadeira em pátio industrial", não "logística".
- "query" é o termo de busca EM INGLÊS, de 2 a 5 palavras, do jeito que se
  procura foto de banco de imagem: "industrial warehouse forklift", não uma
  frase. O acervo é indexado em inglês; termo em português não acha nada.
- Norma, prazo e número não têm foto literal. Quando a seção for sobre isso,
  procure o CONTEXTO físico — o pátio, o documento sobre a mesa, o equipamento,
  a inspeção. Nunca sugira infográfico, ilustração de conceito ou gráfico.
- Não sugira foto de pessoa identificável em situação que o artigo não sustenta.

Regras de texto:
- Português do Brasil, parágrafos curtos, voz ativa.
- Sem "no mundo de hoje", "cada vez mais", "não é segredo que". Comece pelo assunto.
- Sem emoji e sem pergunta retórica como abertura de seção.
- Você escreve para quem decide compra técnica: seja concreto sobre prazo,
  exigência e consequência.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { input, context, includeNews, useSignals, signalIds, verify, brandId } = parsed.data;

  try {
    const { brief, costSteps } = await buildBrief({
      input,
      context,
      includeNews,
      useSignals,
      signalIds,
      brandId,
      piece: "artigo",
      pieceArticle: "o",
    });

    const { object, usage } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: articleSchema,
      system: buildGroundedSystem(ARTIGO_SYSTEM, brandId),
      prompt: brief,
      providerOptions: { anthropic: { thinking: { type: "adaptive" } } },
    });

    const writeUsage = toTokenUsage(usage);
    costSteps.push({
      label: "Redação do artigo",
      usage: writeUsage,
      webSearches: 0,
      usd: priceUsage(writeUsage),
    });

    const cost: GenerationCost = {
      usd: costSteps.reduce((total, step) => total + step.usd, 0),
      steps: costSteps,
    };

    const blocks = articleBlocks(object);

    // Mesma varredura determinística do carrossel: o prompt manda não usar termo
    // proibido, isto confere se ele obedeceu. Avisa, não bloqueia — quem edita
    // e publica é o usuário.
    const warnings = findForbidden(
      blocks.map((block) => ({ blockNumber: block.number, text: block.text })),
      brandId,
    );

    // Falha na auditoria não invalida o artigo: ele já foi pago, e ficar sem o
    // parecer é melhor que perder o texto.
    let verification = null;
    if (verify) {
      try {
        const result = await verifyBlocks(blocks, brandId);
        verification = result.verification;
        cost.steps.push(result.costStep);
        cost.usd += result.costStep.usd;
      } catch {
        // segue sem parecer
      }
    }

    return Response.json({ article: object, cost, warnings, verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
