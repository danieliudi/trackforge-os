import { isShortenerConfigured } from "@/lib/attribution";
import { campaignsConfigured } from "@/lib/campaigns";
import { crmPublishConfigured } from "@/lib/crm";
import { signalsConfigured } from "@/lib/marketSignals";

/**
 * Diagnóstico de instalação — só booleans e nomes de variável.
 *
 * Nunca devolve valor de segredo. A tela de Instalação usa isto para mostrar
 * ligado/desligado sem expor a service role ou a chave de agente.
 */
export async function GET() {
  return Response.json({
    integrations: [
      {
        id: "signals",
        label: "Sinais de mercado",
        env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        configured: signalsConfigured(),
      },
      {
        id: "campaigns",
        label: "Campanhas de conteúdo",
        env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        configured: campaignsConfigured(),
      },
      {
        id: "crm_publish",
        label: "Fila de aprovação (CRM)",
        env: ["SUPABASE_URL", "CRM_AGENT_KEY"],
        configured: crmPublishConfigured(),
      },
      {
        id: "shortener",
        label: "Encurtador (QR curto)",
        env: ["NEXT_PUBLIC_SHORTENER_BASE"],
        configured: isShortenerConfigured(),
      },
      {
        id: "usd_brl",
        label: "Cotação USD → BRL",
        env: ["NEXT_PUBLIC_USD_BRL"],
        configured: Boolean((process.env.NEXT_PUBLIC_USD_BRL || "").trim()),
      },
    ],
  });
}
