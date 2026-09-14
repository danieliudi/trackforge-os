import type { SourceTier } from "@/knowledge/provenance";
import type { TextKind } from "@/types/outputs";

/**
 * Régua de plataforma — quanto texto cabe, e de onde esse número veio.
 *
 * POR QUE ESTE ARQUIVO EXISTE. Ao desenhar o contador (Fase 5) descobriu-se que
 * número de plataforma era a única categoria de número desta ferramenta sem
 * procedência: `HOOK_TARGET` carregava 220/150/160/180 sem fonte, sem data, sem
 * `checkedAt`, e `prompts.ts` os interpolava direto na instrução do modelo —
 * enquanto `MODEL_PRICING` cita URL e data e cada fato normativo carrega tier e
 * `checkedAt`. Aqui o número de fora passa a ter a mesma disciplina do resto.
 *
 * A DISTINÇÃO QUE ORGANIZA O ARQUIVO: contar o nosso próprio texto (`contar`)
 * não precisa de fonte e não pode estar errado. Comparar com um limite é fato
 * de fora, e fato tem tier. Sem lastro, o contador mostra o número sozinho —
 * nunca um limite cinza que parece apurado.
 */

/** O que a régua diz, e a procedência disso. Mesma forma de `FactRecord`. */
export type LimitePlataforma = {
  kind: TextKind;
  /** Teto de caracteres do campo na plataforma. */
  limite: number;
  tier: SourceTier;
  /** Quem afirma: a documentação da plataforma, ou quem mediu. */
  source: string;
  url?: string;
  checkedAt?: string;
  checkedBy?: string;
  /**
   * OBRIGATÓRIO aqui, e opcional em `FactRecord`. Certificado INMETRO vence numa
   * data que está escrita nele; limite de plataforma apodrece sem avisar
   * ninguém — as duas mudam o corte sem anúncio. Sem prazo, um número de 2026
   * continuaria sendo desenhado na tela em 2029 com cara de conferido.
   */
  revalidateBy: string;
  notes?: string;
};

/**
 * Onde cai o "ver mais" — e por que são DOIS números e não um.
 *
 * Não existe "o ponto do corte". São dois orçamentos ao mesmo tempo (caracteres
 * E ~3 linhas, vale o que acabar primeiro), quebra de linha conta, e o resultado
 * varia por aparelho, largura de janela e versão do app. Nenhuma das duas
 * plataformas documenta isso, e as duas mudam sem avisar.
 *
 * Por isso a UI desenha FAIXA, nunca tique: `celular` numa borda, `desktop` na
 * outra. Um tique único seria número inventado com cara de medido — a classe de
 * erro que esta ferramenta inteira existe para impedir.
 */
export type CortePlataforma = {
  kind: TextKind;
  celular: number;
  desktop: number;
  tier: SourceTier;
  source: string;
  checkedAt?: string;
  checkedBy?: string;
  revalidateBy: string;
  notes?: string;
};

/**
 * SÓ DOIS FORMATOS TÊM RÉGUA, e isso foi conferido, não suposto.
 *
 * `toPlainText` monta o Reels com "GANCHO:" e "[4s]" dentro, e o Stories com
 * "TELA 1:" — texto de roteiro, para uma pessoa ler e gravar, que nunca vai para
 * campo nenhum. Contar isso contra um limite de legenda mediria a coisa errada e
 * o número pareceria certo. Carrossel é slide, não caractere de post.
 */
export const KINDS_COM_REGUA: readonly TextKind[] = ["post-texto", "legenda"];

/**
 * A tabela. Hoje as duas linhas estão `nao-verificado` — e isso aparece na tela
 * como "sem lastro", de propósito, em vez de virar número.
 *
 * COMO CONFERIR: abra a documentação da plataforma, cole o número e o link em
 * `source`/`url`, ponha a data em `checkedAt` e `tier: "primaria"`. A régua
 * acende sozinha. Esta sessão não pôde fazer isso: a política de saída do
 * contêiner nega `www.linkedin.com`, `developers.facebook.com` e
 * `help.instagram.com` com 403 no CONNECT (conferido em 13/09/2026), e busca
 * devolve resumo de página não aberta, que é `secundaria` na melhor hipótese.
 */
