import { access, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const LIBRARY_DIR = path.join(process.cwd(), "public", "assets", "resibag");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

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
async function uniqueName(name: string) {
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length);

  let candidate = name;
  let suffix = 1;
  while (await exists(path.join(LIBRARY_DIR, candidate))) {
    candidate = `${base}-${suffix}${ext}`;
    suffix += 1;
  }
  return candidate;
}

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

export async function POST(request: Request) {
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

  const name = await uniqueName(file.name);
  await writeFile(path.join(LIBRARY_DIR, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({
    name,
    path: `/assets/resibag/${encodeURIComponent(name)}`,
  });
}

export async function DELETE(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  const safeName = name ? sanitizeName(name) : null;
  if (!safeName) {
    return Response.json({ error: "nome de arquivo inválido" }, { status: 400 });
  }

  const filePath = path.join(LIBRARY_DIR, safeName);
  // Defesa extra além do sanitizeName: o caminho final precisa continuar dentro da pasta.
  if (path.resolve(filePath) !== path.join(LIBRARY_DIR, safeName)) {
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
