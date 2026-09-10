import type { BrandKnowledge } from "./types";

/**
 * Fatos Sanwey — cópia curada de `sanwey-canonical-facts` v1.6, alinhada ao
 * Manual de Identidade Visual v7.0b (setembro/2026).
 *
 * Fora daqui de propósito: design system (é outra disciplina), protocolo de
 * versionamento (é processo interno) e contato pessoal do Daniel (não tem por
 * que sair numa peça pública).
 *
 * REVISADO À MÃO da v1.5 para a v1.6 em 10/09/2026. O que mudou:
 *
 *   · A tagline única virou SISTEMA DE QUATRO CAMADAS. A frase que existia
 *     estava fazendo assinatura, posicionamento, prova e argumento setorial ao
 *     mesmo tempo. C1 fecha, C2 abre, C3 prova, C4 traduz por vertical.
 *   · "A marca que valoriza o seu produto." continua verbatim, mas SAI do hero,
 *     da capa e do headline de estande — é assinatura, e assinatura fecha.
 *   · Nasceu a C2: "A carga define o projeto." O sujeito é a carga do cliente,
 *     não a marca, e é falseável contra fato existente.
 *   · A IDADE DA EMPRESA foi rebaixada de prova padrão para uso institucional.
 *     Prova passa a ser marco datado, porque número que se reescreve todo ano
 *     não acumula memória.
 *   · Duas frases de apoio foram APOSENTADAS e viraram proibição, e uma trocou
 *     "embalagem" por "contentor" — "embalagem" convida à precificação por
 *     quilo, que o posicionamento proíbe.
 *
 * ISOLAMENTO CONFERIDO. A ANP e a homologação do Ministério da Marinha (1996)
 * são da SANWEY e continuam válidas aqui. A correção que tirou as duas da
 * Resibag em 08/09/2026 é de escopo Resibag — não vaza para cá, e o que existe
 * aqui não volta para lá. Resibag é pessoa jurídica independente.
 */
