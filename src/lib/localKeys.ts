/**
 * Chaves do localStorage, com herança da chave antiga.
 *
 * POR QUE EXISTE: o repo se chamava `carousel-builder` e virou `trackforge-os`.
 * O prefixo das chaves acompanhou o nome — mas trocar o prefixo direto apagaria
 * rascunho, peça produzida e log de custo de quem já usa, porque o navegador
 * simplesmente não acharia nada na chave nova. Seria a mesma perda do bug em que
 * as peças sumiram, com a diferença de ter sido causada por uma renomeação
 * cosmética.
 *
 * COMO FUNCIONA:
 *   - leitura → tenta a chave nova; se estiver vazia, lê a antiga e PROMOVE o
 *     valor para a nova ali mesmo. A migração acontece sozinha no primeiro uso,
 *     sem botão e sem tela de "migrando".
 *   - escrita → só na chave nova.
 *   - a chave antiga NÃO é apagada. Fica como retrato congelado: se for preciso
 *     voltar para um build anterior, o dado de antes ainda está lá.
 *
 * POR QUE NÃO ESCREVER NAS DUAS: os rascunhos carregam imagem em data URL e são
 * o que pressiona a cota de ~5MB. Duplicar todo gravação para manter as duas
 * chaves em dia troca um risco (perder dado no rename) por outro pior (estourar
 * a cota e não conseguir salvar nada). Ler das duas e gravar numa só resolve a
 * migração sem dobrar o espaço.
 *
 * QUANDO ISTO SAI: quando ninguém mais abrir a ferramenta num navegador que só
 * tem a chave antiga. Não há pressa — o custo de manter é uma leitura a mais, e
 * só quando a chave nova está vazia.
 */

const ATUAL = "trackforge";
const LEGADO = "carousel-builder";

/** `producoes:v1` → `trackforge:producoes:v1`. */
export const keyFor = (suffix: string) => `${ATUAL}:${suffix}`;

/** A chave que a versão anterior usava, para herança e para depuração. */
export const legacyKeyFor = (suffix: string) => `${LEGADO}:${suffix}`;

/**
 * Valor da chave, herdando da antiga quando a nova ainda não existe.
 *
 * Devolve `null` fora do navegador e quando nenhuma das duas tem valor. Toda a
 * leitura é protegida: em janela anônima ou com dado de site bloqueado, o
 * próprio `getItem` lança — e isso não pode derrubar a tela.
 */
export function readLocal(suffix: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const atual = window.localStorage.getItem(keyFor(suffix));
    // A chave nova ganha quando as duas existem: ela é a que as gravações
    // alimentam, logo é a recente. A antiga pode ter ficado para trás se alguém
    // abriu um build anterior no meio do caminho.
    if (atual !== null) return atual;

    const legado = window.localStorage.getItem(legacyKeyFor(suffix));
    if (legado === null) return null;

    // Promove na primeira leitura. Se a gravação falhar (cota), o valor ainda
    // volta para quem pediu — herdar e não conseguir promover é bem melhor que
    // devolver vazio.
    try {
      window.localStorage.setItem(keyFor(suffix), legado);
    } catch {
      // Segue com o valor herdado; a promoção tenta de novo na próxima leitura.
    }
    return legado;
  } catch {
    return null;
  }
}

/**
 * Grava só na chave nova.
 *
 * Não lança: falhar ao persistir não pode derrubar a geração que o usuário
 * acabou de pagar. Devolve `false` quando não deu, para quem quiser saber.
 */
export function writeLocal(suffix: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(keyFor(suffix), value);
    return true;
  } catch {
    return false;
  }
}

/** Remove a chave nova. A antiga fica — ver o cabeçalho. */
export function removeLocal(suffix: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(suffix));
  } catch {
    // sem localStorage não há o que remover
  }
}
