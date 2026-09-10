/**
 * Resolve import sem extensao para `.ts` e injeta o atributo de tipo em JSON —
 * as duas coisas que o bundler do Next faz e o Node cru nao faz.
 *
 * Gemeo de `scratchpad/ts-resolve.mjs`, que serve os roteiros de rascunho. Este
 * mora em `scripts/` porque e dependencia de um comando do `package.json`, e
 * `scratchpad/` e pasta que ninguem trata como suite (secao 12 do CLAUDE.md).
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      /* cai no padrao */
    }
  }
  const resolvido = await next(specifier, context);
  if (resolvido.url.endsWith(".json")) {
    return { ...resolvido, importAttributes: { type: "json" }, shortCircuit: true };
  }
  return resolvido;
}
