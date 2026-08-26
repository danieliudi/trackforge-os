/**
 * As diretrizes da API do Unsplash exigem chamar `download_location` sempre
 * que uma foto é efetivamente usada (não só exibida na busca).
 */
export async function POST(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  const { downloadLocation } = (await request.json()) as { downloadLocation?: string };

  if (!key || !downloadLocation?.startsWith("https://api.unsplash.com/")) {
    return Response.json({ error: "requisição inválida" }, { status: 400 });
  }

  await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` } });
  return Response.json({ ok: true });
}
