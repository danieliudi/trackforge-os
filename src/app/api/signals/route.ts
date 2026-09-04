import { z } from "zod";

import { brandIdSchema, isPersonalFront } from "@/constants/brands";

import { fetchMarketSignals, signalsConfigured } from "@/lib/marketSignals";
import { jsonBody } from "@/lib/apiError";

const requestSchema = z.object({
  brandId: brandIdSchema.nullable().optional(),
});

/**
 * Lista os sinais disponíveis para o composer escolher antes de gerar.
 *
 * Rota própria em vez de dado da geração porque o usuário escolhe os sinais
 * ANTES de gerar — e porque a leitura precisa da service role key, que não pode
 * sair do servidor.
 *
 * `configured: false` não é erro: quem roda o gerador nem sempre tem acesso ao
 * CRM, e a interface só esconde a seção em vez de mostrar falha.
 */
export async function POST(request: Request) {
  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (isPersonalFront(parsed.data.brandId)) {
    return Response.json({ configured: false, signals: [], personal: true });
  }

  if (!signalsConfigured()) {
    return Response.json({ configured: false, signals: [] });
  }

  return Response.json({
    configured: true,
    signals: await fetchMarketSignals(parsed.data.brandId),
  });
}
