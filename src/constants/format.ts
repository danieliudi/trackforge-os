export type Format = "carrossel" | "apresentacao";
export type Platform = "linkedin" | "facebook" | "tiktok";

export const formatOptions: { id: Format; label: string }[] = [
  { id: "carrossel", label: "Carrossel" },
  { id: "apresentacao", label: "Apresentação" },
];

/**
 * Tom por plataforma além da proporção do canvas — cada uma alimenta um
 * bloco próprio no prompt de geração (ver /api/generate). O TikTok
 * deliberadamente não é "o mesmo carrossel do LinkedIn redimensionado":
 * é o formato onde a pesquisa mostrou que isso lê errado.
 */
export const platformOptions: { id: Platform; label: string; toneNote: string }[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    toneNote: "Dado concreto, autoridade B2B, copy mais longa.",
  },
  {
    id: "facebook",
    label: "Facebook",
    toneNote: "Mais curto e direto, um CTA só, tom mais coloquial.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    toneNote: "Gancho na capa, texto mínimo — não é o carrossel do LinkedIn redimensionado.",
  },
];

export function getPlatformToneNote(platform: Platform): string {
  return platformOptions.find(({ id }) => id === platform)?.toneNote ?? "";
}
