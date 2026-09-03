"use client";

import { useReducer } from "react";

import { brands, type BrandId } from "@/constants/brands";
import {
  DEFAULT_COMPOSITION,
  isCompositionId,
  type CompositionId,
} from "@/constants/compositions";
import type { Format, Platform } from "@/constants/format";
import type { SlideThemeId } from "@/constants/themes";

export type Settings = {
  themeId: SlideThemeId;
  brandId: BrandId | null;
  customLogo: string | null;
  format: Format;
  platform: Platform;
  compositionId: CompositionId;
};

type State = Settings & {
  /** Falso até a sessão salva ser lida. O autosave espera por isto. */
  restored: boolean;
};

type Action =
  | { type: "theme"; themeId: SlideThemeId }
  | { type: "brand"; brandId: BrandId | null }
  | { type: "logo"; customLogo: string | null }
  | { type: "format"; format: Format }
  | { type: "platform"; platform: Platform }
  | { type: "composition"; compositionId: CompositionId }
  | { type: "restore"; settings: Partial<Settings> };

const INITIAL: State = {
  themeId: "dark-modern",
  brandId: null,
  customLogo: null,
  format: "carrossel",
  platform: "linkedin",
  compositionId: DEFAULT_COMPOSITION,
  restored: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "theme":
      return { ...state, themeId: action.themeId };

    // Escolher a marca aplica o tema do manual dela. Era um par imperativo
    // solto na página; aqui a regra não tem como ser esquecida.
    case "brand":
      return {
        ...state,
        brandId: action.brandId,
        themeId: action.brandId ? brands[action.brandId].themeId : state.themeId,
      };

    case "logo":
      return { ...state, customLogo: action.customLogo };

    case "format":
      return { ...state, format: action.format };

    case "platform":
      return { ...state, platform: action.platform };

    case "composition":
      return { ...state, compositionId: action.compositionId };

    // Restaurar num dispatch só, e não em quatro setState encadeados: além do
    // render em cascata, o autosave podia rodar no meio e gravar por cima da
    // sessão que estava sendo lida.
    case "restore":
      return {
        themeId: action.settings.themeId ?? state.themeId,
        brandId: action.settings.brandId ?? state.brandId,
        customLogo: action.settings.customLogo ?? state.customLogo,
        format: action.settings.format ?? state.format,
        platform: action.settings.platform ?? state.platform,
        compositionId:
          typeof action.settings.compositionId === "string" &&
          isCompositionId(action.settings.compositionId)
            ? action.settings.compositionId
            : state.compositionId,
        restored: true,
      };
  }
}

/**
 * Configuração global do carrossel: tema, marca, logo, formato e plataforma.
 *
 * Fica fora do histórico de desfazer de propósito — Ctrl+Z existe para
 * recuperar texto de slide apagado, não para reverter troca de tema.
 */
export function useSettings() {
  return useReducer(reducer, INITIAL);
}
