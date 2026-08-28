"use client";

import clsx from "clsx";
import { Upload, X } from "lucide-react";

import { BrandPills } from "@/components/app/BrandPills";
import { FormatSelect } from "@/components/app/FormatSelect";
import { PlatformPills } from "@/components/app/PlatformPills";
import { ThemeSelect } from "@/components/carousel/ThemeSelect";
import { IconButton } from "@/components/ui/Button";
import type { BrandId } from "@/constants/brands";
import { getPlatformToneNote, type Format, type Platform } from "@/constants/format";
import type { SlideThemeId } from "@/constants/themes";
import { focusRing, labelClass } from "@/lib/ui";

type StylePanelProps = {
  themeId: SlideThemeId;
  onThemeChange: (id: SlideThemeId) => void;
  brandId: BrandId | null;
  onBrandChange: (id: BrandId | null) => void;
  customLogo: string | null;
  onCustomLogoChange: (dataUrl: string | null) => void;
  format: Format;
  onFormatChange: (format: Format) => void;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
};

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Configuração global do carrossel, isolada da edição de texto.
 *
 * Antes tema, marca, logo e os cards de todos os slides dividiam um scroll só:
 * com 12 slides os controles globais saíam da viewport e voltar exigia rolar a
 * coluna inteira. Agora cada responsabilidade tem sua aba.
 */
export function StylePanel({
  themeId,
  onThemeChange,
  brandId,
  onBrandChange,
  customLogo,
  onCustomLogoChange,
  format,
  onFormatChange,
  platform,
  onPlatformChange,
}: StylePanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Formato</span>
        <FormatSelect value={format} onChange={onFormatChange} />
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Plataforma</span>
        <PlatformPills
          value={platform}
          onChange={onPlatformChange}
          disabled={format === "apresentacao"}
        />
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {getPlatformToneNote(platform)}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6">
        <span className={labelClass}>Marca</span>
        <BrandPills value={brandId} onChange={onBrandChange} />
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Selecionar uma marca aplica o tema e a política de logo do manual dela.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Logo customizado</span>
        <div className="flex items-center gap-2">
          <label
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-900",
              focusRing,
            )}
          >
            <Upload size={13} />
            {customLogo ? "Trocar arquivo" : "Enviar PNG ou SVG"}
            <input
              type="file"
              accept="image/png,image/svg+xml"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) onCustomLogoChange(await readAsDataUrl(file));
              }}
            />
          </label>
          {customLogo ? (
            <IconButton
              icon={X}
              label="Remover logo customizado"
              variant="secondary"
              onClick={() => onCustomLogoChange(null)}
              className="hover:border-red-500 hover:text-red-600"
            />
          ) : null}
        </div>
        {customLogo ? (
          <p className="text-[11px] text-zinc-500">
            O logo customizado tem prioridade sobre o da marca em todos os slides.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6">
        <span className={labelClass}>Tema visual</span>
        <ThemeSelect value={themeId} onChange={onThemeChange} />
      </div>
    </div>
  );
}
