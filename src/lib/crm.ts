import type { BrandId } from "@/constants/brands";
import { COMPANY_ID } from "@/lib/marketSignals";
import { articleToMarkdown, type Article, type ChosenImage } from "@/types/article";
import { isCarousel, outputBlocks, OUTPUT_META, type OutputKind } from "@/types/outputs";
import type { Carousel } from "@/types/carousel";

/**
 * Envia a peça pronta para a fila de aprovação que já existe no CRM.
 *
 * POR QUE NÃO É UMA FILA NOVA: `agent_actions` já é exatamente isto — agente
 * propõe, humano aprova ou reprova com nota, e a aprovação publica no destino.
 * Está em produção com histórico real e dois tipos de sugestão rodando. Criar
 * uma segunda fila daria duas caixas de entrada para a mesma decisão.
 *
 * O QUE FICA DE FORA DE PROPÓSITO: rascunho, fontes por afirmação e parecer do
 * auditor vão no `payload`, que o papel `agencia` não lê. Na entrega para a
 * agência entra só o texto aprovado. Foi a decisão de setembro/2026 — em vez de
 * mexer na política de leitura, o material sensível não vai para a tabela que
 * ela enxerga.
 */

const ACTION_TYPE = "sugestao_peca_conteudo";

type GatewayConfig = { url: string; key: string };

/**
 * O gateway vive no mesmo projeto Supabase de onde saem os sinais, então a URL
 * é derivada em vez de virar mais uma variável para alguém errar.
 */
function readConfig(): GatewayConfig | null {
  const base = process.env.SUPABASE_URL;
  const key = process.env.CRM_AGENT_KEY;
  if (!base || !key) return null;
  return { url: `${base.replace(/\/$/, "")}/functions/v1/agent-gateway`, key };
}

export function crmPublishConfigured(): boolean {
  return readConfig() !== null;
}

export type PieceForPublish = {
  kind: OutputKind;
  /** O objeto do formato — carrossel, roteiro, sequência de telas. */
  data: unknown;
  flagged: number;
};

export type PublishInput = {
  article: Article;
  pieces: PieceForPublish[];
  /** Imagens escolhidas para o artigo — entram no markdown entregue. */
  images?: ChosenImage[];
  brandId?: BrandId | null;
  /** Sinal que originou a pauta, quando houve um. */
  sourceLabel?: string;
  /** Identificador estável da peça (PRD rastreio §5.2). Cruza pro entregável. */
  contentId?: string | null;
  /** UUID da campanha no CRM — chave de agregação com leads. */
  campaignId?: string | null;
  /** Nome canônico da campanha — espelhado em custom_fields pra a agência. */
  campaignName?: string | null;
};

/** Título da peça, que só o carrossel carrega dentro de si. */
function pieceTitle(piece: PieceForPublish): string {
  const meta = OUTPUT_META[piece.kind];
  if (isCarousel(piece.kind)) {
    const carousel = piece.data as Carousel;
    return carousel.title;
  }
  return `${meta.label} · ${meta.platform}`;
}

export type PublishResult = { id: string; status: string };

/** Uma linha por peça, curta o bastante para o pacote caber numa tela. */
function summarize({ article, pieces }: PublishInput): string {
  const list = pieces
    .map((piece) => `${OUTPUT_META[piece.kind].platform}: ${OUTPUT_META[piece.kind].label}`)
    .join(" · ");
  const flagged = pieces.reduce((total, piece) => total + piece.flagged, 0);

  return [
    article.dek,
    `Artigo + ${pieces.length} ${pieces.length === 1 ? "peça" : "peças"} (${list}).`,
    flagged === 0
      ? "Conferência: todas as afirmações rastreadas até o artigo."
      : `Conferência: ${flagged} ${flagged === 1 ? "afirmação" : "afirmações"} sem fonte — revise antes de aprovar.`,
  ].join(" ");
}

