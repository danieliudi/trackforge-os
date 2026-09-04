import type { BrandId } from "@/constants/brands";
import {
  getNormativeFacts,
  isExpired,
  TIER_LABEL,
  type FactRecord,
} from "@/knowledge/provenance";

/**
 * Fila de verificação de fatos — a mesma ordem de risco do
 * `scripts/audit-knowledge.mjs`, para a tela e o CLI não divergirem.
 */

const HARD_DATA = /R\$|\d{4}|\d+%|art\.|n[ºo°]\s*\d|\d+\/\d{4}|\bIBC-|\b\d+:\d+\b/i;

export type FactQueueItem = FactRecord & {
  brandId: BrandId;
  status: "vencido" | "nao-verificado" | "secundaria" | "interna" | "revalidar";
  statusLabel: string;
  hasHardData: boolean;
  risk: number;
};

function statusOf(fact: FactRecord, today: Date): FactQueueItem["status"] {
  if (isExpired(fact, today)) return "vencido";
  if (fact.tier === "nao-verificado") return "nao-verificado";
  if (fact.tier === "secundaria") return "secundaria";
  if (fact.tier === "interna") return "interna";
  return "revalidar";
}

function riskScore(fact: FactRecord, today: Date): number {
  let score = 0;
  if (isExpired(fact, today)) score += 3;
  if (HARD_DATA.test(fact.claim)) score += 2;
  if (!fact.url) score += 1;
  if (fact.tier === "nao-verificado") score += 1;
  return score;
}

/** Fatos que ainda não podem virar número numa peça, ou que vencem em 30 dias. */
export function factVerificationQueue(
  brandId: BrandId,
  today = new Date(),
): FactQueueItem[] {
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);

  const facts = getNormativeFacts(brandId);
  // Mesma base do audit CLI: não-primária ou vencida. Acrescenta primária que
  // vence nos próximos 30 dias — a fila da tela precisa avisar antes de expirar.
  const pending = facts.filter((fact) => {
    if (isExpired(fact, today)) return true;
    if (fact.tier !== "primaria") return true;
    if (!fact.revalidateBy) return false;
    const due = new Date(fact.revalidateBy);
    return due > today && due <= horizon;
  });

  return pending
    .map((fact) => {
      const status = statusOf(fact, today);
      return {
        ...fact,
        brandId,
        status,
        statusLabel: status === "vencido" ? "vencido" : TIER_LABEL[fact.tier],
        hasHardData: HARD_DATA.test(fact.claim),
        risk: riskScore(fact, today),
      };
    })
    .sort((a, b) => b.risk - a.risk);
}
