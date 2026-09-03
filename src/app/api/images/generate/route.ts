import { z } from "zod";

import { jsonBody } from "@/lib/apiError";

const requestSchema = z.object({
  prompt: z.string().min(20, "prompt curto demais").max(2000),
  /** 1:1 cabe bem em card/split; o editor pode recortar. */
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional(),
});

/**
 * Geração de imagem via OpenAI Images (gpt-image-1), pluggable por env.
 *
 * Sem `OPENAI_API_KEY` devolve 503 com instrução clara — não inventa chave.
 * Política TrackForge: não use para foto de produto/embalagem real; só
 * atmosfera editorial. O produto real vem da biblioteca da marca.
 */
export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return Response.json(
      {
        error:
          "geração de imagem não configurada — defina OPENAI_API_KEY no ambiente",
        code: "missing_openai_key",
      },
      { status: 503 },
    );
  }

  const body = await jsonBody(request);
  if (!body.ok) return body.response;

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { prompt, size = "1024x1024" } = parsed.data;

  // Guarda explícita no prompt do servidor — o modelo ainda pode errar, mas
  // o pedido nunca pede marca/produto nomeado.
  const guarded = `${prompt.trim()}

Constraints: photorealistic editorial still, no logos, no brand names, no product packaging labels, no readable text, no trademarks.`;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: guarded,
        size,
        // b64 evita depender de URL temporária do provider no export do canvas.
        n: 1,
      }),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      data?: Array<{ b64_json?: string; url?: string }>;
    };

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message ?? "falha na API de imagens" },
        { status: 502 },
      );
    }

    const first = data.data?.[0];
    if (first?.b64_json) {
      return Response.json({
        url: `data:image/png;base64,${first.b64_json}`,
        provider: "openai",
      });
    }
    if (first?.url) {
      return Response.json({ url: first.url, provider: "openai" });
    }

    return Response.json({ error: "a API não devolveu imagem" }, { status: 502 });
  } catch (cause) {
    return Response.json(
      {
        error: cause instanceof Error ? cause.message : "falha ao gerar imagem",
      },
      { status: 502 },
    );
  }
}

/** Status sem gastar crédito — a UI decide se mostra o botão Gerar. */
export async function GET() {
  return Response.json({
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    provider: process.env.OPENAI_API_KEY?.trim() ? "openai" : null,
  });
}
