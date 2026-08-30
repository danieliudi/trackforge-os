import type { BrandKnowledge } from "./types";

/**
 * Fatos Sanwey — cópia curada de `sanwey-canonical-facts` v1.5, alinhada ao
 * Manual de Identidade Visual v7.0b (agosto/2026).
 *
 * Fora daqui de propósito: design system (é outra disciplina), protocolo de
 * versionamento (é processo interno) e contato pessoal do Daniel (não tem por
 * que sair numa peça pública).
 */
export const sanweyKnowledge: BrandKnowledge = {
  facts: `## Identidade
- Sanwey Indústria de Containers Ltda. — registro em dezembro/1983, operação desde 1984.
- Sede: Rua Raphael de Marco, 201/227 · Taboão da Serra/SP · CEP 06765-350.
- 42 anos de mercado. O aniversário vira em 1º de maio; só passa a 43 depois de dezembro/2026.
- Fundada por Noritaka Yano. O nome vem de "Sun Way" — caminho do sol, caminhos iluminados.
- Grafia: Sanwey e Sanbag, sempre assim em texto corrido.
- Contato: +55 (11) 4788-1755 · vendas@sanwey.com.br · www.sanwey.com.br

## Frases oficiais (verbatim — parafrasear é erro de marca)
- Tagline: **"A marca que valoriza o seu produto."** Assina capa, banner, papelaria, header.
- Sub-tagline, só em contexto de legado: "Sanwey preserva o presente para o futuro."
- Apoio: "Pioneirismo e Qualidade, sempre foram os destaques da Sanwey." · "A solução em Sanbag." · "A embalagem certa para cada carga." · "Seu processo não é padrão. Sua embalagem também não deveria ser." · "Fabricados sob encomenda, adaptados às necessidades de cada cliente."

Uma peça carrega uma tagline só — nunca empilhar a oficial com a sub-tagline. A tagline é afirmação, não dado: em peça com espaço, acompanhe de uma linha de prova (certificação, marco datado, especificação).

## Certificações
Escopo, código e data estão no bloco FATOS NORMATIVOS, cada um com sua fonte.
Certificação aqui é barreira de entrada, não compliance passivo.

## Marcos documentados (use com o ano)
- 1983 — registro da Sanwey, primeiro protótipo Sanbag, capacidade de 500 bags/mês.
- 1984 — 1º fabricante **mundial** a produzir alças com o mesmo tecido do contentor; 1º brasileiro a exportar contentor flexível.
- 1986 — Sanbag de PP para silício metálico; Prêmio Iman de Qualidade.
- 1988 — Sanbag porta-ensacado, 1.500 kg de dióxido de manganês (Vale do Rio Doce).
- 1989 — 1º brasileiro a exportar para os EUA.
- 1990 — 1º **mundial** a fazer ensaio de envelhecimento de PP na Amazônia.
- 1996 — 1º brasileiro homologado pelo Ministério da Marinha para transporte marítimo de perigosos.
- 1999 — 1º brasileiro certificado ISO 9001 pela DNV no setor.
- 2008 — 1º a homologar contentor flexível para perigosos no INMETRO.
- 2011 — lançamento do Resibag; Sanbag Liner Modulado.
- 2018 — Sanbag Atmosfera Controlada.
- 2022 — inauguração da terceira filial.
- 2024 — Sanbag Alça-Guia e One Loop com homologação de carga perigosa.

Só dois marcos são mundiais: alças com o mesmo tecido (1984) e ensaio de envelhecimento na Amazônia (1990). O resto é pioneirismo brasileiro — não promova um ao outro.

## Portfólio Sanbag (15 modelos — selecione 3 a 5 por peça, nunca liste todos)
Alça Guia · Lacrado · Quadrado · Retangular · Liner Aluminizado · Standard Plano · Standard Tubular · Reutilizável Lavável · Poliéster · Type C Condutivo · Type B · Atmosfera Modificada · Arejado · Homologado Perigosos · Térmico.

## Segmentos
- **Alimentício** — Lacrado, Liner Aluminizado, Atmosfera Modificada, Térmico, Reutilizável Lavável. Argumento: BPF e assepsia documentadas.
- **Mineração** — Poliéster, Standard Tubular. Argumento: fator de segurança 8:1 para granulado pesado.
- **Químico / petroquímica** — Type C Condutivo, Type B. Argumento: ANP, engenharia de processo.
- **Armazenagem e logística** — Alça Guia, Standard Plano/Tubular. Argumento: customização e rastreabilidade.
- **Agronegócio** — Quadrado, Retangular, Poliéster. Argumento: projeto por briefing técnico.
- **Resíduo perigoso** — é território da Resibag, marca independente com endosso Sanwey. Não posicione Sanbag nesse segmento.

## Argumentos fixos
- Diferencial central: engenharia aplicada por carga, não catálogo.
- Tempo: "42 anos de pioneirismo documentado" — nunca "décadas de experiência".
- Exportação: 1º brasileiro a exportar (1984), 1º para os EUA (1989), presença em quase todos os continentes.
- Modelo: "Enquanto concorrentes vendem catálogo, a Sanwey diagnostica a operação e projeta a embalagem."
- Precificação por valor — engenharia e conformidade. Nunca por quilo.

## Para quem se escreve
- **Suprimentos / Procurement** — TCO, SLA, conformidade documental, prazo.
- **EHS / engenheiro de processo** — certificação, fator de segurança, rastreabilidade, norma.
- **Diretor de logística** — OTD, custo por operação, substituição de tambor por big bag.
- **CFO** — ROI, exposição a multa, LTV do contrato.
- **CEO / board** — ESG, risco regulatório, vantagem competitiva da certificação.

## Vocabulário
Use: contentor flexível · semi-granel · pioneirismo documentado · fabricado sob encomenda · homologação INMETRO / Res. ANTT · logística multimodal · envelhecimento em intempéries · projeto sob briefing técnico · barreira normativa · 42 anos documentados.
Evite: saco genérico · granel (o termo é semi-granel) · empresa inovadora · personalizável · transporte em geral · durabilidade testada · "temos certificado".`,

  forbidden: [
    {
      term: "FSSC 22000",
      reason:
        "obtida em 2018, não é mais certificação ativa. Não pode aparecer nem como vigente, nem como \"seguimos as práticas de\". O argumento correto para alimentício é BPF e assepsia documentadas.",
      match: [/fssc/],
    },
    {
      term: '"soluções personalizadas"',
      reason: "genérico e sem substância técnica; use engenharia aplicada por carga.",
      match: [/solucoes personalizadas/],
    },
    {
      term: '"embalagens para todo tipo de carga"',
      reason: "sem qualificação, contradiz o posicionamento de projeto por briefing.",
      match: [/todo tipo de carga/],
    },
    {
      term: '"maior fabricante", "melhor do mercado" ou líder de mercado',
      reason: "não é verificável.",
      match: [/maior fabricante/, /melhor do mercado/, /lider de mercado/],
    },
    {
      term: '"décadas de experiência"',
      reason: 'o número é preciso e é o argumento: 42 anos documentados.',
      match: [/decadas de experiencia/],
    },
    {
      term: '"Uma empresa Sanwey"',
      reason: 'o endosso correto é "Uma marca Sanwey".',
      match: [/uma empresa sanwey/],
    },
    {
      term: "Sanbag posicionado para resíduo perigoso",
      reason: "esse segmento é da Resibag, marca independente do grupo.",
    },
    {
      term: "preço por quilo",
      reason: "a precificação é por valor: engenharia e conformidade.",
      match: [/preco por quilo/, /precificacao por quilo/, /preco por kg/],
    },
  ],
};
