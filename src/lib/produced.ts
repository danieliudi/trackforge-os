import type { BrandId } from "@/constants/brands";
import type { Article, ChosenImage } from "@/types/article";
import type { OutputKind } from "@/types/outputs";

/**
 * O que a bancada produziu, guardado assim que sai do modelo.
 *
 * POR QUE ISTO EXISTE: até aqui só o carrossel era salvo, e só se o usuário
 * clicasse "Abrir no editor" — porque a persistência do app nasceu para o
 * editor de slides, quando peça era sinônimo de carrossel. Post de texto,
 * legenda, Reels, Stories e o próprio artigo viviam apenas no estado do React:
 * sair da tela apagava tudo, depois de a geração ter sido paga. O Daniel
 * perdeu peças assim, e o log de custo mostrava o gasto de algo que não existia
 * mais em lugar nenhum.
 *
 * A GRAVAÇÃO É AUTOMÁTICA, sem botão de salvar. Um botão transformaria "não
 * perder trabalho pago" numa lembrança do usuário, que é exatamente o que
 * falhou.
 */

export type ProducedPiece = {
  kind: OutputKind;
  data: unknown;
  /** "derivado do artigo", "do material colado" — a origem fica junto. */
  from: string;
  /** Afirmações sem fonte no parecer do auditor. */
  flagged: number;
};

export type Production = {
  id: string;
  at: number;
  brandId: BrandId | null;
  /** Rótulo da origem: o sinal, o tema, o nome do arquivo. */
  source: string;
  /**
   * A origem inteira, não só o rótulo.
   *
   * Guardar só o rótulo fazia a produção reabrir sempre como "Tema" com o NOME
   * do arquivo no campo — e um clique em "Reescrever o artigo" gastava dinheiro
   * gerando a partir de "relatorio.md" em vez do conteúdo dele.
   */
  origin?: { mode: string; input: string; signalId: string | null; fileName: string | null };
  title: string;
  article: Article | null;
  images: ChosenImage[];
  pieces: ProducedPiece[];
  /** Já foi para a fila de aprovação do CRM. */
  sent: boolean;
  /**
   * Identificador estável da peça (`{frente}-{4 hex}`). Uma peça tem um
   * content_id para sempre — republicação reusa o mesmo id (PRD rastreio §5.2).
   * Opcional nas produções antigas gravadas antes desta coluna.
   */
  contentId?: string | null;
  /** UUID da campanha no CRM (canal Conteúdo / Digital). */
  campaignId?: string | null;
  /** Nome canônico da campanha (`{frente}-{aaaamm}-{tema}`) — entra no UTM. */
  campaignName?: string | null;
};

/** Versionado como os rascunhos: formato novo descarta payload antigo. */
const KEY = "carousel-builder:producoes:v1";

/**
 * Teto de produções guardadas.
 *
 * Cada uma é só texto — artigo, peças e créditos de imagem, alguns KB. O que
 * pesa no localStorage são os rascunhos do editor, que carregam imagem em data
 * URL; 40 produções cabem sem ameaçar aquele espaço.
 */
const MAX = 40;

function isValid(value: unknown): value is Production {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === "string" &&
    typeof data.at === "number" &&
    typeof data.title === "string" &&
    typeof data.source === "string" &&
    Array.isArray(data.pieces) &&
    Array.isArray(data.images) &&
    typeof data.sent === "boolean"
  );
}

function load(): Production[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch {
    return [];
  }
}

/**
 * Mesmo padrão do log de custo: store externo com snapshot de servidor, porque
 * ler o localStorage no inicializador de um `useState` faz o servidor renderizar
 * diferente do cliente.
 */
const EMPTY: Production[] = [];
let cache: Production[] | null = null;
const listeners = new Set<() => void>();

export function subscribeProductions(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Referencialmente estável entre chamadas, ou o React entra em loop. */
export function getProductionsSnapshot(): Production[] {
  cache ??= load();
  return cache;
}

export function getProductionsServerSnapshot(): Production[] {
  return EMPTY;
}

function persist(next: Production[]) {
  cache = next.slice(0, MAX);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // Segue com o valor em memória: falhar aqui não pode derrubar a geração
      // que o usuário acabou de pagar.
    }
  }
  listeners.forEach((listener) => listener());
}

/**
 * Grava ou atualiza uma produção pelo id, mantendo a mais recente no topo.
 *
 * É upsert e não append porque uma produção cresce em etapas — primeiro o
 * artigo, depois as peças, depois as imagens e o envio. Cada etapa regrava a
 * mesma linha em vez de criar uma nova.
 */
export function saveProduction(production: Production): void {
  const rest = getProductionsSnapshot().filter((item) => item.id !== production.id);
  persist([production, ...rest]);
}

export function getProduction(id: string): Production | null {
  return getProductionsSnapshot().find((item) => item.id === id) ?? null;
}

export function removeProduction(id: string): void {
  persist(getProductionsSnapshot().filter((item) => item.id !== id));
}
