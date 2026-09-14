import {
  contar,
  corteDe,
  KINDS_COM_REGUA,
  limiteDe,
  temLastro,
} from "@/constants/plataformas";
import { isCarousel, type OutputKind } from "@/types/outputs";

/**
 * Quantos caracteres a peça tem, e — quando houver fonte — quanto a plataforma
 * aceita.
 *
 * AS DUAS METADES TÊM PAPÉIS OPOSTOS, e a separação é o desenho inteiro. O
 * NÚMERO conta o nosso próprio texto: não precisa de fonte, não pode estar
 * errado, e por isso nunca some. A RÉGUA é fato de fora, tem tier, e some quando
 * não tem lastro — aparecendo em lugar dela a palavra "sem lastro", não um
 * número cinza que pareceria apurado. É a regra da seção 2 do CLAUDE.md aplicada
 * a outro assunto: `nao-verificado` dá contexto e nunca vira o número que decide.
 *
 * MEDE E MOSTRA, NUNCA BLOQUEIA. Mesma decisão registrada em `outputs.ts`:
 * exigir tamanho na volta transformava um gancho doze caracteres mais longo na
 * perda do lote pago inteiro.
 */

const ROTULO = "text-[11px] uppercase tracking-[0.06em] text-faint font-mono";

export function ContadorPlataforma({
  kind,
  texto,
}: {
  kind: OutputKind;
  /** Exatamente o que o botão "Copiar texto" copia — o retorno de `toPlainText`. */
  texto: string;
}) {
  // Slide não é caractere de post.
  if (isCarousel(kind)) return null;

  const total = contar(texto);

  if (!KINDS_COM_REGUA.includes(kind)) {
    return (
      <div className="flex items-baseline gap-2 border-t border-line2 pt-3">
        <span className={ROTULO}>sem régua</span>
        <span className="text-[11.5px] leading-snug text-mut">
          Roteiro, não legenda: o texto que o botão copia traz marcação de tempo e de
          tela, que não vai para campo nenhum. Contar isso contra um limite de legenda
          mediria a coisa errada.
        </span>
      </div>
    );
  }

  const limite = limiteDe(kind);
  const corte = corteDe(kind);
  const limiteVale = limite !== null && temLastro(limite);
  const corteVale = corte !== null && temLastro(corte);

  const proporcao = limiteVale ? Math.min(total / limite.limite, 1) : 0;

  return (
    <div className="flex flex-col gap-[7px] border-t border-line2 pt-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[15px] font-semibold tracking-tight text-ink">
          {total.toLocaleString("pt-BR")}
        </span>
        {limiteVale ? (
          <span className="font-mono text-[15px] text-mut">
            / {limite.limite.toLocaleString("pt-BR")}
          </span>
        ) : null}
        <span className="text-[11.5px] text-mut">
          {limiteVale ? "caracteres" : "caracteres — o que o botão copia"}
        </span>
        {limiteVale ? null : (
          // Tracejado de propósito: o que falta é a FONTE, não a correção. Usar
          // `urgent` diria "está errado", e não está — ninguém conferiu, que é
          // diferente.
          <span className="ml-auto border border-dashed border-warn-line bg-warn-bg px-[7px] py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-warn">
            sem lastro
          </span>
        )}
      </div>

      {limiteVale ? (
        <div
          aria-hidden
          className="relative h-[9px] border border-rule bg-cell"
        >
          <div
            className="absolute inset-y-0 left-0 bg-ink"
            style={{ width: `${proporcao * 100}%` }}
          />
          {corteVale ? (
            // FAIXA, NUNCA TIQUE. Ver `CortePlataforma`: são dois orçamentos ao
            // mesmo tempo e o ponto varia por aparelho. A faixa vai do celular ao
            // computador — as duas medições, que é por isso que são duas.
            <div
              className="absolute -inset-y-px border-x border-acc bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--color-acc-soft)_3px_6px)]"
              style={{
                left: `${(corte.celular / limite.limite) * 100}%`,
                width: `${((corte.desktop - corte.celular) / limite.limite) * 100}%`,
              }}
            />
          ) : null}
        </div>
      ) : null}

      {corteVale ? (
        <p className="text-[11px] leading-snug text-acc-tx">
          <b className="font-semibold">O “ver mais” cai na faixa.</b>{" "}
          {corte.celular} no celular, {corte.desktop} no computador — {corte.source}.
          Vale também o teto de linhas, o que vier antes.
        </p>
      ) : null}

      <div className="flex items-baseline gap-1.5">
        <span className={ROTULO}>régua</span>
        <span className="text-[11px] leading-snug text-mut">
          {limiteVale ? (
            <>
              limite do campo · <b className="font-semibold text-ink2">{limite.source}</b>
              {limite.checkedAt ? `, conferido em ${formatarData(limite.checkedAt)}` : null}
            </>
          ) : (
            "nenhum limite com fonte conferida para este formato."
          )}
        </span>
      </div>
    </div>
  );
}

/** ISO → dd/mm/aaaa, sem `Date` para não deslocar por fuso. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
