import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import type { BrandId } from "@/constants/brands";
import {
  EMPTY_USAGE,
  priceUsage,
  WEB_SEARCH_PRICE,
  type CostStep,
} from "@/constants/pricing";
import { buildSignalsBlock, fetchMarketSignals } from "@/lib/marketSignals";
import { countWebSearchesAcrossSteps, toTokenUsage } from "@/lib/usage";

/**
 * Monta o material que o redator recebe, seja qual for o formato da peça.
 *
 * Vive fora das rotas porque carrossel, apresentação e artigo partem exatamente
 * do mesmo preâmbulo — mesma URL lida, mesmos sinais do CRM, mesma busca de
 * notícia. O que muda entre eles é o system prompt e o schema, não a origem.
 */

const NEWS_SYSTEM = `Você pesquisa notícias recentes do setor de embalagem industrial,
logística e gestão de resíduos para dar contexto atual a um redator de conteúdo B2B.

Priorize, nessa ordem:
- Regulação e compliance (INMETRO, ANTT, ANP)
- Logística e big bags
- ESG e gestão de resíduos

Responda com um resumo de 3 a 5 linhas das notícias mais relevantes e recentes
relacionadas ao tema pedido. Se não encontrar nada relevante e recente, diga isso
em vez de inventar. Português do Brasil.`;

export const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

/**
 * Hosts que o servidor nunca vai buscar a pedido do usuário.
 *
 * QUEM COLA A URL É O USUÁRIO, MAS QUEM BUSCA É O SERVIDOR — e o servidor
 * alcança coisas que o navegador de quem colou não alcança: o próprio
 * localhost, a rede interna, e o endereço de metadados da instância
 * (169.254.169.254), que em nuvem devolve credencial. Sem esta guarda, colar
 * esse endereço no campo de tema faz o conteúdo dele virar texto dentro do
 * artigo. Hoje a ferramenta roda na máquina do Daniel, onde o alcance é o
 * mesmo; a guarda existe para o dia em que ela subir para algum lugar.
 */
const BLOQUEADOS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /\.local$/i,
  /\.internal$/i,
];

/** Teto do que se lê de uma página. O corte final é 8.000 caracteres; ler 200MB
 * para jogar fora 99,9% é só uma forma cara de travar o servidor. */
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 10_000;

function assertUrlPermitida(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL inválida");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("só http e https");
  }
  if (BLOQUEADOS.some((padrao) => padrao.test(url.hostname))) {
    throw new Error("essa URL aponta para a rede interna, não para uma página pública");
  }
  return url;
}

export async function fetchUrlText(url: string) {
  const alvo = assertUrlPermitida(url);

  const response = await fetch(alvo, {
    headers: { "user-agent": "carousel-builder" },
    // `manual` porque um redirecionamento levaria de volta para um host que a
    // checagem acima já recusou — a validação precisa valer para o destino
    // final, e a forma barata de garantir isso é não seguir redirecionamento.
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error("a URL redireciona; use o endereço final da página");
  }
  if (!response.ok) {
    throw new Error(`não foi possível ler a URL (HTTP ${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const html = new TextDecoder().decode(buffer.slice(0, MAX_BYTES));
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

/** Busca ao vivo — sem feed pra manter, sem banco de dados. */
export async function fetchNewsBrief(topic: string) {
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

export type BriefRequest = {
  input: string;
  context?: string;
  includeNews?: boolean;
  useSignals: boolean;
  signalIds?: string[];
  brandId: BrandId | null | undefined;
  /** Nome da peça no brief: "carrossel", "apresentação", "artigo". */
  piece: string;
  /** Artigo definido da peça, para a frase sair em português: "o" ou "a". */
  pieceArticle: "o" | "a";
};

export async function buildBrief({
  input,
  context,
  includeNews,
  useSignals,
  signalIds,
  brandId,
  piece,
  pieceArticle,
}: BriefRequest): Promise<{ brief: string; costSteps: CostStep[] }> {
  const costSteps: CostStep[] = [];
  const urlInput = isUrl(input);

  const parts = [
    urlInput
      ? `Baseie ${pieceArticle} ${piece} neste conteúdo extraído de ${input}:\n\n${await fetchUrlText(input)}`
      : `Tema d${pieceArticle} ${piece}: ${input}`,
  ];

  if (context?.trim()) {
    parts.push(
      `Contexto estratégico da marca (use para alinhar tom e prioridades):\n${context.trim()}`,
    );
  }

  // Sinal do CRM vem antes da busca web de propósito: é curado, tem fonte e é
  // de graça. Quando ele resolve o contexto, a busca paga vira supérflua.
  if (useSignals) {
    const all = await fetchMarketSignals(brandId);
    const chosen = signalIds?.length
      ? all.filter((signal) => signalIds.includes(signal.id))
      : all;

    if (chosen.length > 0) {
      parts.push(buildSignalsBlock(chosen));
      costSteps.push({
        label: `${chosen.length} ${chosen.length === 1 ? "sinal" : "sinais"} de mercado`,
        usage: EMPTY_USAGE,
        webSearches: 0,
        usd: 0,
      });
    }
  }

  // Notícia só faz sentido ancorando um tema aberto — uma URL já é a fonte
  // concreta. E é bônus: se falhar (ex.: busca web desativada na conta
  // Anthropic), a peça segue sem ela em vez de derrubar a geração inteira.
  if (includeNews && !urlInput) {
    try {
      const news = await fetchNewsBrief(input);
      costSteps.push(...news.costSteps);
      parts.push(
        `Notícias recentes do setor (use se forem relevantes ao tema, ignore se não forem):\n${news.text}`,
      );
    } catch {
      // segue sem notícias
    }
  }

  return { brief: parts.join("\n\n"), costSteps };
}
