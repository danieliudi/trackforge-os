/**
 * Freio simples por IP contra laço em rota que gasta dinheiro, cota ou
 * service role do CRM.
 *
 * DÉBITO CONSCIENTE: em serverless o mapa vive por instância — não é quota
 * global. Duas instâncias frias = dois baldes. Corta o `curl` em laço na
 * mesma conexão (o abuso mais barato de montar); não substitui Redis/KV se
 * a ferramenta for exposta a abuso distribuído. Sem isto, Basic Auth
 * compartilhada + chave Anthropic = conta aberta.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Limpa entradas velhas de vez em quando para o Map não crescer sem teto. */
function gc(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  gc(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Resposta 429 pronta, ou `null` se a requisição pode seguir. */
export function enforceRateLimit(
  request: Request,
  bucket: string,
  opts: { limit: number; windowMs: number } = { limit: 30, windowMs: 60_000 },
): Response | null {
  const result = rateLimit(`${bucket}:${clientKey(request)}`, opts);
  if (result.ok) return null;
  return Response.json(
    { error: "muitas requisições — espere um momento e tente de novo" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
