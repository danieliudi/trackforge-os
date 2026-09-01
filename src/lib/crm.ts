import type { BrandId } from "@/constants/brands";
import { COMPANY_ID } from "@/lib/marketSignals";
import { articleToMarkdown, type Article } from "@/types/article";
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
  platform: string;
  carousel: Carousel;
  flagged: number;
};

export type PublishInput = {
  article: Article;
  pieces: PieceForPublish[];
  brandId?: BrandId | null;
  /** Sinal que originou a pauta, quando houve um. */
  sourceLabel?: string;
};

export type PublishResult = { id: string; status: string };

/** Uma linha por peça, curta o bastante para o pacote caber numa tela. */
function summarize({ article, pieces }: PublishInput): string {
  const list = pieces
    .map((piece) => `${piece.platform}: ${piece.carousel.slides.length} slides`)
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

  const { article, pieces, brandId, sourceLabel } = input;
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
        artigo_markdown: articleToMarkdown(article),
        artigo: article,
        pecas: pieces.map((piece) => ({
          plataforma: piece.platform,
          titulo: piece.carousel.title,
          slides: piece.carousel.slides,
          sem_fonte: piece.flagged,
        })),
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
