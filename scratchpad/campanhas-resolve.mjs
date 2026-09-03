/** Resolve `@/x` para `src/x.ts` — o que o bundler do Next já faz pelo tsconfig. */
import { pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const src = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "src");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(pathToFileURL(resolvePath(src, `${specifier.slice(2)}.ts`)).href, context);
  }
  return next(specifier, context);
}
