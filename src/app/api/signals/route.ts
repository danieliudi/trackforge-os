import { z } from "zod";

import { fetchMarketSignals, signalsConfigured } from "@/lib/marketSignals";

const requestSchema = z.object({
  brandId: z.enum(["sanwey", "resibag"]).nullable().optional(),
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
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (!signalsConfigured()) {
    return Response.json({ configured: false, signals: [] });
  }

  return Response.json({
    configured: true,
    signals: await fetchMarketSignals(parsed.data.brandId),
  });
}
