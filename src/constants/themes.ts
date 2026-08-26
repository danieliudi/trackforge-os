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
  | "sanwey-navy"
  | "sanwey-clean"
  | "sanwey-benchmark"
  | "resibag-dark"
  | "resibag-clean"
  | "resibag-impact";

/** Agrupamento usado pelo dropdown do painel lateral. */
export const THEME_GROUPS: { label: string; themes: SlideThemeId[] }[] = [
  { label: "Sanwey", themes: ["sanwey", "sanwey-navy", "sanwey-clean", "sanwey-benchmark"] },
  { label: "Resibag", themes: ["resibag", "resibag-dark", "resibag-clean", "resibag-impact"] },
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
   * Sanwey — Manual de Identidade Visual v2.0 (Maio 2026).
   * Paleta oficial: Creme #F9F5F1 / Carvao #2C2C2B / Vermelho #C7212B.
   * O manual proibe azul, laranja e roxo fora da paleta.
   * Regra de social: "capa em Carvao para parar scroll; leitura em Creme".
   */
  sanwey: {
    id: "sanwey",
    label: "Sanwey (institucional)",
    background: "#F9F5F1",
    foreground: "#2C2C2B",
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
      background: "#2C2C2B",
      foreground: "#F9F5F1",
      muted: "#D1D5DB",
      border: "rgba(249, 245, 241, 0.24)",
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

  // --- Variações Sanwey (paleta definida pelo usuário, fora do MIV v2.0) ---
  "sanwey-navy": {
    id: "sanwey-navy",
    label: "Sanwey Navy",
    background: "#070F1E",
    foreground: "#FFFFFF",
    muted: "#94A3B8",
    accent: "#008DDA",
    accentContrast: "#070F1E",
    border: "rgba(148, 163, 184, 0.24)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#070F1E",
    surface: "dark",
    darkSurface: {},
  },
  "sanwey-clean": {
    id: "sanwey-clean",
    label: "Sanwey Clean",
    background: "#F1F5F9",
    foreground: "#0B192C",
    muted: "#475569",
    accent: "#0284C7",
    accentContrast: "#FFFFFF",
    border: "#D8E1EA",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 4,
    overlayColor: "#0B192C",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0B192C",
      foreground: "#F1F5F9",
      muted: "#94A3B8",
      border: "rgba(241, 245, 249, 0.24)",
      surface: "dark",
    },
  },
  "sanwey-benchmark": {
    id: "sanwey-benchmark",
    label: "Sanwey Benchmark",
    background: "#0F172A",
    foreground: "#E2E8F0",
    muted: "#94A3B8",
    accent: "#22D3EE",
    accentContrast: "#0F172A",
    border: "rgba(34, 211, 238, 0.28)",
    displayFont: "var(--font-barlow-condensed)",
    bodyFont: INTER,
    metricFont: "var(--font-jetbrains-mono)",
    displayWeight: 900,
    displayTracking: "-0.02em",
    badgeRadius: 12,
    overlayColor: "#0F172A",
    surface: "dark",
    // Cards escuros sobre o fundo: blocos sutis em vez de gradiente.
    decor: {
      backgroundImage:
        "linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(30, 41, 59, 0) 38%), radial-gradient(720px 480px at 92% 8%, rgba(34, 211, 238, 0.14), transparent 60%)",
    },
    darkSurface: {},
  },

  // --- Variações Resibag (paleta definida pelo usuário, fora do MM v9.0) ---
  "resibag-dark": {
    id: "resibag-dark",
    label: "Resibag Dark",
    background: "#081312",
    foreground: "#FFFFFF",
    muted: "#9CA3AF",
    accent: "#10B981",
    accentContrast: "#081312",
    border: "rgba(255, 255, 255, 0.18)",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#081312",
    surface: "dark",
    darkSurface: {},
  },
  "resibag-clean": {
    id: "resibag-clean",
    label: "Resibag Clean",
    background: "#F8FAF9",
    foreground: "#0F172A",
    muted: "#52646A",
    accent: "#047857",
    accentContrast: "#FFFFFF",
    border: "#DDE7E3",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0F172A",
    surface: "light",
    coverUsesDarkSurface: true,
    darkSurface: {
      background: "#0F172A",
      foreground: "#F8FAF9",
      muted: "#CBD5E1",
      accent: "#10B981",
      accentContrast: "#0F172A",
      border: "rgba(248, 250, 249, 0.22)",
      surface: "dark",
    },
  },
  "resibag-impact": {
    id: "resibag-impact",
    label: "Resibag Impact",
    background: "#0A1917",
    foreground: "#F2FBF7",
    muted: "#A7C4B8",
    accent: "#00E599",
    accentContrast: "#0A1917",
    border: "rgba(0, 229, 153, 0.42)",
    displayFont: "var(--font-outfit)",
    bodyFont: INTER,
    metricFont: "var(--font-outfit)",
    displayWeight: 700,
    displayTracking: "-0.01em",
    badgeRadius: 6,
    overlayColor: "#0A1917",
    surface: "dark",
    decor: {
      backgroundImage:
        "linear-gradient(160deg, rgba(0, 229, 153, 0.14) 0%, rgba(10, 25, 23, 0) 46%), radial-gradient(820px 560px at 6% 96%, rgba(0, 229, 153, 0.12), transparent 62%)",
    },
    darkSurface: {},
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
