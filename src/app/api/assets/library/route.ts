import { access, mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Uma pasta por frente.
 *
 * A biblioteca era só `assets/resibag`, de quando a ferramenta atendia uma
 * marca. Com duas frentes a pasta única deixa a foto de uma aparecer na peça da
 * outra — o erro caro, porque sai publicado com a marca errada e ninguém
 * percebe até estar no ar. O padrão continua sendo resibag para não quebrar
 * quem já chama sem a frente.
 */
const BRANDS = new Set(["sanwey", "resibag"]);
const DEFAULT_BRAND = "resibag";

function brandFrom(request: Request): string {
  const asked = new URL(request.url).searchParams.get("brandId");
  return asked && BRANDS.has(asked) ? asked : DEFAULT_BRAND;
}

const dirOf = (brand: string) => path.join(process.cwd(), "public", "assets", brand);

/** Só nome de arquivo simples, com extensão de imagem — barra travessão de diretório. */
function sanitizeName(name: string): string | null {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  if (!IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase())) return null;
  return name;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** "foto.jpg" já existe? tenta "foto-1.jpg", "foto-2.jpg"... em vez de sobrescrever. */
async function uniqueName(dir: string, name: string) {
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length);

  let candidate = name;
  let suffix = 1;
  while (await exists(path.join(dir, candidate))) {
    candidate = `${base}-${suffix}${ext}`;
    suffix += 1;
  }
  return candidate;
}

export async function GET(request: Request) {
  const brand = brandFrom(request);

  // Frente sem pasta é biblioteca vazia, não erro: a pasta nasce no primeiro
  // upload, e derrubar o painel por isso seria transformar "ainda não subi
  // nada" em falha.
  let files: string[];
  try {
    files = await readdir(dirOf(brand));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return Response.json({ images: [] });
    throw error;
  }

  const images = files
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      // Caminho relativo ao /public; o cliente monta a URL absoluta com o
      // próprio origin, porque o schema do slide só aceita http(s) ou data:.
      path: `/assets/${brand}/${encodeURIComponent(name)}`,
    }));

  return Response.json({ images });
}

export async function POST(request: Request) {
  const brand = brandFrom(request);
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "envie um arquivo" }, { status: 400 });
  }
  if (!sanitizeName(file.name)) {
    return Response.json(
      { error: "só .jpg, .jpeg ou .png são aceitos" },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "arquivo maior que 25MB" }, { status: 400 });
  }

  const dir = dirOf(brand);
  await mkdir(dir, { recursive: true });
  const name = await uniqueName(dir, file.name);
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({
    name,
    path: `/assets/${brand}/${encodeURIComponent(name)}`,
  });
}

export async function DELETE(request: Request) {
  const dir = dirOf(brandFrom(request));
  const { name } = (await request.json()) as { name?: string };
  const safeName = name ? sanitizeName(name) : null;
  if (!safeName) {
    return Response.json({ error: "nome de arquivo inválido" }, { status: 400 });
  }

  const filePath = path.join(dir, safeName);
  // Defesa extra além do sanitizeName: o caminho final precisa continuar dentro da pasta.
  if (path.resolve(filePath) !== path.join(dir, safeName)) {
    return Response.json({ error: "nome de arquivo inválido" }, { status: 400 });
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ error: "arquivo não encontrado" }, { status: 404 });
    }
    throw error;
  }

  return Response.json({ ok: true });
}
