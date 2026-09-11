import { brandIdSchema, isPersonalFront } from "@/constants/brands";
import { fetchContentCampaigns, campaignsConfigured } from "@/lib/campaigns";

/**
 * Lista campanhas de canal Conteúdo/Digital pra seletor da bancada.
 * `configured: false` é resposta legítima — mesma lógica de `/api/publish`.
 * `brandId` é obrigatório: sem frente, a leitura via service role devolveria
 * campanhas de todas as empresas.
 */
export async function GET(request: Request) {
  if (!campaignsConfigured()) {
    return Response.json({ configured: false, campaigns: [] });
  }

  const brand = new URL(request.url).searchParams.get("brandId");
  const parsed = brandIdSchema.safeParse(brand);
  if (!parsed.success) {
    return Response.json({ error: "brandId é obrigatório" }, { status: 400 });
  }
  const brandId = parsed.data;

  if (isPersonalFront(brandId)) {
    return Response.json({ configured: false, campaigns: [], personal: true });
  }

  try {
    return Response.json({
      configured: true,
      campaigns: await fetchContentCampaigns(brandId),
    });
  } catch {
    return Response.json({ configured: true, campaigns: [], unreachable: true });
  }
}
