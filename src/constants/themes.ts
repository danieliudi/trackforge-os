import type { CSSProperties } from "react";

/** Proporção 4:5 — canvas virtual em px, escalado via CSS na exibição. */
export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

/** Margem institucional do canvas (px do canvas virtual). */
export const SLIDE_PADDING = 88;

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
    muted: "#8A8680",
    accent: "#C7212B",
    accentContrast: "#FFFFFF",
    border: "#E5E0DA",
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
      background: "#1A1A1A",
      foreground: "#F9F9F9",
      muted: "#E2E2E2",
      border: "rgba(249, 249, 249, 0.24)",
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
    background: "#FAF8F6",
    foreground: "#1E2A22",
    muted: "#5A6B60",
    accent: "#1B5E3A",
    accentContrast: "#FAF8F6",
    border: "#EDF2EE",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0D3D20",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0D3D20",
      foreground: "#FAF8F6",
      muted: "#EDF2EE",
      accent: "#72FD9C",
      accentContrast: "#0D3D20",
      border: "rgba(250, 248, 246, 0.22)",
      surface: "dark",
    },
  },

  // --- Variações Sanwey (dentro da paleta oficial do MIV v2.0) ---
  /** Cinza industrial: a cor que o próprio manual manda usar pra destacar
   * seção sem recorrer a blocos vermelhos grandes. */
  "sanwey-industrial": {
    id: "sanwey-industrial",
    label: "Sanwey Industrial",
    background: "#545454",
    foreground: "#F9F9F9",
    muted: "#E2E2E2",
    accent: "#C7212B",
    accentContrast: "#FFFFFF",
    border: "rgba(249, 249, 249, 0.18)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#545454",
    surface: "dark",
    darkSurface: {},
  },
  /** Vermelho+Branco — combinação monocromática aprovada pelo manual pra
   * material de alto impacto. */
  "sanwey-impacto": {
    id: "sanwey-impacto",
    label: "Sanwey Impacto",
    background: "#C7212B",
    foreground: "#FFFFFF",
    muted: "#FBE9EB",
    accent: "#8B1419",
    accentContrast: "#FFFFFF",
    border: "rgba(255, 255, 255, 0.24)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#8B1419",
    surface: "dark",
    darkSurface: {},
  },
  /** Preto+Branco — a outra combinação monocromática aprovada; mais
   * contraste que o Carvão suave do tema institucional. */
  "sanwey-preto": {
    id: "sanwey-preto",
    label: "Sanwey Preto",
    background: "#0A0A0A",
    foreground: "#FFFFFF",
    muted: "#8A8680",
    accent: "#C7212B",
    accentContrast: "#FFFFFF",
    border: "rgba(255, 255, 255, 0.16)",
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
    background: "#0D3D20",
    foreground: "#FAF8F6",
    muted: "#EDF2EE",
    accent: "#72FD9C",
    accentContrast: "#0D3D20",
    border: "rgba(250, 248, 246, 0.22)",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0D3D20",
    surface: "dark",
    darkSurface: {},
  },
  /** Resibag Active — o tom que o manual reserva pra "botões de ação,
   * links, ícones ativos" — como acento principal, mais vívido que o
   * institucional. */
  "resibag-ativo": {
    id: "resibag-ativo",
    label: "Resibag Ativo",
    background: "#FAF8F6",
    foreground: "#1E2A22",
    muted: "#5A6B60",
    accent: "#3AAF65",
    accentContrast: "#FAF8F6",
    border: "#EDF2EE",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0D3D20",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0D3D20",
      foreground: "#FAF8F6",
      muted: "#EDF2EE",
      accent: "#72FD9C",
      accentContrast: "#0D3D20",
      border: "rgba(250, 248, 246, 0.22)",
      surface: "dark",
    },
  },
  /** Certification Gold — reservado pelo manual pra selos INMETRO/ANTT/ANP —
   * bom pra conteúdo de compliance e certificação. */
  "resibag-selo": {
    id: "resibag-selo",
    label: "Resibag Selo",
    background: "#FAF8F6",
    foreground: "#1E2A22",
    muted: "#5A6B60",
    accent: "#B8973A",
    accentContrast: "#1E2A22",
    border: "#EDF2EE",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0D3D20",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0D3D20",
      foreground: "#FAF8F6",
      muted: "#EDF2EE",
      accent: "#B8973A",
      accentContrast: "#1E2A22",
      border: "rgba(250, 248, 246, 0.22)",
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
  const needsDark =
    hasImage || (slideType === "cover" && theme.coverUsesDarkSurface === true);

  if (!needsDark) return theme;
  return { ...theme, ...theme.darkSurface };
}

export const slideThemeOptions = Object.values(slideThemes).map(
  ({ id, label }) => ({ id, label }),
);