export async function publishForApproval(
  input: PublishInput,
): Promise<PublishResult> {
  const config = readConfig();
  if (!config) {
    throw new Error("o CRM não está configurado nesta instalação");
  }

  const { article, pieces, images, brandId, sourceLabel, contentId, campaignId, campaignName } =
    input;
  const flagged = pieces.reduce((total, piece) => total + piece.flagged, 0);

  const response = await fetch(`${config.url}?action=create`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-agent-key": config.key },
    body: JSON.stringify({
      action_type: ACTION_TYPE,
      title: article.title,
      summary: summarize(input),
      // Frente obrigatória por decisão de desenho: peça sem dono de frente é o
      // que faz material de uma marca sair com dado de outra.
      company_id: brandId ? COMPANY_ID[brandId] : null,
      // Uma peça com afirmação sem fonte não é urgência, é pendência — mas
      // precisa saltar na fila, porque é a que exige decisão sua.
      priority: flagged > 0 ? "alta" : "normal",
      payload: {
        origem: "carousel-builder",
        sinal: sourceLabel ?? null,
        // content_id e campaign_id atravessam pro entregável (custom_fields),
        // mesmo caminho que `sinal`. Intencional: a agência passa a ver o
        // código da peça (CLAUDE.md regra 10).
        content_id: contentId ?? null,
        campaign_id: campaignId ?? null,
        campaign_name: campaignName ?? null,
        artigo_markdown: articleToMarkdown(article, images ?? []),
        artigo: article,
        imagens: images ?? [],
        pecas: pieces.map((piece) => {
          const blocos = outputBlocks(piece.kind, piece.data);
          return {
            plataforma: OUTPUT_META[piece.kind].platform,
            formato: OUTPUT_META[piece.kind].label,
            titulo: pieceTitle(piece),
            blocos,
            // `slides` é a forma que o gateway em produção lê hoje. É o mesmo
            // conteúdo dos blocos, com o nome que aquele código espera — sem
            // isto, Reels e Stories chegariam ao entregável como um título sem
            // corpo. Some quando o gateway passar a ler `blocos`.
            slides: blocos.map((bloco) => ({
              slideNumber: bloco.number,
              headline: bloco.text,
            })),
            conteudo: piece.data,
            sem_fonte: piece.flagged,
          };
        }),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `o CRM recusou (HTTP ${response.status})`,
    );
  }

  return { id: data?.data?.id ?? "", status: data?.data?.status ?? "pending" };
}

export type PendingPiece = {
  id: string;
  title: string;
  summary: string | null;
  companyId: string | null;
  priority: string;
  createdAt: string;
};

/**
 * Peças da esteira esperando decisão sua na fila do CRM.
 *
 * Alimenta o painel: sem isto, "1 pacote esperando aprovação" seria um número
 * inventado, e número inventado num painel é pior que campo vazio — ele parece
 * informação. Só conta o que esta ferramenta propôs; sugestão de sinal e de
 * prospect são outra fila, de outro agente.
 */
export async function listPendingPieces(
  brandId?: BrandId | null,
): Promise<PendingPiece[]> {
  const config = readConfig();
  if (!config) return [];

  const params = new URLSearchParams({ action: "list", status: "pending", limit: "20" });
  if (brandId) params.set("company_id", COMPANY_ID[brandId]);

  const response = await fetch(`${config.url}?${params}`, {
    headers: { "x-agent-key": config.key },
  });
  if (!response.ok) return [];

  const body = await response.json().catch(() => ({}));
  const rows: unknown = body?.data;
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const data = row as Record<string, unknown>;
    // A fila é compartilhada com os outros agentes; filtra pelo tipo desta
    // ferramenta em vez de mostrar sugestão de prospect no painel do conteúdo.
    if (data.action_type !== ACTION_TYPE) return [];

    return [
      {
        id: String(data.id ?? ""),
        title: String(data.title ?? ""),
        summary: typeof data.summary === "string" ? data.summary : null,
        companyId: typeof data.company_id === "string" ? data.company_id : null,
        priority: String(data.priority ?? "normal"),
        createdAt: String(data.created_at ?? ""),
      },
    ];
  });
}
