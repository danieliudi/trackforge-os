"use client";

import { brands, type BrandId } from "@/constants/brands";
import { fieldClass, labelClass } from "@/lib/ui";

type ContextPanelProps = {
  brandId: BrandId | null;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Estratégia/posicionamento por marca, usado em toda geração daquela marca.
 *
 * Fica numa aba própria, separado do brief pontual do Composer: o brief muda
 * a cada carrossel, o contexto de marca não — colar de novo a cada geração
 * seria repetir trabalho.
 */
export function ContextPanel({ brandId, value, onChange }: ContextPanelProps) {
  if (!brandId) {
    return (
      <p className="text-xs leading-relaxed text-mut">
        Selecione uma marca na aba <strong>Estilo</strong> para definir o contexto
        estratégico dela.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Contexto — {brands[brandId].label}</span>
      <textarea
        rows={12}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cole aqui a estratégia de conteúdo, posicionamento, documentos internos relevantes..."
        className={`${fieldClass} resize-y`}
      />
      <p className="text-[11px] leading-relaxed text-mut">
        Fica salvo e entra automaticamente em toda geração de carrossel da marca{" "}
        {brands[brandId].label} — não precisa colar de novo a cada carrossel.
      </p>
    </div>
  );
}
