import { z } from "zod";

import { crmPublishConfigured, publishForApproval } from "@/lib/crm";
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

/** Diz se o botão deve aparecer, sem revelar nada da credencial. */
export function GET() {
  return Response.json({ configured: crmPublishConfigured() });
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