export const LIMITES: LimitePlataforma[] = [
  {
    kind: "post-texto",
    limite: 3000,
    tier: "nao-verificado",
    source: "resumo de busca — página do LinkedIn não aberta",
    checkedAt: "2026-09-13",
    checkedBy: "sessão Claude Code — NÃO conferido na fonte",
    revalidateBy: "2027-03-13",
    notes:
      "Número que aparece em material de terceiros, não na documentação do LinkedIn. Conferir em: a própria página de ajuda do LinkedIn sobre limite de caracteres do post.",
  },
  {
    kind: "legenda",
    limite: 2200,
    tier: "nao-verificado",
    source: "resumo de busca — página do Instagram não aberta",
    checkedAt: "2026-09-13",
    checkedBy: "sessão Claude Code — NÃO conferido na fonte",
    revalidateBy: "2027-03-13",
    notes:
      "Mesmo caso do LinkedIn. Conferir em: help.instagram.com ou developers.facebook.com, sobre limite da legenda.",
  },
];

/**
 * Onde o corte cai. VAZIO até alguém medir — e medir é a única forma.
 *
 * Aqui `interna` (o Daniel abrindo um post longo dele e vendo onde apareceu o
 * "ver mais", no celular e no computador) vale MAIS que qualquer artigo: é a
 * plataforma respondendo sobre a conta dele, na versão de app que ele usa, e não
 * um blog de outro ano sobre a conta de outra pessoa.
 */
export const CORTES: CortePlataforma[] = [];

/**
 * O que basta para desenhar a régua na tela — e é uma régua diferente de
 * `isPublishable`, de propósito.
 *
 * Fato normativo exige `primaria` porque vira afirmação pública numa peça, e
 * errar ali é a marca dizendo algo falso. Limite de plataforma não vai para peça
 * nenhuma: é instrumento de medida para o Daniel, na tela dele. Para o CORTE,
 * `interna` é literalmente a melhor evidência que existe — ninguém documenta
 * onde ele cai. Já `secundaria` (um blog) não sustenta uma linha desenhada na
 * tela, e `nao-verificado` muito menos.
 */
export function temLastro(
  r: { tier: SourceTier; revalidateBy: string },
  hoje = new Date(),
): boolean {
  if (r.tier !== "primaria" && r.tier !== "interna") return false;
  return new Date(r.revalidateBy) >= hoje;
}

export function limiteDe(kind: TextKind): LimitePlataforma | null {
  return LIMITES.find((l) => l.kind === kind) ?? null;
}

export function corteDe(kind: TextKind): CortePlataforma | null {
  return CORTES.find((c) => c.kind === kind) ?? null;
}

/**
 * Quantos caracteres a plataforma vai contar.
 *
 * `.length` EM JS É UNIDADE UTF-16, QUE É EXATAMENTE O QUE AS PLATAFORMAS
 * CONTAM. Um emoji custa de 2 a 8. NÃO "conserte" isto para `[...texto].length`
 * nem para `Intl.Segmenter`: os dois contam caracteres visíveis, e aí o número
 * ficaria menor que o da plataforma justamente nas peças com emoji — errado, e
 * errado em silêncio, que é como este repositório já se machucou antes.
 */
export const contar = (texto: string): number => texto.length;

/**
 * Tamanho de gancho por formato — alvo do prompt, não portão do schema.
 *
 * VEIO DE `src/types/outputs.ts` NA FASE 5, com a procedência que faltava: estes
 * quatro números foram escritos em 03/09/2026 (`5b72b2a`) sem fonte e sem data,
 * e vão direto para a instrução do modelo em `prompts.ts`. São ALVO EDITORIAL, e
 * não limite de plataforma — 220 não é o teto do LinkedIn. Mas o 150 da legenda
 * é claramente um palpite sobre o "ver mais", e ninguém sabe dizer de onde veio.
 *
 * Continuam indo para o prompt: tirá-los pioraria a peça sem melhorar nada. O
 * que mudou é que pararam de parecer apurados. Quando o corte for medido
 * (`CORTES`), estes números se conferem contra ele.
 */
export const HOOK_TARGET = {
  "post-texto": 220,
  legenda: 150,
  reels: 160,
  stories: 180,
} as const satisfies Record<TextKind, number>;
