/** Resolve import sem extensão para `.ts` — o que o bundler do Next já faz. */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await next(`${specifier}.ts`, context);
    } catch {
      /* cai no padrão */
    }
  }
  return next(specifier, context);
}
