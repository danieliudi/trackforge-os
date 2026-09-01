import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import type { BrandId } from "@/constants/brands";
import { priceUsage, VERIFICATION_MODEL, type CostStep } from "@/constants/pricing";
import { buildGroundedSystem } from "@/knowledge";
import { slideText } from "@/knowledge/check";
import { toTokenUsage } from "@/lib/usage";
import type { Slide } from "@/types/carousel";

/**
 * Verificação semântica da peça gerada.
 *
 * A checagem determinística compara strings e pega termo proibido. Isso aqui pega
 * o que ela não alcança: número que ninguém sustenta, data que a fonte não
 * declara, alegação que soa certa e não rastreia a lugar nenhum. Foi assim que
 * "100% das cargas retidas" e "NBR 10.004 vigente desde jan/2025" entraram na
 * primeira peça real da ferramenta.
 *
 * Roda no Haiku porque conferir é mais barato que escrever — a afirmação e a
 * fonte chegam prontas, e a resposta é um veredito curto.
 *
 * Limite honesto: IA conferindo IA reduz risco, não zera. Vai ter falso positivo,
 * e alguma coisa vai passar. Por isso avisa e não bloqueia.
 */
export const verdictSchema = z.enum(["rastreado", "sem-fonte", "contradiz"]);

const claimSchema = z.object({
  /** Bloco onde a afirmação aparece: o slide no carrossel, a seção no artigo. */
  blockNumber: z.number().int().min(0),
  /** A afirmação como ela aparece na peça, curta o bastante pra caber num aviso. */
  claim: z.string().min(1).max(160),
  verdict: verdictSchema,
  /** Qual fato da base sustenta. Vazio quando o veredito não é "rastreado". */
  source: z.string().max(160).optional(),
  /** Por que não rastreia — só quando há problema. */
  note: z.string().max(240).optional(),
});

const verificationSchema = z.object({
  claims: z.array(claimSchema).max(30),
});

export type VerifiedClaim = z.infer<typeof claimSchema>;

export type Verification = {
  claims: VerifiedClaim[];
  /** Quantas afirmações não rastreiam. Zero = peça limpa. */
  flagged: number;
};

const SYSTEM = `Você audita uma peça de conteúdo B2B já escrita, conferindo cada
afirmação factual contra a base de fatos que recebeu.

O que auditar:
- Todo número, percentual, valor em reais, data, prazo, ano e quantidade.
- Toda citação de norma, lei, resolução, portaria, certificação ou código.
- Toda alegação sobre o que a empresa tem, faz ou já conquistou.

O que NÃO auditar (não liste):
- Opinião, tese, gancho, chamada para ação, pergunta retórica.
- Descrição de dor do cliente sem número.
- Vocabulário e tom.

Vereditos:
- "rastreado" — a afirmação corresponde a um fato da base. Em "source", cite o
  fato que a sustenta, curto.
- "sem-fonte" — a afirmação é factual mas não existe na base. Inclui número
  inventado, data que a base não declara e norma que a base não cita. Em "note",
  diga o que faltou.
- "contradiz" — a base diz outra coisa. Em "note", diga o que a base diz.

Regras que decidem o veredito:
- Um fato marcado [não verificado] ou [interna] na base NÃO sustenta um número
  na peça. Se a peça cita o número, o veredito é "sem-fonte", mesmo que o número
  bata com o texto da base — a base não foi conferida na fonte original.
- Fato [secundária] sustenta a afirmação SÓ se a peça atribuir a quem afirmou.
  Afirmação sem atribuição a partir de fato secundário é "sem-fonte".
- Fato [vencido] não sustenta nada.
- Na dúvida entre "rastreado" e "sem-fonte", escolha "sem-fonte". Um falso alarme
  custa uma revisão; um número inventado publicado custa a credibilidade da peça.

Responda em português do Brasil. Seja literal: audite o que está escrito, não o
que a peça provavelmente quis dizer.`;

/** Um pedaço numerado da peça: slide do carrossel, seção do artigo. */
export type VerifiableBlock = { number: number; label: string; text: string };

/**
 * Audita qualquer peça, desde que ela chegue como blocos numerados.
 *
 * O prompt e a base são os mesmos do carrossel de propósito: a regra de
 * procedência que barra um número sem lastro não muda porque o formato mudou.
 */
export async function verifyBlocks(
  blocks: VerifiableBlock[],
  brandId: BrandId | null | undefined,
  extraContext = "",
): Promise<{ verification: Verification; costStep: CostStep }> {
  const piece = blocks
    .map((block) => `Bloco ${block.number} (${block.label}): ${block.text}`)
    .join("\n");

  const { object, usage } = await generateObject({
    model: anthropic(VERIFICATION_MODEL),
    schema: verificationSchema,
    // A mesma base que o redator recebeu, com as mesmas marcas de procedência —
    // conferir contra uma base diferente da que gerou não provaria nada.
    system: buildGroundedSystem(SYSTEM, brandId),
    prompt: `${extraContext ? `${extraContext}\n\n` : ""}Peça a auditar:\n\n${piece}`,
  });

  const verifyUsage = toTokenUsage(usage);

  return {
    verification: {
      claims: object.claims,
      flagged: object.claims.filter((claim) => claim.verdict !== "rastreado").length,
    },
    costStep: {
      label: "Verificação da saída",
      usage: verifyUsage,
      webSearches: 0,
      usd: priceUsage(verifyUsage, 0, VERIFICATION_MODEL),
    },
  };
}

export function verifySlides(
  slides: Slide[],
  brandId: BrandId | null | undefined,
  extraContext = "",
) {
  return verifyBlocks(
    slides.map((slide) => ({
      number: slide.slideNumber,
      label: slide.type,
      text: slideText(slide),
    })),
    brandId,
    extraContext,
  );
}
