"use client";

import { useReducer } from "react";

import { brands, type BrandId } from "@/constants/brands";
import type { SlideThemeId } from "@/constants/themes";

export type Settings = {
  themeId: SlideThemeId;
  brandId: BrandId | null;
  customLogo: string | null;
};

type State = Settings & {
  /** Falso até a sessão salva ser lida. O autosave espera por isto. */
  restored: boolean;
};

type Action =
  | { type: "theme"; themeId: SlideThemeId }
  | { type: "brand"; brandId: BrandId | null }
  | { type: "logo"; customLogo: string | null }
  | { type: "restore"; settings: Partial<Settings> };

const INITIAL: State = {
  themeId: "dark-modern",
  brandId: null,
  customLogo: null,
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

    // Restaurar num dispatch só, e não em quatro setState encadeados: além do
    // render em cascata, o autosave podia rodar no meio e gravar por cima da
    // sessão que estava sendo lida.
    case "restore":
      return {
        themeId: action.settings.themeId ?? state.themeId,
        brandId: action.settings.brandId ?? state.brandId,
        customLogo: action.settings.customLogo ?? state.customLogo,
        restored: true,
      };
  }
}

/**
 * Configuração global do carrossel: tema, marca e logo.
 *
 * Fica fora do histórico de desfazer de propósito — Ctrl+Z existe para
 * recuperar texto de slide apagado, não para reverter troca de tema.
 */
export function useSettings() {
  return useReducer(reducer, INITIAL);
}
