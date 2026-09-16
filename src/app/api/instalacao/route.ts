import { isShortenerConfigured } from "@/lib/attribution";
import { campaignsConfigured } from "@/lib/campaigns";
import { crmPublishConfigured } from "@/lib/crm";
import { signalsConfigured } from "@/lib/marketSignals";

/**
 * A chave da Anthropic, em três estados e não dois.
 *
 * `sk-ant-...` é o texto LITERAL do `.env.example`, e o bootstrap copia o
 * exemplo quando o `.env.local` não existe — então placeholder esquecido é o
 * estado mais provável de todos, não um caso de borda. Para a API ele é
 * indistinguível de chave errada: os dois voltam 401 "API key is invalid".
 *
 * Contar o placeholder como "definida" seria a tela mentindo no lugar exato em
 * que ela existe para não mentir. É a mesma forma do "não sei" virando "EM DIA"
 * no sinal da faixa (CLAUDE.md seção 12), e a lição é a mesma: declarar dois de
 * três estados é pior que declarar nenhum, porque dá sensação de cobertura.
 *
 * O valor NUNCA sai daqui — nem o começo dele, nem o tamanho (seção 3).
 */
function anthropicConfigured() {
  const chave = (process.env.ANTHROPIC_API_KEY || "").trim();
  return { presente: Boolean(chave), exemplo: chave === "sk-ant-..." };
}

/**
 * Diagnóstico de instalação — só booleans e nomes de variável.
 *
 * Nunca devolve valor de segredo. A tela de Instalação usa isto para mostrar
 * ligado/desligado sem expor a service role ou a chave de agente.
 */
export async function GET() {
  const anthropic = anthropicConfigured();

  return Response.json({
    integrations: [
      {
        // PRIMEIRA da lista de propósito: é a única OBRIGATÓRIA. As outras
        // cinco são opcionais, e sem cada uma a seção correspondente só não
        // aparece. Sem esta, toda rota que gera devolve 401 no clique — e até
        // 16/09/2026 ela era justamente a que não estava aqui.
        id: "anthropic",
        label: anthropic.exemplo
          ? "Geração de conteúdo — o valor ainda é o sk-ant-… do exemplo"
          : "Geração de conteúdo — obrigatória, nada gera sem ela",
        env: ["ANTHROPIC_API_KEY"],
        configured: anthropic.presente && !anthropic.exemplo,
      },
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
