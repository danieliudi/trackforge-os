import type { BrandKnowledge } from "./types";

/**
 * Fatos Resibag — cópia curada de `resibag-canonical-facts` v2.3 e
 * `resibag-compliance-kb` v3.3 (agosto/2026).
 *
 * Ao atualizar aquelas fontes, atualizar aqui também: este arquivo é o que o
 * gerador enxerga, e uma divergência silenciosa entre os dois é exatamente o
 * tipo de erro que a base canônica existe para impedir.
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

## Certificações (com código — use o código, não uma paráfrase)
| Certificação | Código | Escopo | Linhas |
|---|---|---|---|
| INMETRO | IBC-0136/22 SAN T025 | Embalagem para resíduo perigoso | Standard, Estruturado |
| INMETRO | IBC-0143/25 SAN T015 | Embalagem para resíduo perigoso | Standard, Estruturado |
| OCP acreditador | ABRACE OCP-0041 | Organismo de certificação | — |
| ANTT 5998/2022 | — | Transporte rodoviário de perigosos | Standard, Estruturado |
| ANTT 6.078/2026 | — | Atualização do transporte rodoviário | Standard, Estruturado |
| ANP | — | Oil & Gas offshore | Standard, Estruturado |
| ISO 9001:2015 | SGS BR08/4255.00 | Gestão da qualidade | Todas |

São **duas** homologações para resíduo perigoso: INMETRO + ANTT 5998. Chame de "dupla homologação".

## Normas — o que cada uma realmente é
- **NBR 10.004:2024 (ABNT)** — norma de *classificação* de resíduo sólido quanto à periculosidade. Não é obrigação sobre transportador. Classe I = perigoso (solvente, óleo contaminado, tinta, bateria, medicamento vencido) e exige big bag homologado INMETRO. Classe II A = não inerte. Classe II B = inerte. A revisão de 2024 mexeu em limites de metais pesados, ensaios de lixiviação e solubilização (anexos F e G) e critérios de amostragem.
- **ANTT 5998/2022** — vigente desde junho/2023, revogou a ANTT 420/2004. Exige embalagem certificada INMETRO, Ficha de Emergência + Envelope para Transporte, MOPP do motorista e declaração de responsabilidade do expedidor (o gerador).
- **ANTT 6.078/2026** — atualização: declarações eletrônicas, fiscalização cruzada com IBAMA, MTR-e integrado ao sistema ANTT, novos critérios de reclassificação de embalagem.
- **Portaria INMETRO 320/2021** — requisitos de conformidade da embalagem. Ensaios de queda livre, empilhamento, estanqueidade e pressão interna; certificação por OCP acreditado; marcação ONU obrigatória (símbolo + código + massa bruta máxima); auditoria anual e recertificação a cada 3 anos. Marcação no formato \`1H2/Y/[ano]/BR/[fabricante]/[OCP]\` — 1H2 é big bag flexível, Y cobre grupos de embalagem II e III.
- **IBAMA RAPP** — relatório anual obrigatório para gerador de resíduo perigoso; prazo maio/2026 para o ano-base 2025.
- **Decreto 12.688/2025** — detalha a PNRS em responsabilidade compartilhada, amplia logística reversa obrigatória, cria critérios de certificação de destinadoras.
- **IN IBAMA 06/2026** — novos critérios de declaração no RAPP, integração com MTR-e, rastreabilidade documental da embalagem.
- **IFRS S1 / S2 (ISSB)** — relato de sustentabilidade; no Brasil via CVM Res. 193/2023, voluntária desde 2024. Resíduo perigoso entra como Escopo 3; embalagem certificada e rastreável vira evidência auditável.

## Multas documentadas (só estes valores — nenhum outro)
| Infração | Base legal | Valor |
|---|---|---|
| Destinação irregular de resíduo perigoso | Lei 9.605/98, art. 54 | R$ 5.000 a R$ 50.000.000 |
| Transporte sem embalagem certificada | ANTT 5998/2022 | R$ 5.000 a R$ 10.000 por ocorrência |
| Ausência de documentação no transporte | ANTT 5998/2022 | R$ 2.500 a R$ 5.000 |
| Não entrega do RAPP | IBAMA | R$ 5.000 a R$ 10.000.000 |
| Crime ambiental com dolo | Lei 9.605/98 | Detenção 1 a 5 anos + multa |

Reincidência ANTT: dobro do valor + apreensão da carga. Enquadre sempre como proteção de patrimônio, nunca como ameaça.

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
