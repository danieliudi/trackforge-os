import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Outfit,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

// Sanwey MIV v2.0: Inter (corpo) + Barlow Condensed 900 (H1) + JetBrains Mono (KPI).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Resibag v9.0: Outfit (display) + Inter (corpo).
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carousel Builder",
  description: "Gerador de carrosséis B2B",
};

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  instrumentSerif.variable,
  inter.variable,
  barlowCondensed.variable,
  jetbrainsMono.variable,
  outfit.variable,
].join(" ");

/**
 * Escreve o tema no <html> ANTES da primeira pintura.
 *
 * Sem isto a página nasce clara — o servidor não conhece o localStorage — e
 * pisca para escura quando o React hidrata. O piscar é pior que não ter modo
 * escuro: acontece em toda navegação, e é a primeira coisa que se vê.
 *
 * "sistema" não escreve atributo nenhum, de propósito: a ausência dele deixa a
 * mídia `prefers-color-scheme` mandar, sem uma terceira regra no CSS.
 *
 * LÊ AS DUAS CHAVES porque o prefixo mudou de `carousel-builder` para
 * `trackforge` (ver `src/lib/localKeys.ts`). Este script não importa nada — roda
 * antes de qualquer bundle — então a herança precisa estar escrita aqui à mão.
 * Sem ela, quem já tinha escolhido escuro veria a tela piscar em toda navegação
 * até que algo mais gravasse a chave nova. Ele só LÊ: promover o valor é
 * trabalho do `theme.ts`, e este script bloqueia a primeira pintura.
 */
const TEMA_ANTES_DA_PINTURA = `try{var t=localStorage.getItem("trackforge:tema:v1")||localStorage.getItem("carousel-builder:tema:v1");if(t==="claro"||t==="escuro")document.documentElement.setAttribute("data-tema",t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_ANTES_DA_PINTURA }} />
      </head>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
