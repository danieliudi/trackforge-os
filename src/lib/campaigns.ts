import type { BrandId } from "@/constants/brands";
import { COMPANY_ID } from "@/lib/marketSignals";

/**
 * Campanhas de conteúdo no CRM, lidas com service role (mesmo padrão dos sinais).
 *
 * Só canal "Conteúdo" (e "Digital" pra mídia paga com o mesmo formato de nome).
 * Sem credencial devolve lista vazia — o seletor some em vez de derrubar o envio.
 */

export type ContentCampaign = {
  id: string;
  name: string;
  channel: string;
  companyIds: string[];
};

type SupabaseConfig = { url: string; key: string };

function readConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function campaignsConfigured(): boolean {
  return readConfig() !== null;
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
): Promise<ContentCampaign[]> {
  const config = readConfig();
  if (!config) return [];

  // PostgREST: `in` nos canais do circuito de conteúdo; filtro de frente no JS
  // porque `company_ids` é array e campanha sem empresa ainda deve aparecer.
  const query = new URLSearchParams({
    select: "id,name,channel,company_ids",
    channel: "in.(Conteúdo,Digital)",
    order: "created_at.desc",
    limit: "80",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/marketing_campaigns?${query}`, {
      headers: {
        apikey: config.key,
        authorization: `Bearer ${config.key}`,
        accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) return [];
    const rows = parseRows(await response.json());
    if (!brandId) return rows;

    const companyId = COMPANY_ID[brandId];
    return rows.filter(
      (campaign) =>
        campaign.companyIds.length === 0 || campaign.companyIds.includes(companyId),
    );
  } catch {
    return [];
  }
}
