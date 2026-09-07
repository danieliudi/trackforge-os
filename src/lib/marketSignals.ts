import { isPersonalFront, type BrandId } from "@/constants/brands";

/**
 * Sinais de mercado curados pelo time, lidos do CRM.
 *
 * Substituem a busca na web como fonte de contexto atual. A busca custava
 * US$ 0,01 por consulta — o item mais caro de uma geração — e devolvia
 * resultado que ninguém tinha conferido. O sinal já vem com fonte, link, data e
 * urgência, escolhido por gente que conhece o setor, e a consulta é de graça.
 *
 * Sem credencial configurada a função devolve lista vazia e o app segue: quem
 * roda o gerador nem sempre é quem tem acesso ao CRM.
 */
export type MarketSignal = {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  url: string | null;
  urgency: "alto" | "medio" | "info" | string;
  detectedAt: string;
};

/**
 * A tabela separa por empresa e o CRM chama a Sanwey de "industria" — a marca
 * ali é a unidade de negócio, não o nome comercial.
 *
 * `meu` não tem company_id de propósito: frente pessoal não lê sinal do CRM
 * nem entra em campanha.
 */
export const COMPANY_ID: Partial<Record<BrandId, string>> = {
  resibag: "resibag",
  sanwey: "industria",
};

/** Sinal velho não é contexto atual; é história. */
const MAX_AGE_DAYS = 120;
const MAX_SIGNALS = 8;

type SupabaseConfig = { url: string; key: string };

/**
 * A RLS de `market_signals` exige usuário autenticado com acesso à empresa, então
 * a leitura usa service role e só pode acontecer no servidor. A chave NUNCA pode
 * ganhar prefixo NEXT_PUBLIC_: ela ignora RLS e no navegador daria a qualquer
 * visitante o banco inteiro.
 */
function readConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

export function signalsConfigured(): boolean {
  return readConfig() !== null;
}

function parseRows(rows: unknown): MarketSignal[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const data = row as Record<string, unknown>;
    const str = (key: string) => (typeof data[key] === "string" ? (data[key] as string) : "");

    if (!str("id") || !str("title")) return [];

    return [
      {
        id: str("id"),
        title: str("title"),
        excerpt: str("excerpt"),
        source: str("source"),
        url: str("url") || null,
        urgency: str("urgency") || "info",
        detectedAt: str("detected_at") || str("created_at"),
      },
    ];
  });
}

/**
 * Busca os sinais recentes da marca.
 *
 * Erro de rede ou credencial errada devolve lista vazia em vez de propagar: o
 * sinal é contexto opcional, e derrubar a geração inteira por causa dele seria
 * cobrar do usuário uma falha de infraestrutura que ele não causou.
 */
export async function fetchMarketSignals(
  brandId: BrandId | null | undefined,
): Promise<MarketSignal[]> {
  const config = readConfig();
  if (!config || !brandId || isPersonalFront(brandId)) return [];

  const companyId = COMPANY_ID[brandId];
  if (!companyId) return [];

  const since = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();
  const query = new URLSearchParams({
    select: "id,title,excerpt,source,url,urgency,detected_at,created_at",
    company_id: `eq.${companyId}`,
    detected_at: `gte.${since}`,
    order: "detected_at.desc",
    limit: String(MAX_SIGNALS),
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/market_signals?${query}`, {
      headers: {
        apikey: config.key,
        authorization: `Bearer ${config.key}`,
        accept: "application/json",
      },
      // Contexto do dia: cachear entre gerações da mesma sessão é suficiente.
      next: { revalidate: 300 },
    });

    if (!response.ok) return [];
    return parseRows(await response.json());
  } catch {
    return [];
  }
}

const URGENCY_LABEL: Record<string, string> = {
  alto: "urgência alta",
  medio: "urgência média",
  info: "informativo",
};

/**
 * Sinais formatados para o prompt.
 *
 * Entram marcados como `[secundária]`, sob a mesma regra de procedência dos
 * outros fatos: podem entrar na peça, mas atribuindo a quem afirmou. O texto do
 * sinal é resumo do time a partir de uma fonte externa — às vezes um portal
 * setorial, não o órgão. Tratar isso como fato próprio é como a data errada da
 * NBR 10.004 entrou numa peça.
 */
export function buildSignalsBlock(signals: MarketSignal[]): string {
  if (signals.length === 0) return "";

  const lines = signals.map((signal) => {
    const meta = [signal.source, URGENCY_LABEL[signal.urgency] ?? signal.urgency, signal.detectedAt.slice(0, 10)]
      .filter(Boolean)
      .join(" · ");
    const link = signal.url ? `\n  Link: ${signal.url}` : "";
    return `- **[secundária]** ${signal.title}\n  ${signal.excerpt}\n  Fonte: ${meta}${link}`;
  });

  return `# SINAIS DE MERCADO DO CRM

Curados pelo time a partir de fonte externa. Use se forem relevantes ao tema,
ignore se não forem — não force um sinal dentro de um assunto que não é o dele.

Todos valem como **[secundária]**: a peça pode usá-los, atribuindo a quem afirmou
("segundo a ANTT", "em consulta pública do IBAMA"). Nunca apresente o conteúdo de
um sinal como fato próprio da marca, e nunca copie um número de dentro de um
sinal como se fosse dado verificado.

${lines.join("\n")}`;
}
