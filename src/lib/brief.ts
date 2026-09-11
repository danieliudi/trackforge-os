import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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
 * Hosts / IPs que o servidor nunca vai buscar a pedido do usuário.
 *
 * QUEM COLA A URL É O USUÁRIO, MAS QUEM BUSCA É O SERVIDOR — e o servidor
 * alcança coisas que o navegador de quem colou não alcança: o próprio
 * localhost, a rede interna, e o endereço de metadados da instância
 * (169.254.169.254), que em nuvem devolve credencial.
 *
 * A guarda olha o hostname literal E o IP resolvido (DNS rebinding). IPv4
 * mapeado em IPv6 (`::ffff:127.0.0.1`) e link-local (`fe80::`) também entram.
 */

/** Teto do que se lê de uma página. O corte final é 8.000 caracteres; ler 200MB
 * para jogar fora 99,9% é só uma forma cara de travar o servidor. */
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 10_000;

function hostnameLiteral(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

/** IPv4 privado / loopback / link-local / metadata. */
function ipv4Privado(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // malformado = recusar
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/**
 * IPv6 privado / loopback / link-local / ULA / IPv4-mapeado para range privado.
 * Compara a forma expandida lowercase sem colchetes.
 */
function ipv6Privado(ip: string): boolean {
  const raw = ip.toLowerCase();
  if (raw === "::1" || raw === "::") return true;
  if (raw.startsWith("fe80:") || raw.startsWith("ff")) return true; // link-local / multicast
  if (raw.startsWith("fc") || raw.startsWith("fd")) return true; // ULA

  // ::ffff:0:0/96 — IPv4 mapeado. Aceita forma expandida e encurtada.
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
    ?? raw.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mapped) {
    if (mapped[1].includes(".")) return ipv4Privado(mapped[1]);
    const hi = Number.parseInt(mapped[1], 16);
    const lo = Number.parseInt(mapped[2], 16);
    const a = (hi >> 8) & 0xff;
    const b = hi & 0xff;
    const c = (lo >> 8) & 0xff;
    const d = lo & 0xff;
    return ipv4Privado(`${a}.${b}.${c}.${d}`);
  }
  return false;
}

export function ipPrivado(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return ipv4Privado(ip);
  if (kind === 6) return ipv6Privado(ip);
  return true;
}

function hostnameBloqueado(hostname: string): boolean {
  const host = hostnameLiteral(hostname).toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  // Hostname que já é um IP literal (com ou sem colchetes na URL).
  if (isIP(host)) return ipPrivado(host);
  return false;
}

export async function assertUrlPermitida(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL inválida");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("só http e https");
  }
  if (hostnameBloqueado(url.hostname)) {
    throw new Error("essa URL aponta para a rede interna, não para uma página pública");
  }

  // Resolve o DNS e confere o IP final — hostname público que aponta para
  // 169.254.169.254 / 10.x passaria só na guarda de string.
  const host = hostnameLiteral(url.hostname);
  if (!isIP(host)) {
    let addresses: { address: string }[];
    try {
      addresses = await lookup(host, { all: true, verbatim: true });
    } catch {
      throw new Error("não foi possível resolver essa URL");
    }
    if (addresses.length === 0 || addresses.some((row) => ipPrivado(row.address))) {
      throw new Error("essa URL aponta para a rede interna, não para uma página pública");
    }
  }

  return url;
}

export async function fetchUrlText(url: string) {
  const alvo = await assertUrlPermitida(url);

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
