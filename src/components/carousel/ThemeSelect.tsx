"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

import { slideThemes, THEME_GROUPS, type SlideThemeId } from "@/constants/themes";
import { focusRing, labelClass } from "@/lib/ui";

type ThemeSelectProps = {
  value: SlideThemeId;
  onChange: (themeId: SlideThemeId) => void;
};

/**
 * Amostra do tema em miniatura: fundo, cor de texto e acento reais.
 *
 * O controle anterior era um <select> nativo com 11 opções e um quadrado de
 * 36px ao lado — dava para ler o nome do tema, não para comparar. Escolher
 * "Sanwey Navy" contra "Sanwey Benchmark" exigia aplicar e olhar o preview.
 */
function ThemeSwatch({ themeId }: { themeId: SlideThemeId }) {
  const theme = slideThemes[themeId];

  return (
    <span
      aria-hidden
      className="flex h-12 w-full flex-col justify-between overflow-hidden rounded-md p-2"
      style={{ background: theme.background }}
    >
      <span
        className="text-[13px] font-semibold leading-none"
        style={{ color: theme.foreground, fontFamily: theme.displayFont }}
      >
        Aa
      </span>
      <span className="flex items-center gap-1">
        <span
          className="block h-1 w-6 rounded-full"
          style={{ background: theme.accent }}
        />
        <span
          className="block h-1 w-3 rounded-full"
          style={{ background: theme.muted }}
        />
      </span>
    </span>
  );
}

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      {THEME_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <span className={labelClass}>{group.label}</span>
          <div className="grid grid-cols-2 gap-2">
            {group.themes.map((themeId) => {
              const isActive = themeId === value;
              return (
                <button
                  key={themeId}
                  type="button"
                  onClick={() => onChange(themeId)}
                  aria-pressed={isActive}
                  className={clsx(
                    "group flex flex-col gap-1.5 rounded-lg border p-1.5 text-left transition",
                    focusRing,
                    isActive
                      ? "border-acc bg-canvas"
                      : "border-line hover:border-line3",
                  )}
                >
                  <ThemeSwatch themeId={themeId} />
                  <span className="flex items-center gap-1 px-0.5 pb-0.5">
                    {isActive ? (
                      <Check size={11} className="shrink-0 text-ink" />
                    ) : null}
                    <span
                      className={clsx(
                        "truncate text-[11px] leading-tight",
                        isActive ? "font-medium text-ink" : "text-mut",
                      )}
                    >
                      {slideThemes[themeId].label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
