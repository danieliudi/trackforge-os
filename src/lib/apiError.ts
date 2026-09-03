/**
 * Transforma uma resposta que falhou numa frase que dá para ler.
 *
 * POR QUE EXISTE: a tela mostrou `[object Object]` ao enviar uma peça para
 * aprovação. O código fazia `new Error(data.error)`, e quando `data.error`
 * chegava como objeto — `{message, code}`, a forma que um gateway devolve — o
 * `Error` guardava a conversão do objeto em texto. O usuário recebia a mensagem
 * mais inútil possível justamente no momento em que precisava saber o que deu
 * errado, e quem fosse investigar não tinha por onde começar.
 *
 * Reproduzido no navegador antes da correção, com cinco formas de resposta:
 *
 *   {"error":"o CRM recusou (HTTP 400)"}      → "o CRM recusou (HTTP 400)"   ok
 *   {"error":{"message":"...","code":42}}     → "[object Object]"            ← o bug
 *   {"code":401,"message":"..."}              → "não foi possível enviar"    perdia a mensagem
 *   corpo vazio                               → "Failed to execute 'json'…"  erro de parser na cara do usuário
 *   corpo HTML                                → "Unexpected token '<'…"      idem
 *
 * O QUE ISTO GARANTE: sai sempre uma string; ela carrega o código HTTP quando o
 * corpo não trouxe mensagem aproveitável; e o corpo cru vai para o console.
 * "Falhou" sem número não deixa nem perguntar direito — com o número dá para
 * separar recusa (400) de credencial (401) e do CRM do outro lado (502).
 */

/** Frase longa demais vira parede de texto num banner de três linhas. */
const MAX = 300;

/**
 * Procura uma mensagem legível em qualquer forma de corpo de erro.
 *
 * A lista de chaves não é adivinhação: `error` é o que as rotas desta
 * ferramenta devolvem, `message`/`code` é o que o Supabase devolve quando a
 * requisição nem chega à função, e `issues` é a forma do Zod.
 */
function findMessage(value: unknown, depth = 0): string | null {
  if (typeof value === "string") return value.trim() || null;
  // Profundidade limitada: corpo de erro aninhado sem fim é payload hostil, não
  // mensagem — e a busca não pode virar o próprio travamento.
  if (depth > 3 || typeof value !== "object" || value === null) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMessage(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["error", "message", "detail", "hint", "errors", "issues"]) {
    const found = findMessage(record[key], depth + 1);
    if (found) return found;
  }
  return null;
}

/**
 * Lê o corpo da resposta que falhou e devolve o texto a mostrar.
 *
 * Lê como texto, não como JSON, de propósito: `response.json()` estoura em
 * corpo vazio ou em página de erro HTML, e esse estouro chegava à tela no lugar
 * da falha de verdade.
 */
export async function readError(response: Response, fallback: string): Promise<string> {
  const raw = await response.text().catch(() => "");

  let message: string | null = null;
  try {
    message = findMessage(JSON.parse(raw));
  } catch {
    // Corpo que não é JSON não vira mensagem: despejar HTML na tela é tão
    // inútil quanto `[object Object]`.
  }

  // O corpo cru vai para o console, não para a tela: é o que permite
  // diagnosticar a próxima falha sem depender de print de quem usou.
  if (!message) console.error(`falha em ${response.url} (HTTP ${response.status})`, raw.slice(0, 2000));

  const text = message ?? `${fallback} (HTTP ${response.status})`;
  return text.length > MAX ? `${text.slice(0, MAX)}…` : text;
}
