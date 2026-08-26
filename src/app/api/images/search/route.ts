const UNSPLASH_API = "https://api.unsplash.com";

type UnsplashPhoto = {
  id: string;
  alt_description: string | null;
  urls: { regular: string; thumb: string };
  user: { name: string; links: { html: string } };
  links: { download_location: string };
};

export async function GET(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return Response.json({ error: "busca de imagens não configurada" }, { status: 500 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return Response.json({ error: "informe um termo de busca" }, { status: 400 });
  }

  const response = await fetch(
    `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=12`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );

  if (!response.ok) {
    return Response.json({ error: "falha ao buscar imagens" }, { status: 502 });
  }

  const data = (await response.json()) as { results: UnsplashPhoto[] };
  const results = data.results.map((photo) => ({
    id: photo.id,
    thumbUrl: photo.urls.thumb,
    fullUrl: photo.urls.regular,
    alt: photo.alt_description ?? "",
    credit: photo.user.name,
    creditUrl: photo.user.links.html,
    downloadLocation: photo.links.download_location,
  }));

  return Response.json({ results });
}
