import { fetchContentCampaigns } from "@/lib/campaigns";

/**
 * Lista campanhas de conteúdo do CRM pro seletor da bancada.
 *
 * O `status` viaja junto com a lista porque lista vazia sozinha não diz nada:
 * a bancada precisa distinguir "não há campanha de conteúdo cadastrada" de
 * "não consigo perguntar ao CRM". Responder sempre 200 é deliberado — nenhum
 * destes casos é falha do pedido, e o seletor trata os três.
 */
export async function GET(request: Request) {
  const brand = new URL(request.url).searchParams.get("brandId");
  const brandId = brand === "sanwey" || brand === "resibag" ? brand : null;
  const result = await fetchContentCampaigns(brandId);

  return Response.json({
    status: result.status,
    campaigns: result.status === "ok" ? result.campaigns : [],
    detail: result.status === "erro" ? result.detail : undefined,
  });
}
