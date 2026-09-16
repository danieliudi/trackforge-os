import type { CSSProperties } from "react";

import type { Format, Platform } from "./format";

/** Proporção 4:5 (LinkedIn) — canvas virtual em px, escalado via CSS na exibição. */
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

/** Margem institucional do canvas (px do canvas virtual). */
export const SLIDE_PADDING = 88;

/** Proporção de cada combinação formato×plataforma. Apresentação é sempre 16:9. */
const CARROSSEL_SIZE: Record<Platform, { width: number; height: number }> = {
  linkedin: { width: 1080, height: 1350 },
  instagram: { width: 1080, height: 1350 },
  facebook: { width: 1080, height: 1080 },
  tiktok: { width: 1080, height: 1920 },
};
const APRESENTACAO_SIZE = { width: 1920, height: 1080 };

export function resolveCanvasSize(format: Format, platform: Platform) {
  return format === "apresentacao" ? APRESENTACAO_SIZE : CARROSSEL_SIZE[platform];
}

/** Mesma proporção de margem do canvas original (88/1080), pra manter a densidade visual em qualquer formato. */
export function resolvePadding(width: number) {
  return Math.round(width * (SLIDE_PADDING / SLIDE_WIDTH));
}

export type SlideThemeId =
  | "dark-modern"
  | "clean-industrial"
  | "editorial"
  | "sanwey"
  | "resibag"
  | "sanwey-industrial"
  | "sanwey-impacto"
  | "sanwey-preto"
  | "resibag-escuro"
  | "resibag-ativo"
  | "resibag-selo";

/** Agrupamento usado pelo dropdown do painel lateral. */
export const THEME_GROUPS: { label: string; themes: SlideThemeId[] }[] = [
  { label: "Sanwey", themes: ["sanwey", "sanwey-industrial", "sanwey-impacto", "sanwey-preto"] },
  { label: "Resibag", themes: ["resibag", "resibag-escuro", "resibag-ativo", "resibag-selo"] },
  { label: "Genéricos", themes: ["dark-modern", "clean-industrial", "editorial"] },
];

type SlideThemeTokens = {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  /** Cor de texto sobre blocos preenchidos com `accent`. */
  accentContrast: string;
  /**
   * O acento QUANDO ELE É LETRA — o número do `data_metric` e a atribuição da
   * citação. Nunca derive de `accent`.
   *
   * POR QUE É CAMPO SEPARADO. Manual de marca autoriza cor por PAPEL, e as
   * cores de destaque costumam ser autorizadas só como preenchimento: a v11 da
   * Resibag diz isso do Verde Vivo com todas as letras. Enquanto o layout lia
   * `theme.accent` para pintar texto, o `resibag-ativo` renderizava o "38%" —
   * o número que é a razão de o slide existir — a 2,27:1, e a atribuição da
   * citação a 2,71:1. Abaixo até do piso de ornamento.
   *
   * Foi um erro DESTA sessão e ele tem duas datas. Em 16/09/2026 o mockup da
   * Fase 6 nasceu com o kicker na cor do acento, a medição reprovou, e a regra
   * derivada entrou no `DESIGN-fase6.md`: kicker tem cor PRÓPRIA, nunca "a
   * mesma do acento". Horas depois, ao trazer o mockup para cá, vieram só os
   * campos que já existiam no tipo — e o `kick` do `spec.json`, que era
   * justamente a correção, ficou para trás. Quem pegou foi o `qa:temas`.
   */
  accentInk: string;
  border: string;
  displayFont: string;
  bodyFont: string;
  /** Fonte do número em slides `data_metric`. */
  metricFont: string;
  displayWeight: number;
  displayTracking: string;
  badgeRadius: number;
  /** Base do overlay aplicado sobre `imageUrl`. Sempre escura, por contraste. */
  overlayColor: string;
  /** Decide qual versão do logo usar e o contraste do chrome. */
  surface: "light" | "dark";
};

