import type { BrandKnowledge } from "./types";

/**
 * Fatos Resibag — cópia curada de `resibag-canonical-facts` v3.1 (10/09/2026).
 *
 * Ao atualizar aquela fonte, atualizar aqui também: este arquivo é o que o
 * gerador enxerga, e uma divergência silenciosa entre os dois é exatamente o
 * tipo de erro que a base canônica existe para impedir.
 *
 * CORREÇÃO DE COMPLIANCE, v2.3 → v2.9 (revisada à mão em 10/09/2026).
 * A curadoria ficou seis versões atrás de uma correção de fato, e o efeito era
 * o pior possível: a lista `forbidden` abaixo MANDAVA escrever "dupla
 * homologação" — o gate determinístico apontando para o erro. O que mudou:
 *
 *   · A Resibag tem UMA homologação de produto: INMETRO, em dois certificados
 *     por capacidade. "Dupla" e "tripla" são ambas erradas. A correção anterior
 *     trocou "tripla" por "dupla" sem revalidar o fato — o valor real é um.
 *   · ANTT 5998/2022 é a resolução que OBRIGA O CLIENTE, não selo da Resibag.
 *     Ela é citada como documento normativo dentro dos próprios certificados
 *     INMETRO: a Resibag atende à exigência VIA INMETRO. "Homologação ANTT"
 *     não existe.
 *   · ANP saiu inteiro — sem lastro conhecido (08/09/2026). Atenção: isto é
 *     escopo Resibag. A ANP da Sanwey é outra pergunta, em `sanwey.ts`.
 *   · ISO 9001:2015 é certificação de SISTEMA DE GESTÃO, titulada pela Sanwey,
 *     e cobre a fabricação de todas as linhas. Nunca certificação de produto.
 *     Filtrante e Resíduo Verde não têm certificação de produto NENHUMA.
 *   · A tagline perdeu "industriais" (09/09/2026) e o slogan antigo foi
 *     suspenso por premissa falsa (08/09/2026): sugeria que o cliente não tem
 *     alternativa homologada, e os três concorrentes mapeados têm INMETRO.
 *
 * SEGUNDA REVISÃO DO MESMO DIA, v2.9 → v3.1. A skill andou duas vezes em
 * 10/09/2026, e de novo com conteúdo de compliance dentro:
 *
 *   · A NBR 10.004 é norma de CLASSIFICAÇÃO e NÃO TEM prazo de adequação. O
 *     "prazo até 31/12/2026" que circulava é erro — apareceu num deck de
 *     prospecção, e a origem da data virou [FALTA DADO]. Citar sempre :2024.
 *   · OCP-0041 é o registro do ORGANISMO CERTIFICADOR (ABRACE), nunca o código
 *     INMETRO do produto. Cita-se separado, como OCP acreditador.
 *   · O nome do organismo certificador da ISO 9001 saiu da fonte: está em
 *     CONFLITO ABERTO entre as duas frentes (SGS aqui, DNV na Sanwey), sem
 *     certificado físico conferido. Em peça Resibag não se cita organismo.
 *     ESCOPO: a proibição é desta frente. O certificado é da Sanwey, e a fonte
 *     canônica dela registra DNV com histórico de correção — `sanwey.ts` não
 *     herda esta regra, porque isso seria o vazamento entre marcas que a
 *     própria regra de isolamento proíbe.
 *   · `comercial@resibag.com.br` não é canônico: apareceu no header do site.
 *
 * Os certificados INMETRO NÃO mudaram da v2.9 para a v3.1 — conferido antes de
 * reescrever qualquer coisa, porque `src/knowledge/facts/resibag-normas.json`
 * tinha acabado de ser preenchido a partir deles.
 *
 * A divergência que este arquivo mantinha de propósito — a ANTT 6.078/2026
 * apresentada como atualização da 5.998 — está RESOLVIDA na fonte: a v2.9
 * moveu a 6.078 para "nunca citar", por não se confirmar em fonte oficial. A
 * `resibag-compliance-kb`, que carregava a troca, foi descontinuada em
 * 10/09/2026. A regra continua aqui porque continua valendo.
 */
