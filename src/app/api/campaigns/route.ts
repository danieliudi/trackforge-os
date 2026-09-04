import { brandIdSchema, isPersonalFront } from "@/constants/brands";
import { fetchContentCampaigns, campaignsConfigured } from "@/lib/campaigns";

/**
 * Lista campanhas de canal Conteúdo/Digital pra seletor da bancada.
 * `configured: false` é resposta legítima — mesma lógica de `/api/publish`.
 */
export async function GET(request: Request) {
  if (!campaignsConfigured()) {
    return Response.json({ configured: false, campaigns: [] });
  }

  const brand = new URL(request.url).searchParams.get("brandId");
  const parsed = brandIdSchema.safeParse(brand);
  const brandId = parsed.success ? parsed.data : null;

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
