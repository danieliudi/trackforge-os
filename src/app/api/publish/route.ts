import { z } from "zod";

import { brandIdSchema, isPersonalFront } from "@/constants/brands";
import { crmPublishConfigured, listPendingPieces, publishForApproval } from "@/lib/crm";
import { articleSchema } from "@/types/article";
import { outputKindSchema } from "@/types/outputs";
import { jsonBody } from "@/lib/apiError";

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
  brandId: brandIdSchema.nullable().optional(),
  sourceLabel: z.string().optional(),
  contentId: z.string().min(1).nullable().optional(),
  campaignId: z.string().uuid().nullable().optional(),
  campaignName: z.string().min(1).nullable().optional(),
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
  const parsed = brandIdSchema.safeParse(brand);
  const brandId = parsed.success ? parsed.data : null;

  // Frente pessoal: CRM pode estar ligado na instalação, mas esta frente não
  // usa a fila — a UI some o botão em vez de mostrar "configured: true" vazio.
  if (isPersonalFront(brandId)) {
    return Response.json({ configured: false, pending: [], personal: true });
  }

  try {
    return Response.json({ configured: true, pending: await listPendingPieces(brandId) });
  } catch {
    // Fila fora do ar não pode derrubar o painel — o resto dele não depende dela.
    return Response.json({ configured: true, pending: [], unreachable: true });
  }
}

export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (isPersonalFront(parsed.data.brandId)) {
    return Response.json(
      { error: "a frente Meu não envia para o CRM — peça pessoal fica só neste navegador" },
      { status: 403 },
    );
  }

  try {
    const result = await publishForApproval(parsed.data);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return Response.json({ error: message }, { status: 502 });
  }
}
