import { z } from "zod";

import { crmPublishConfigured, listPendingPieces, publishForApproval } from "@/lib/crm";
import { articleSchema } from "@/types/article";
import { outputKindSchema } from "@/types/outputs";

/**
 * `data` é `unknown` de propósito: o formato de cada peça já foi validado pelo
 * schema dele na rota que a gerou, e repetir a validação aqui obrigaria esta
 * rota a conhecer os seis — que é exatamente o acoplamento que fez o envio
 * quebrar quando a esteira passou a produzir Stories e Reels, e não só slides.
 */
const requestSchema = z.object({
  article: articleSchema,
  pieces: z
    .array(
      z.object({
        kind: outputKindSchema,
        data: z.unknown(),
        flagged: z.number().int().min(0).default(0),
      }),
    )
    .min(1, "não há peça para enviar"),
  images: z
    .array(
      z.object({
        slot: z.string().min(1),
        url: z.string().min(1),
        alt: z.string().default(""),
        credit: z.string().nullable().default(null),
        creditUrl: z.string().nullable().default(null),
        fileName: z.string().nullable().default(null),
      }),
    )
    .max(4)
    .optional(),
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
  // Lido fora do `try` de baixo, este `await` estourava sem resposta e o Next
  // devolvia um 500 de corpo VAZIO — que na tela virava um erro de parser de
  // JSON em vez da falha real.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "o corpo do pedido não é JSON válido" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
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
