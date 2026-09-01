import { z } from "zod";

import { crmPublishConfigured, listPendingPieces, publishForApproval } from "@/lib/crm";
import { articleSchema } from "@/types/article";
import { carouselSchema } from "@/types/carousel";

const requestSchema = z.object({
  article: articleSchema,
  pieces: z
    .array(
      z.object({
        platform: z.string().min(1),
        carousel: carouselSchema,
        flagged: z.number().int().min(0).default(0),
      }),
    )
    .min(1, "não há peça para enviar"),
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
  sourceLabel: z.string().optional(),
});

/**
 * Estado da fila para o painel. Nunca devolve nada da credencial.
 *
 * `configured: false` é resposta legítima e não erro: quem roda o gerador nem
 * sempre tem acesso ao CRM, e a tela some em vez de mostrar caixa vazia.
 */
export async function GET(request: Request) {
  if (!crmPublishConfigured()) return Response.json({ configured: false, pending: [] });

  const brand = new URL(request.url).searchParams.get("brandId");
  const brandId = brand === "sanwey" || brand === "resibag" ? brand : null;

  try {
    return Response.json({ configured: true, pending: await listPendingPieces(brandId) });
  } catch {
    // Fila fora do ar não pode derrubar o painel — o resto dele não depende dela.
    return Response.json({ configured: true, pending: [], unreachable: true });
  }
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const result = await publishForApproval(parsed.data);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 502 });
  }
}