export const resibagKnowledge: BrandKnowledge = {
  facts: `## Identidade
- Resibag Comercial Ltda. — marca do Grupo Sanwey, fundada em 2022, sede em Taboão da Serra/SP.
- Endosso correto: "Resibag — Uma marca Sanwey" (travessão em-dash).
- Tagline institucional: "Gestão inteligente de resíduos."
- Slogan comercial (só ads/outreach, nunca junto da tagline): "5 tambores parecem mais baratos. Juntos, pesam e custam mais que 1 Resibag."
- Contato comercial: WhatsApp (11) 99465-9377 · vendas@resibag.com.br · resibag.com.br

## Produtos e o que cada um pode alegar
Quatro produtos em dois registros. Atribuir certificação entre registros é erro de compliance.

Registro 1 — homologados no INMETRO. Standard e Estruturado compartilham AS MESMAS
duas certificações, uma por capacidade; o Estruturado só acrescenta chapa de papelão
ondulado interna, que não muda o certificado.
- **Standard** — 700 kg ou 1000 kg, para resíduo perigoso Classe I (NBR 10.004).
- **Estruturado** — mesmas capacidades, com reforço interno opcional.

700 kg e 1000 kg são as ÚNICAS capacidades homologadas. Qualquer outra dimensão é
consulta técnica, nunca "dentro do envelope de compliance INMETRO".

Registro 2 — SEM certificação de produto:
- **Filtrante** — substitui filtro-prensa em tintas, vernizes e resinas; desaguamento de lodo; limpeza de ETE/fossa.
- **Resíduo Verde** — alternativa reutilizável ao saco plástico, paisagismo e resíduo verde.

Filtrante e Resíduo Verde nunca podem ser oferecidos para resíduo perigoso Classe I
transportado externamente.

## Certificações — a Resibag tem UMA homologação de produto
Os códigos, escopos e datas estão no bloco FATOS NORMATIVOS, cada um com sua fonte.
Aqui fica a regra de atribuição, que é política de compliance da marca.

**INMETRO é a única homologação de produto**, em dois certificados por capacidade, e
vale exclusivamente para Standard e Estruturado. A contagem é sempre UMA: qualquer
material que afirme mais de uma homologação está errado.

**ANTT 5998/2022 não é selo da Resibag.** É a resolução que obriga o CLIENTE a usar
embalagem certificada no transporte rodoviário de perigosos, e é citada como documento
normativo dentro dos próprios certificados INMETRO. A Resibag atende à exigência VIA
a homologação INMETRO. A forma correta de citar é "a ANTT 5998/2022 exige" — a
resolução obriga o cliente; não é selo que a Resibag detém.

**ISO 9001:2015 é certificação de sistema de gestão**, titulada pela Sanwey Indústria
de Containers, e cobre a fabricação de todas as linhas. Nunca soma nem substitui
homologação. Escreva "fabricado sob sistema de gestão da qualidade certificado
ISO 9001:2015 do Grupo Sanwey" — nunca "Filtrante é certificado".

Classe (NBR 10.004, I/II) e Grupo de embalagem (ANTT/ONU, I/II/III) são eixos
diferentes: Classe classifica o resíduo, Grupo classifica o risco da embalagem no
transporte. Não misturar os dois em material técnico ou jurídico.

**A NBR 10.004 é norma de classificação e não tem prazo de adequação.** Citar
sempre a edição :2024. Data de prazo atribuída a ela é erro de fato.

**OCP-0041 é o registro do organismo certificador**, a ABRACE, acreditada pela
ABNT NBR ISO/IEC 17065. Cita-se separado, como OCP acreditador — os códigos do
produto são IBC-0136/22 e IBC-0143/25.

**Em peça Resibag não se nomeia o organismo certificador da ISO 9001.** Escreva
"sistema de gestão da qualidade certificado ISO 9001:2015". O nome está em
conflito aberto entre as frentes e aguarda certificado físico conferido.

## Argumentos fixos (verbatim)
- "1 Resibag substitui 5 tambores" — cinco, nunca outro número.
- "Envio em até 2 dias ou retirada em fábrica" — só a linha Standard, nunca prometer entrega na porta.
- Certificação: homologação INMETRO para resíduo perigoso Classe I. Uma, nunca mais de uma.
- Obrigação do cliente: a ANTT 5998/2022 exige embalagem certificada. Uma única autuação cobre anos de diferença de preço contra embalagem não certificada. Sem valores de multa sem fonte oficial.
- Diferenciação real: Grupo Sanwey (40+ anos) · consistência lote a lote · atendimento · confiabilidade da documentação de homologação · despacho em 2 dias para o Standard · projetos customizados.

## Regra de premissa — ler antes de escrever qualquer peça
**Homologação é requisito de entrada da categoria, não diferencial.** Os três
concorrentes mapeados têm certificação INMETRO. Nenhuma peça pode ser construída sobre
a premissa de que o cliente não tem alternativa homologada — ele tem. O que varia acima
desse piso: consistência lote a lote, se a documentação chega junto com o produto,
rastreabilidade do certificado, atendimento e o respaldo do grupo fabricante.

## Para quem se escreve
- **Gerente Ambiental / EHS** — especificador e PORTA DE ENTRADA da conta. Ganchos: homologação INMETRO para Classe I, rastreabilidade, RAPP, NBR 10.004:2024. Tom técnico e regulatório.
- **Gerente de Compras** — conduz o processo e negocia TCO. Ganchos: 1 Resibag = 5 tambores, envio em 2 dias, previsibilidade. Tom operacional e financeiro.
- **C-Level / Diretor de ESG** — aprova, por exceção em contas grandes. Ganchos: passivo ambiental como risco financeiro, ESG auditável, IFRS S1/S2, Escopo 3. Tom de comitê, sem jargão. A linguagem ESG é espaço pouco ocupado pelos concorrentes — não exclusivo.

## Vocabulário
Use: embalagem homologada · homologação INMETRO · "a ANTT 5998/2022 exige" · fabricado sob SGQ certificado ISO 9001 · parceiro de conformidade · consciência comprovada · rastreabilidade · economia circular · passivo ambiental · mitigação de risco · auditável · destino certo · "Uma marca Sanwey".
Evite: big bag sozinho como categoria · fornecedor de embalagem · sustentável/verde/eco · controle/fiscalização · prevenção de multa · lixo/descarte.
As proibições de compliance — contagem de homologação, ANTT como selo, ISO como
certificação de produto — estão na seção PROIBIÇÕES, que é onde elas valem.`,

  forbidden: [
    {
      term: "NORMAM, Marinha do Brasil, homologação marítima ou aquaviária",
      reason:
        "a Resibag NÃO possui essa homologação. Foi removida da base canônica em agosto/2026 depois de constar por engano. Citar isso é alegar certificação inexistente.",
      match: [/normam/, /marinha/, /aquaviari/, /homologacao maritima/],
    },
    {
      term: "ANTT 6.078/2026",
      reason:
        "não se confirma em fonte oficial, mesmo após revalidação completa de compliance (08–09/09/2026). Também não substituiu nem atualizou a 5.998 — são resoluções de assuntos diferentes (Daniel Yano, 29/08/2026). Não citar até existir certificado ou publicação que a sustente. Sobre transporte rodoviário de perigosos, a norma é a ANTT 5998/2022, e ela é obrigação do cliente, não selo da Resibag.",
      match: [/6\.?078/],
    },
    {
      term: '"dupla homologação" ou "tripla homologação"',
      reason:
        "a contagem é UMA: INMETRO. As duas estão erradas — a correção de agosto/2026 trocou \"tripla\" por \"dupla\" sem revalidar o fato, e o valor real é um (validado pelo titular em 08/09/2026). Escreva \"homologação INMETRO\".",
      match: [
        /tripla homologacao/,
        /tres homologacoes/,
        /dupla homologacao/,
        /duas homologacoes/,
      ],
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
      term: "qualquer certificação de produto associada a Filtrante ou Resíduo Verde",
      reason:
        "essas linhas NÃO têm certificação de produto nenhuma. A ISO 9001:2015 é do sistema de gestão da Sanwey e cobre a fabricação — escreva \"fabricado sob SGQ certificado\", nunca \"linha certificada\". Atribuir homologação a elas é erro de compliance.",
    },
    {
      term: "prazo de adequação atribuído à NBR 10.004",
      reason:
        "a NBR 10.004 é norma de CLASSIFICAÇÃO de resíduo e não tem prazo de adequação. O \"prazo até 31/12/2026\" circulou num deck de prospecção e a origem da data ficou como [FALTA DADO] (10/09/2026). Citar sempre a edição :2024.",
      // A primeira versão desta regra casava com QUALQUER menção da norma perto
      // da palavra "prazo" — inclusive com a frase que NEGA o prazo, que é a
      // formulação correta. Falso alarme em peça certa é tão caro quanto silêncio
      // em peça errada: os padrões abaixo exigem a AFIRMAÇÃO do prazo (a data
      // errada, ou "prazo … da NBR"), nunca a menção solta.
      match: [
        /nbr 10\.?004[^.]{0,80}(31\/12\/2026|01\/01\/2027)/,
        /prazo (de )?(transicao|adequacao) da nbr/,
        /nbr 10\.?004:?\s*2004\b/,
      ],
    },
    {
      term: "OCP-0041 apresentado como código INMETRO do produto",
      reason:
        "OCP-0041 é o registro do organismo certificador (ABRACE), acreditado ABNT NBR ISO/IEC 17065. Os códigos do produto são IBC-0136/22 e IBC-0143/25. Cite o OCP separado, como acreditador.",
      // "certificado" casava dentro de "certificadOR", marcando o uso CORRETO
      // ("organismo certificador ABRACE, OCP-0041") como erro. Os padrões abaixo
      // miram a confusão real: o OCP apresentado como código ou homologação.
      match: [
        /codigo[^.]{0,25}ocp.?0041/,
        /homologacao[^.]{0,25}ocp.?0041/,
        /ocp.?0041[^.]{0,25}(inmetro|homologa|do produto)/,
      ],
    },
    {
      term: "nome do organismo certificador da ISO 9001 em peça Resibag",
      reason:
        "está em conflito aberto entre as frentes e aguarda certificado físico conferido (10/09/2026). Escreva \"sistema de gestão da qualidade certificado ISO 9001:2015\", sem nomear o organismo. ESCOPO: esta regra é da frente Resibag — o certificado é da Sanwey, cuja fonte canônica registra o organismo com histórico de correção.",
      match: [/\bsgs\b/, /\bdnv\b/],
    },
    {
      term: '"Ninguém compra big bag. Compra a prova de que o big bag passa na auditoria."',
      reason:
        "a mesma premissa falsa do slogan suspenso, em outra roupagem: sugere que o cliente não tem alternativa homologada. Encontrada abrindo um playbook comercial no Drive em 10/09/2026.",
      match: [/ninguem compra big bag/],
    },
    {
      term: "qualquer telefone ou e-mail fora de (11) 99465-9377 e vendas@resibag.com.br",
      reason:
        "contatos errados já circularam em material antigo. Inclui comercial@resibag.com.br, que apareceu no header do site em auditoria de maio/2026 e não é canônico.",
      match: [/\(?81\)?\s*923.?721.?7839/, /94055.?1389/, /comercial@resibag/],
    },
    {
      term: '"homologação ANTT" ou a ANTT 5998 apresentada como selo da Resibag',
      reason:
        "a ANTT 5998/2022 é a resolução que obriga o CLIENTE a usar embalagem certificada, e é citada como documento normativo dentro dos próprios certificados INMETRO. A Resibag atende à exigência VIA INMETRO. Escreva \"a ANTT 5998/2022 exige\".",
      match: [/homologacao antt/, /homologada pela antt/, /certificacao antt/, /selo antt/],
    },
    {
      term: "ANP associada à Resibag",
      reason:
        "sem lastro conhecido; retirada de todo material da marca em 08/09/2026. Vale para a Resibag — a ANP da Sanwey é outra pergunta, com fonte própria.",
      match: [/\banp\b/],
    },
    {
      term: '"Passaporte de Compliance"',
      reason:
        "conceito retirado em 08/09/2026 — foi construído sobre a alegação de múltiplas homologações, que não existe.",
      match: [/passaporte de compliance/],
    },
    {
      term: '"Gestão inteligente de resíduos industriais" como tagline',
      reason:
        'a tagline perdeu "industriais" em 09/09/2026. O texto canônico é "Gestão inteligente de resíduos."',
      match: [/gestao inteligente de residuos industriais/],
    },
    {
      term: '"Nem todo big bag passa na auditoria. O nosso passa."',
      reason:
        "slogan suspenso em 08/09/2026 por premissa falsa: sugere que o cliente não tem alternativa homologada, e os três concorrentes mapeados têm INMETRO. Homologação é requisito de entrada da categoria, não diferencial.",
      match: [/nem todo big bag passa na auditoria/],
    },
    {
      term: "capacidade homologada fora de 700 kg e 1000 kg",
      reason:
        "são as únicas duas em certificado (IBC-0136/22, 700 kg, Grupo III; IBC-0143/25, 1000 kg, Grupo II). Qualquer outra dimensão é consulta técnica, nunca \"dentro do envelope de compliance INMETRO\".",
      match: [/\b(500|1500|2000)\s*kg/],
    },
    {
      term: "Decreto 12.688/2025 aplicado a resíduo perigoso Classe I",
      reason:
        "é norma de logística reversa de embalagens plásticas pós-consumo e não cobre big bag Standard/Estruturado. Corrigido pelo titular em 09/09/2026: logística reversa em resíduo perigoso Classe I não existe. Existência de norma não é aplicabilidade ao produto.",
      match: [/12\.?688/, /logistica reversa/],
    },
    {
      term: '"único no Brasil", "única fabricante" ou exclusividade de território/persona',
      reason:
        "não se sustenta pelos dados da base — todo concorrente mapeado tem INMETRO, e a linguagem ESG é espaço pouco ocupado, não exclusivo.",
      match: [/unico no brasil/, /unica fabricante/, /unico fabricante/, /exclusividade/],
    },
    {
      term: "tagline institucional (Nível 01/02) na mesma peça que o slogan comercial (Nível 03)",
      reason:
        "os três níveis de mensagem não se misturam: 01 (tagline) e 02 (subtítulo) andam juntos em capa, papelaria e institucional; 03 (slogan) entra sozinho em ads, cold e outreach. Cada um está certo isolado — a peça é que não pode ter os dois. Escolha o registro antes de escrever.",
      // Coocorrência: nenhum lado é proibido sozinho. A tagline antiga entra na
      // busca porque o par vale igual com ela — e ela ainda circula em material
      // que não foi varrido (Notion e Drive seguem com a redação anterior).
      pair: {
        a: [
          /gestao inteligente de residuos/,
          /transformamos a gestao de residuos em eficiencia/,
        ],
        b: [
          /5 tambores parecem mais baratos/,
          /nem todo big bag passa na auditoria/,
        ],
      },
    },
    {
      term: "nome, preço ou cobertura de concorrente (EmbTec, Ágilbag, Engebag)",
      reason: "é inteligência interna, não entra em peça pública.",
      match: [/embtec/, /agilbag/, /engebag/],
    },
  ],
};
