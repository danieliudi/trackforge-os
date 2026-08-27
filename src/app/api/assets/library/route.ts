import { readdir } from "node:fs/promises";
import path from "node:path";

const LIBRARY_DIR = path.join(process.cwd(), "public", "assets", "resibag");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

export async function GET() {
  const files = await readdir(LIBRARY_DIR);

  const images = files
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      // Caminho relativo ao /public; o cliente monta a URL absoluta com o
      // próprio origin, porque o schema do slide só aceita http(s) ou data:.
      path: `/assets/resibag/${encodeURIComponent(name)}`,
    }));

  return Response.json({ images });
}
