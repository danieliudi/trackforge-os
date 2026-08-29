import type { BrandKnowledge } from "./types";

/**
 * Fatos Resibag — cópia curada de `resibag-canonical-facts` v2.3 e
 * `resibag-compliance-kb` v3.3 (agosto/2026).
 *
 * Ao atualizar aquelas fontes, atualizar aqui também: este arquivo é o que o
 * gerador enxerga, e uma divergência silenciosa entre os dois é exatamente o
 * tipo de erro que a base canônica existe para impedir.
 *
 * Divergência conhecida com a fonte, mantida de propósito: a `resibag-compliance-kb`
 * v3.3 (seção 2) apresenta a ANTT 6.078/2026 como atualização da 5.998/2022.
 * Não é — são resoluções de assuntos diferentes (Daniel Yano, 29/08/2026), e a
 * menção foi removida daqui. Enquanto a skill de origem não for corrigida, este
 * arquivo está certo e ela está errada; não "sincronize" reintroduzindo.
 */
export const resibagKnowledge: BrandKnowledge = {
  facts: `## Identidade
- Resibag Comercial Ltda. — marca do Grupo Sanwey, fundada em 2022, sede em Taboão da Serra/SP.
- Endosso correto: "Resibag — Uma marca Sanwey" (travessão em-dash).
- Tagline institucional: "Gestão inteligente de resíduos industriais."
- Slogan comercial (só ads/outreach, nunca junto da tagline): "Nem todo big bag passa na auditoria. O nosso passa."
- Contato comercial: WhatsApp (11) 99465-9377 · vendas@resibag.com.br · resibag.com.br

## Produtos e o que cada um pode alegar
Quatro produtos em dois registros. Atribuir certificação entre registros é erro de compliance.

Registro 1 — homologados (INMETRO + ANTT 5998 + ANP + ISO 9001:2015):
- **Standard** — big bag para resíduos perigosos Classe I e II.
- **Estruturado** — versão rígida, contenção estrutural superior.

Registro 2 — só ISO 9001:2015, SEM INMETRO/ANTT/ANP:
- **Filtrante** — substitui filtro-prensa em tintas, vernizes e resinas; desaguamento de lodo; limpeza de ETE/fossa.
- **Resíduo Verde** — alternativa reutilizável ao saco plástico, paisagismo e resíduo verde.

Filtrante e Resíduo Verde nunca podem ser oferecidos para resíduo perigoso Classe I transportado externamente.

## Certificações
Os códigos, escopos e datas estão no bloco FATOS NORMATIVOS, cada um com sua fonte.
Aqui fica só a regra de atribuição, que é política de compliance da marca:
INMETRO, ANTT 5998 e ANP valem **exclusivamente** para Standard e Estruturado.
Filtrante e Resíduo Verde têm apenas ISO 9001:2015.

São **duas** homologações para resíduo perigoso: INMETRO + ANTT 5998. Chame de "dupla homologação".

## Argumentos fixos (verbatim)
- "1 Resibag substitui 5 tambores" — cinco, nunca outro número.
- "Envio em até 2 dias ou retirada em fábrica" — nunca prometer entrega na porta.
- Diferencial: dupla homologação (INMETRO + ANTT 5998). Não alegar exclusividade — concorrentes mapeados também têm cobertura INMETRO.
- Tese: a Resibag não compete em embalagem, compete em mitigação de passivo ambiental.
- Uma única multa da ANTT cobre anos de diferença de preço contra embalagem não homologada.

## Para quem se escreve
- **Gerente Ambiental / EHS** — especificador. Ganchos: dupla homologação, rastreabilidade, RAPP, NBR 10.004:2024. Tom técnico e regulatório.
- **Gerente de Compras** — negocia TCO. Ganchos: 1 Resibag = 5 tambores, envio em 2 dias, previsibilidade. Tom operacional e financeiro.
- **C-Level / Diretor de ESG** — aprova. Ganchos: ESG auditável, IFRS S1/S2, Escopo 3, mitigação de passivo. Tom de comitê, sem jargão.

## Vocabulário
Use: embalagem homologada · parceiro de conformidade · consciência comprovada · rastreabilidade · economia circular · passivo ambiental · mitigação de risco · auditável · destino certo · dupla homologação · "Uma marca Sanwey".
Evite: big bag sozinho como categoria · fornecedor de embalagem · sustentável/verde/eco · controle/fiscalização · prevenção de multa · lixo/descarte.`,

  forbidden: [
    {
      term: "NORMAM, Marinha do Brasil, homologação marítima ou aquaviária",
      reason:
        "a Resibag NÃO possui essa homologação. Foi removida da base canônica em agosto/2026 depois de constar por engano. Citar isso é alegar certificação inexistente.",
      match: [/normam/, /marinha/, /aquaviari/, /homologacao maritima/],
    },
    {
      term: "ANTT 6.078/2026 apresentada como atualização da 5.998/2022",
      reason:
        "não substituiu nem atualizou a 5.998 — são resoluções de assuntos diferentes do setor de transportes (confirmado por Daniel Yano em 29/08/2026). Sobre transporte rodoviário de perigosos, cite apenas a ANTT 5998/2022.",
      match: [/6\.?078/],
    },
    {
      term: '"tripla homologação"',
      reason: "a contagem é dois: INMETRO + ANTT 5998. Escreva dupla homologação.",
      match: [/tripla homologacao/, /tres homologacoes/],
    },
    {
      term: '"1 big bag substitui 4 tambores", "4 a 5 tambores" ou qualquer variação',
      reason: "o argumento auditável é 5 tambores, valor fixo.",
      match: [/\b4\s*a\s*5\s*tambores/, /\b4\s+tambores/, /quatro tambores/],
    },
    {
      term: '"Seu resíduo, nosso compromisso"',
      reason: "tagline descontinuada 100%, sem retenção em nenhum canal.",
      match: [/seu residuo,?\s*nosso compromisso/],
    },
    {
      term: '"entrega em 48h", "48 horas" ou "entregamos em sua porta"',
      reason:
        'o claim correto é "envio em até 2 dias ou retirada em fábrica" — e vale só para a linha Standard.',
      match: [/\b48\s*h\b/, /\b48\s*horas/, /entregamos em sua porta/],
    },
    {
      term: '"Uma empresa Sanwey"',
      reason: 'o endosso correto é "Uma marca Sanwey".',
      match: [/uma empresa sanwey/],
    },
    {
      term: '"maior fabricante", "melhor do mercado" ou líder de mercado',
      reason: "não é verificável.",
      match: [/maior fabricante/, /melhor do mercado/, /lider de mercado/],
    },
    {
      term: "INMETRO, ANTT ou ANP associados a Filtrante ou Resíduo Verde",
      reason:
        "essas linhas têm apenas ISO 9001:2015. Atribuir homologação a elas é erro de compliance.",
    },
    {
      term: "qualquer telefone ou e-mail fora de (11) 99465-9377 e vendas@resibag.com.br",
      reason: "contatos errados já circularam em material antigo.",
      match: [/\(?81\)?\s*923.?721.?7839/, /94055.?1389/],
    },
    {
      term: "nome, preço ou cobertura de concorrente (EmbTec, Ágilbag, Engebag)",
      reason: "é inteligência interna, não entra em peça pública.",
      match: [/embtec/, /agilbag/, /engebag/],
    },
  ],
};
