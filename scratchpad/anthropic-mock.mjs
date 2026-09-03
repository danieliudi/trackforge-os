/**
 * API da Anthropic de mentira, para o teste de navegador rodar de graça.
 *
 * A ROTA REAL RODA INTEIRA: brief, `generateObject`, schema de fio, normalização
 * e schema estrito. Só a resposta do modelo é fixa — e ela é de propósito uma
 * resposta que a Anthropic considera VÁLIDA e que o schema antigo reprovava:
 * seção com 7 parágrafos, 9 seções, "describes" de 300 caracteres, fonte com
 * "url": null e formato sugerido em duplicata.
 */
import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 8787);

const ARTIGO = {
  title: "Descarte de resíduo perigoso: o que o comprador precisa exigir",
  dek: "O que muda para quem responde pela destinação — e o que pedir do fornecedor.",
  targetAudience: "Gerente de compras e compliance de indústria química",
  sections: [
    {
      heading: "A responsabilidade não termina na saída da fábrica",
      // SETE parágrafos: o teto antigo era seis.
      paragraphs: [
        "A destinação de resíduo perigoso segue com o gerador depois do portão.",
        "Isso vale para o transporte e para o destino final.",
        "O contrato com o transportador não transfere a responsabilidade.",
        "A fiscalização cobra do gerador, não de quem carregou.",
        "O registro do que saiu é a prova que sobra.",
        "Sem esse registro, a defesa é a palavra do fornecedor.",
        "É por isso que a exigência começa na compra da embalagem.",
      ],
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      heading: `Ponto de controle ${i + 1}`,
      paragraphs: [
        `O que conferir no ponto ${i + 1} antes de aprovar o fornecedor.`,
        "A conferência é documental e leva minutos.",
      ],
    })),
  ],
  takeaways: [
    "Peça o certificado de homologação antes de fechar o pedido.",
    "Guarde o registro de saída de cada lote.",
    "Confira a validade do certificado do transportador.",
    "Inclua a exigência no contrato, não só no pedido.",
    "Revise a lista de fornecedores homologados a cada semestre.",
    "Peça a nota de destinação final ao destinatário.",
  ],
  sources: [
    // "url": null — o campo opcional que o modelo resolveu preencher com nulo.
    { label: "Resolução ANTT nº 5.998/2022", url: null },
    { label: "Portal do órgão", url: "www.exemplo.gov.br/antt" },
  ],
  suggestedOutputs: [
    { kind: "post-texto", reason: "O prazo e a exigência cabem em texto puro e circulam melhor." },
    { kind: "post-texto", reason: "Formato repetido, que marcaria a mesma caixa duas vezes." },
    {
      kind: "carrossel-linkedin",
      // Motivo longo demais: o teto é 180 caracteres.
      reason: "O conteúdo é um passo a passo com pontos de controle numerados, ".repeat(4).trim(),
    },
    { kind: "stories", reason: "Lembrete curto de prazo, que some em 24h como o assunto pede." },
  ],
  imageIdeas: [
    {
      slot: "capa",
      // Descrição longa demais: o teto é 160 caracteres.
      describes: "operador de EPI completo movimentando big bag com empilhadeira em pátio industrial ao lado de contentores identificados com etiqueta de resíduo perigoso e um inspetor conferindo documento na prancheta",
      query: "industrial warehouse forklift",
    },
    { slot: "Ponto de controle 1", describes: "documento de certificação sobre a mesa", query: "certificate document desk" },
    { slot: "Ponto de controle 2", describes: "inspeção de carga em pátio", query: "cargo inspection yard" },
    { slot: "Ponto de controle 3", describes: "big bag empilhado em galpão", query: "bulk bag warehouse" },
    // QUINTA ideia: o teto antigo era quatro.
    { slot: "Ponto de controle 4", describes: "caminhão carregado em doca", query: "loading dock truck" },
  ],
};

const AUDITORIA = {
  claims: [
    {
      blockNumber: 1,
      claim: "A responsabilidade pela destinação segue com o gerador.",
      verdict: "rastreado",
      source: "Resolução ANTT nº 5.998/2022",
    },
  ],
};

/**
 * Artigo genuinamente quebrado — o que a normalização NÃO conserta e deve mesmo
 * reprovar: seção sem título e sem parágrafo, sobrando zero seção.
 */
const QUEBRADO = {
  ...ARTIGO,
  title: "",
  sections: [{ heading: "   ", paragraphs: ["", "  "] }],
};

/**
 * Resposta que nem a FORMA respeita — `sections` como texto.
 *
 * É o caso que `generateObject` derruba antes da normalização, com
 * `NoObjectGeneratedError`: o modelo rodou, a Anthropic cobrou, e nada saiu.
 */
const FORA_DE_FORMA = { ...ARTIGO, sections: "isto não é uma lista" };

/** Qual das duas chamadas é esta: a redação do artigo ou a auditoria. */
function respostaPara(body) {
  const schema =
    body?.output_config?.format?.schema ??
    body?.tools?.find((tool) => tool.input_schema?.properties)?.input_schema;
  const props = schema?.properties ?? {};
  if ("claims" in props) return AUDITORIA;

  // O tema pedido decide o cenário, para um mock só servir aos três testes.
  const pedido = JSON.stringify(body?.messages ?? "");
  if (pedido.includes("QUEBRADO")) return QUEBRADO;
  if (pedido.includes("FORA-DE-FORMA")) return FORA_DE_FORMA;
  return ARTIGO;
}

const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      /* corpo vazio */
    }

    const payload = respostaPara(body);
    // Ferramenta de resposta JSON (quando o modelo não tem saída estruturada
    // nativa) devolve `tool_use`; saída estruturada devolve texto.
    const jsonTool = body?.tools?.find((tool) => tool.input_schema?.properties);
    const content = body?.output_config?.format
      ? [{ type: "text", text: JSON.stringify(payload) }]
      : [{ type: "tool_use", id: "toolu_mock", name: jsonTool?.name ?? "json", input: payload }];

    console.error(
      `[mock] ${body?.model} · ${body?.output_config?.format ? "saída estruturada" : "ferramenta json"} · ${payload === ARTIGO ? "artigo" : "auditoria"}`,
    );

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_mock",
        type: "message",
        role: "assistant",
        model: body?.model ?? "claude-sonnet-5",
        content,
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 4231, output_tokens: 2104 },
      }),
    );
  });
});

server.listen(PORT, "127.0.0.1", () => console.error(`[mock] ouvindo em ${PORT}`));