export const sanweyKnowledge: BrandKnowledge = {
  facts: `## Identidade
- Sanwey Indústria de Containers Ltda. — registro em dezembro/1983, operação desde 1984.
- Sede: Rua Raphael de Marco, 201/227 · Taboão da Serra/SP · CEP 06765-350.
- 42 anos de mercado. O aniversário vira em 1º de maio; só passa a 43 depois de dezembro/2026.
- Fundada por Noritaka Yano. O nome vem de "Sun Way" — caminho do sol, caminhos iluminados.
- Grafia: Sanwey e Sanbag, sempre assim em texto corrido.
- Contato: +55 (11) 4788-1755 · vendas@sanwey.com.br · www.sanwey.com.br

## Frases oficiais — quatro camadas (verbatim; parafrasear é erro de marca)
Cada camada tem função e superfície próprias. Nunca substituir uma pela outra.

- **C1 · assinatura** — "A marca que valoriza o seu produto." FECHA a comunicação:
  lockup, rodapé, papelaria, cartão, assinatura de e-mail. Não abre peça.
- **C2 · posicionamento** — "A carga define o projeto." ABRE: hero, capa de deck,
  headline de estande, capa de folder, título de campanha. Variante curta, para
  espaço reduzido: "Engenharia por carga."
- **C3 · prova** — marco datado, escolhido pelo contexto, adjacente à C2. Nunca
  publicar C2 sem C3 em peça com espaço.
- **C4 · vertical** — uma linha por segmento, sempre com a C3 do segmento.

Provas disponíveis (C3), por contexto:
- institucional/home — "ISO 9001:2015 (DNV) ininterrupta desde 1999."
- exportação — "Primeiro fabricante brasileiro a exportar contentores flexíveis. 1984."
- perigosos/O&G — "Primeiro a homologar contentores flexíveis para perigosos no INMETRO. 2008."
- engenharia — "Primeiro fabricante mundial a produzir alças no mesmo tecido do contentor. 1984."
- durabilidade — "Primeiro fabricante mundial a realizar ensaios de envelhecimento de PP na Amazônia. 1990."
- aniversário — "42 anos de pioneirismo documentado no setor de contentores flexíveis de semi-granel."

**A idade da empresa é prova de peça institucional, não prova padrão.** Marco
datado é permanente e se verifica sozinho; número de idade se reescreve todo ano.

Linhas por vertical (C4):
- Mineração — "Fator de segurança 8:1 para granulado abrasivo."
- Químico/Petroquímica/O&G — "Type-C condutivo com certificação ANP."
- Agrobusiness — "Projeto por briefing técnico. Açúcar, grãos, fertilizantes."
- Armazenagem/Logística — "Empilhamento sem operador em altura."
- Alimentício — **[FALTA DADO]**. "BPF e assepsia documentadas" é verdadeiro e
  fraco demais para carregar a página sozinho. Não escrever página de segmento
  Alimentício até esta linha fechar.

Sub-tagline, só em contexto de legado: "Sanwey preserva o presente para o futuro."
Peça de aniversário, linha do tempo, seção de herança, origem do nome.

Frases de apoio ativas:
- "O contentor certo para cada carga." — página de produto e técnico.
- "Seu processo não é padrão. Sua embalagem também não deveria ser." — headline
  da página de customização. Aqui "embalagem" fica de propósito: a palavra é o
  objeto da comparação com o processo do cliente, não a categoria da Sanwey.
- "Fabricados sob encomenda, adaptados às necessidades de cada cliente." — apoio
  institucional, nunca headline.
- "Pioneirismo e Qualidade, sempre foram os destaques da Sanwey." — **só acervo e
  legado**, fora de site e material comercial.

**Uma linha por superfície.** O único empilhamento permitido é C2 + C3.

## Certificações
Escopo, código e data estão no bloco FATOS NORMATIVOS, cada um com sua fonte.
Certificação aqui é barreira de entrada, não compliance passivo.

A ANP e a homologação do Ministério da Marinha (1996) são da **Sanwey**. Não
confundir com a Resibag, que é pessoa jurídica independente e não detém
nenhuma das duas.

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
- Tempo: "42 anos de pioneirismo documentado" — número exato, sempre, e como prova de peça institucional. Em peça comercial a prova é marco datado.
- Customização: projeto livre sobre 15 modelos base, sem restrição regulatória na linha Sanbag standard.
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
Use: contentor flexível · semi-granel · pioneirismo documentado · fabricado sob encomenda · homologação INMETRO / Res. ANTT · logística multimodal · envelhecimento em intempéries · projeto sob briefing técnico · barreira normativa · 42 anos documentados · marco datado como prova.
Evite: saco genérico · granel (o termo é semi-granel) · empresa inovadora · personalizável · transporte em geral · durabilidade testada · "temos certificado" · idade da empresa como prova padrão.
Em LINHA DE MARCA a categoria é "contentor", não "embalagem". A precificação da Sanwey é por valor — engenharia e conformidade — e a escolha da palavra sustenta isso.`,

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
      term: '"A embalagem certa para cada carga."',
      reason:
        'aposentada em setembro/2026 e substituída por "O contentor certo para cada carga." — em linha de marca a categoria é contentor, porque "embalagem" convida à precificação por quilo, que o posicionamento proíbe.',
      match: [/a embalagem certa para cada carga/],
    },
    {
      term: '"A solução em Sanbag."',
      reason:
        "aposentada em setembro/2026 — não diz nada que o nome do produto já não diga.",
      match: [/a solucao em sanbag/],
    },
    {
      term: "assinatura (C1) empilhada com a linha de posicionamento (C2) na mesma peça",
      reason:
        'as duas camadas têm funções opostas: "A marca que valoriza o seu produto." FECHA a comunicação — lockup, rodapé, papelaria — e "A carga define o projeto." ABRE. Assinatura em hero gasta a superfície mais valiosa da peça com a frase menos falseável do sistema, reivindicável por qualquer concorrente. Uma linha por superfície; o único empilhamento permitido é C2 + C3.',
      pair: {
        a: [/a marca que valoriza o seu produto/],
        b: [/a carga define o projeto/, /engenharia por carga/],
      },
    },
    {
      term: "tagline oficial empilhada com a sub-tagline de legado",
      reason:
        '"Sanwey preserva o presente para o futuro." foi rebaixada a sub-tagline em agosto/2026 e vale só em contexto de legado — aniversário, linha do tempo, origem do nome. Uma peça carrega uma tagline só.',
      pair: {
        a: [/a marca que valoriza o seu produto/],
        b: [/sanwey preserva o presente para o futuro/],
      },
    },
    {
      term: "idade da empresa usada como prova em peça comercial",
      reason:
        "número que se reescreve todo ano não acumula memória. Em peça comercial a prova é marco datado — 1984 exportação, 1984 alças, 1990 Amazônia, 1999 ISO, 2008 INMETRO. Os 42 anos ficam para peça institucional.",
    },
    {
      term: "página ou peça de segmento Alimentício com argumento fechado",
      reason:
        'a linha da vertical está EM ABERTO desde a saída da FSSC 22000: "BPF e assepsia documentadas" é verdadeiro e fraco demais para carregar a página sozinho. Falta o complemento operacional. Marque [FALTA DADO] em vez de inventar diferencial.',
    },
    {
      term: "preço por quilo",
      reason: "a precificação é por valor: engenharia e conformidade.",
      match: [/preco por quilo/, /precificacao por quilo/, /preco por kg/],
    },
  ],
};
