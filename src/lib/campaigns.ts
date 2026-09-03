import type { BrandId } from "@/constants/brands";
import { COMPANY_ID } from "@/lib/marketSignals";

/**
 * Campanhas de conteúdo no CRM, lidas com service role (mesmo padrão dos sinais).
 *
 * Devolve união discriminada, não lista: "não existe campanha de conteúdo",
 * "não tenho credencial para perguntar" e "o CRM recusou" são três coisas
 * diferentes que davam a MESMA lista vazia — e o seletor da bancada ficava mudo
 * nas três. Quem estava publicando não tinha como saber se faltava cadastro no
 * CRM ou variável de ambiente no servidor.
 */

export type ContentCampaign = {
  id: string;
  name: string;
  channel: string;
  companyIds: string[];
};

export type CampaignsResult =
  | { status: "ok"; campaigns: ContentCampaign[] }
  | { status: "sem-credencial" }
  | { status: "erro"; detail: string };

/**
 * Canais de `MARKETING_CHANNELS` (CRM) que um produtor de conteúdo pode
 * escolher aqui — os rótulos são do CRM, esta lista não inventa taxonomia nova.
 *
 * `Conteúdo` e `Digital` vêm do desenho do rastreio. `Social` entrou depois de
 * o seletor nascer vazio com três campanhas cadastradas: é com esse canal que o
 * time abre campanha de post/carrossel no Kanban de Campanhas, que é
 * exatamente a peça que sai desta bancada. `Email`, `Outdoor` e `Evento` ficam
 * de fora — feira e mala direta não são publicação de peça daqui.
 */
export const CONTENT_CHANNELS = ["Conteúdo", "Digital", "Social"] as const;

/** Campanha de conteúdo é dezena, não milhar; uma página cobre o CRM inteiro. */
const MAX_CAMPAIGNS = 200;

type SupabaseConfig = { url: string; key: string };

function readConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

/** Acento e caixa não são taxonomia: `Conteúdo`, `conteudo` e `CONTEÚDO` são o mesmo canal. */
function channelKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const CONTENT_CHANNEL_KEYS = new Set(CONTENT_CHANNELS.map(channelKey));

export function isContentChannel(channel: string): boolean {
  return CONTENT_CHANNEL_KEYS.has(channelKey(channel));
}

function parseRows(rows: unknown): ContentCampaign[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const data = row as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id : "";
    const name = typeof data.name === "string" ? data.name : "";
    if (!id || !name) return [];

    const channel = typeof data.channel === "string" ? data.channel : "";
    const companyIds = Array.isArray(data.company_ids)
      ? data.company_ids.filter((item): item is string => typeof item === "string")
      : [];

    return [{ id, name, channel, companyIds }];
  });
}

export async function fetchContentCampaigns(
  brandId: BrandId | null | undefined,
): Promise<CampaignsResult> {
  const config = readConfig();
  if (!config) return { status: "sem-credencial" };

  // O canal é filtrado aqui, não no PostgREST. `channel=in.(Conteúdo,Digital)`
  // compara byte a byte: uma linha gravada `conteudo` ou `CONTEÚDO` some sem
  // aviso, e um `in.()` acentuado na query string é o tipo de coisa que quebra
  // ao trocar de proxy. A empresa também fica no JS porque `company_ids` é
  // array e campanha sem empresa ainda deve aparecer.
  const query = new URLSearchParams({
    select: "id,name,channel,company_ids",
    order: "created_at.desc",
    limit: String(MAX_CAMPAIGNS),
  });

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/marketing_campaigns?${query}`, {
      headers: {
        apikey: config.key,
        authorization: `Bearer ${config.key}`,
        accept: "application/json",
      },
      next: { revalidate: 60 },
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "falha de rede";
    return { status: "erro", detail: `não foi possível falar com o CRM (${reason})` };
  }

  // Sem corpo do erro na tela: 401/403 aqui é credencial errada ou RLS, e o
  // corpo do PostgREST nesses casos descreve a policy. O número basta para
  // separar credencial (401/403) de tabela ausente (404) e de CRM fora (5xx).
  if (!response.ok) {
    return { status: "erro", detail: `o CRM respondeu HTTP ${response.status}` };
  }

  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return { status: "erro", detail: "o CRM devolveu um corpo que não é JSON" };
  }

  const companyId = brandId ? COMPANY_ID[brandId] : null;
  const campaigns = parseRows(rows).filter(
    (campaign) =>
      isContentChannel(campaign.channel) &&
      (companyId === null ||
        campaign.companyIds.length === 0 ||
        campaign.companyIds.includes(companyId)),
  );

  return { status: "ok", campaigns };
}
