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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