export type SlideTheme = SlideThemeTokens & {
  id: SlideThemeId;
  label: string;
  /** Camada decorativa desenhada atrás do conteúdo. */
  decor?: CSSProperties;
  /** Tokens usados quando o slide tem imagem de fundo ou capa escura. */
  darkSurface: Partial<SlideThemeTokens>;
  /** Capa renderiza na superfície escura (regra de social dos dois manuais). */
  coverUsesDarkSurface?: boolean;
};

const GEIST = "var(--font-geist-sans)";
const INTER = "var(--font-inter)";

export const slideThemes: Record<SlideThemeId, SlideTheme> = {
  "dark-modern": {
    id: "dark-modern",
    label: "Dark Modern / Tech",
    background: "#0f172a",
    foreground: "#f8fafc",
    muted: "#94a3b8",
    accent: "#38bdf8",
    accentContrast: "#0f172a",
    accentInk: "#38bdf8",
    border: "rgba(148, 163, 184, 0.22)",
    displayFont: GEIST,
    bodyFont: GEIST,
    metricFont: GEIST,
    displayWeight: 600,
    displayTracking: "-0.03em",
    badgeRadius: 999,
    overlayColor: "#020617",
    surface: "dark",
    decor: {
      backgroundImage:
        "radial-gradient(900px 620px at 88% 4%, rgba(56, 189, 248, 0.16), transparent 62%), radial-gradient(760px 520px at 2% 98%, rgba(99, 102, 241, 0.14), transparent 64%)",
    },
    darkSurface: {},
  },
  "clean-industrial": {
    id: "clean-industrial",
    label: "Clean Industrial / B2B",
    background: "#f8fafc",
    foreground: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    accentContrast: "#ffffff",
    accentInk: "#2563eb",
    border: "#dbe2ea",
    displayFont: GEIST,
    bodyFont: GEIST,
    metricFont: GEIST,
    displayWeight: 700,
    displayTracking: "-0.025em",
    badgeRadius: 8,
    overlayColor: "#0f172a",
    surface: "light",
    decor: {
      backgroundImage:
        "linear-gradient(to right, rgba(15, 23, 42, 0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.055) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    },
    darkSurface: {
      foreground: "#f8fafc",
      muted: "#cbd5e1",
      accent: "#60a5fa",
      accentInk: "#60a5fa",
      border: "rgba(248, 250, 252, 0.24)",
      surface: "dark",
    },
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    background: "#f4f1ea",
    foreground: "#14110d",
    muted: "#6b6355",
    accent: "#a8321d",
    accentContrast: "#faf8f3",
    accentInk: "#a8321d",
    border: "rgba(20, 17, 13, 0.18)",
    displayFont: "var(--font-instrument-serif)",
    bodyFont: GEIST,
    metricFont: "var(--font-instrument-serif)",
    displayWeight: 400,
    displayTracking: "-0.02em",
    badgeRadius: 0,
    overlayColor: "#14110d",
    surface: "light",
    darkSurface: {
      foreground: "#f4f1ea",
      muted: "#d6cfc2",
      accent: "#e2725b",
      accentInk: "#e2725b",
      border: "rgba(244, 241, 234, 0.24)",
      surface: "dark",
    },
  },

  /**
   * Sanwey — Sistema Visual DOC-SW-MM-06 v7.0b.
   * Paleta oficial: Superfície #F9F9F9 / Ink #1A1A1A / Vermelho Sanwey #C7212B.
   * O manual proibe azul, laranja e roxo fora da paleta.
   * Regra de social: "capa em Ink para parar scroll; leitura em Superfície".
   * F9F5F1/2C2C2B/D1D5DB eram a paleta v5.1 — descontinuada, ver sanwey-canonical-facts §16.
   */
  sanwey: {
    id: "sanwey",
    label: "Sanwey (institucional)",
    background: "#F9F9F9",
    foreground: "#1A1A1A",
    muted: "#707070",
    accent: "#C7212B",
    accentContrast: "#FFFFFF",
    accentInk: "#C7212B",
    border: "#CFCFCF",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#0A0A0A",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0A0A0A",
      accentContrast: "#0A0A0A",
      accentInk: "#DD4039",
      accent: "#DD4039",
      foreground: "#F9F9F9",
      muted: "#B0B0B0",
      border: "rgba(249, 249, 249, 0.22)",
      surface: "dark",
    },
  },

  /**
   * Resibag — Manual de Marca v9.0 (Maio 2026).
   * Spec de carrossel LinkedIn: capa em Resibag Dark, internas claras.
   * Regra dura: verde no maximo 35% da area — por isso o fundo padrao e claro.
   */
  resibag: {
    id: "resibag",
    label: "Resibag (ESG)",
    background: "#F6FBEF",
    foreground: "#000000",
    muted: "#646A63",
    accent: "#006E1E",
    accentContrast: "#FFFFFF",
    accentInk: "#006E1E",
    border: "#EAF0E3",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#006E1E",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#006E1E",
      foreground: "#FFFFFF",
      muted: "#CFE8D9",
      accent: "#4DBE55",
      accentContrast: "#000000",
      accentInk: "#CFE8D9",
      border: "rgba(255, 255, 255, 0.22)",
      surface: "dark",
    },
  },

  // --- Variações Sanwey (dentro da paleta oficial do MIV v2.0) ---
  /** Cinza industrial: a cor que o próprio manual manda usar pra destacar
   * seção sem recorrer a blocos vermelhos grandes. */
  "sanwey-industrial": {
    id: "sanwey-industrial",
    label: "Sanwey Industrial",
    background: "#F2F2F2",
    foreground: "#1A1A1A",
    muted: "#545454",
    accent: "#C7212B",
    accentContrast: "#FFFFFF",
    accentInk: "#C7212B",
    border: "#CFCFCF",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#0A0A0A",
    /**
     * `light`, e não `dark`: a Fase 6 trocou o fundo de cinza-700 para a
     * superfície elevada, e estas duas linhas ficaram para trás na mesma
     * edição. `surface` escolhe a VERSÃO DO LOGO — com `dark` aqui, o logo
     * invertido saía sobre #F2F2F2.
     */
    surface: "light",
    /**
     * E `{}` deixou de servir pelo mesmo motivo. Sobre foto de fundo o tema
     * inteiro escurece, mas com o objeto vazio o título continuava #1A1A1A e o
     * meta #545454 — quase-preto sobre a foto já coberta de preto. Aparece na
     * captura de 16/09: o slide de citação do industrial é ilegível.
     *
     * São os tokens escuros do `sanwey`, e isso é de propósito: o manual da
     * Sanwey tem UMA paleta de fundo escuro, e nela o vermelho de texto é o
     * SINAL (4,59 sobre o Preto Premium), não o base (3,47).
     */
    darkSurface: {
      background: "#0A0A0A",
      foreground: "#F9F9F9",
      muted: "#B0B0B0",
      accent: "#DD4039",
      accentContrast: "#0A0A0A",
      accentInk: "#DD4039",
      border: "rgba(249, 249, 249, 0.22)",
      surface: "dark",
    },
  },
  /** Vermelho+Branco — combinação monocromática aprovada pelo manual pra
   * material de alto impacto. */
  "sanwey-impacto": {
    id: "sanwey-impacto",
    label: "Sanwey Impacto",
    background: "#C7212B",
    foreground: "#FFFFFF",
    muted: "#FBE9EB",
    accent: "#0A0A0A",
    accentContrast: "#FFFFFF",
    accentInk: "#0A0A0A",
    border: "rgba(255, 255, 255, 0.24)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#0A0A0A",
    surface: "dark",
    /**
     * O vermelho sólido é o tema — e sobre foto de fundo ele desaparece debaixo
     * do gradiente preto, levando junto o Preto Premium que serve de acento.
     * Com `{}` a atribuição da citação saía preta sobre preto: está na captura
     * de 16/09. Não é regressão da Fase 6 — antes dela o acento era #8B1419 e
     * sumia igual.
     *
     * Sobre a foto quem identifica a marca é o vermelho, então ele volta como
     * PREENCHIMENTO (com branco em cima, 5,71), e a letra de acento vira branco.
     */
    darkSurface: {
      accent: "#C7212B",
      accentContrast: "#FFFFFF",
      accentInk: "#FFFFFF",
      surface: "dark",
    },
  },
  /** Preto+Branco — a outra combinação monocromática aprovada; mais
   * contraste que o Carvão suave do tema institucional. */
  "sanwey-preto": {
    id: "sanwey-preto",
    label: "Sanwey Preto",
    background: "#0A0A0A",
    foreground: "#F9F9F9",
    muted: "#B0B0B0",
    accent: "#DD4039",
    accentContrast: "#0A0A0A",
    accentInk: "#DD4039",
    border: "rgba(249, 249, 249, 0.16)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#0A0A0A",
    surface: "dark",
    darkSurface: {},
  },

  // --- Variações Resibag (dentro da paleta oficial do MM v9.0) ---
  /** Resibag Dark + Mint — os mesmos tokens já aprovados pra capa, só
   * aplicados no carrossel inteiro em vez de só na primeira slide. */
  "resibag-escuro": {
    id: "resibag-escuro",
    label: "Resibag Escuro",
    background: "#006E1E",
    foreground: "#FFFFFF",
    muted: "#CFE8D9",
    accent: "#4DBE55",
    accentContrast: "#000000",
    accentInk: "#CFE8D9",
    border: "rgba(255, 255, 255, 0.22)",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#006E1E",
    surface: "dark",
    darkSurface: {},
  },
  /** Resibag Active — o tom que o manual reserva pra "botões de ação,
   * links, ícones ativos" — como acento principal, mais vívido que o
   * institucional. */
  "resibag-ativo": {
    id: "resibag-ativo",
    label: "Resibag Ativo",
    background: "#F6FBEF",
    foreground: "#000000",
    muted: "#646A63",
    accent: "#4DBE55",
    accentContrast: "#000000",
    accentInk: "#006E1E",
    border: "#EAF0E3",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#006E1E",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#006E1E",
      foreground: "#FFFFFF",
      muted: "#CFE8D9",
      accent: "#4DBE55",
      accentContrast: "#000000",
      accentInk: "#CFE8D9",
      border: "rgba(255, 255, 255, 0.22)",
      surface: "dark",
    },
  },
  /** Certification Gold — reservado pelo manual pra selos INMETRO/ANTT/ANP —
   * bom pra conteúdo de compliance e certificação. */
  "resibag-selo": {
    id: "resibag-selo",
    label: "Resibag Selo",
    background: "#F6FBEF",
    foreground: "#000000",
    muted: "#646A63",
    accent: "#1B5E8A",
    accentContrast: "#FFFFFF",
    accentInk: "#1B5E8A",
    border: "#D8EEF4",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#006E1E",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#006E1E",
      foreground: "#FFFFFF",
      muted: "#CFE8D9",
      accent: "#D8EEF4",
      accentContrast: "#1B5E8A",
      accentInk: "#D8EEF4",
      border: "rgba(255, 255, 255, 0.22)",
      surface: "dark",
    },
  },
};

/**
 * Resolve os tokens efetivos do slide. Imagem de fundo sempre força a
 * superfície escura, porque o overlay obrigatório deixa o fundo escuro.
 */
export function resolveTheme(
  themeId: SlideThemeId,
  slideType: string,
  hasImage: boolean,
): SlideTheme {
  const theme = slideThemes[themeId];
  // "section" é o divisor de bloco da Apresentação — mesma regra de impacto que a capa.
  const isDarkByType = slideType === "cover" || slideType === "section";
  const needsDark = hasImage || (isDarkByType && theme.coverUsesDarkSurface === true);

  if (!needsDark) return theme;
  return { ...theme, ...theme.darkSurface };
}

export const slideThemeOptions = Object.values(slideThemes).map(
  ({ id, label }) => ({ id, label }),
);
