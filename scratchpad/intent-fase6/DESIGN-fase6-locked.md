# Fase 6 — os oito temas de marca contra o manual de cada uma

**Estado: APROVADO e IMPLEMENTADO em 16/09/2026.** Os oito temas estão em
`src/constants/themes.ts`. O registro do que a implementação encontrou depois da
aprovação está no fim, em "O que a implementação achou".

Mock: `mockup-temas.html` (dois estados, Resibag e Sanwey · antes × depois por
tema). Capturas a 1900px em `capturas/`.

---

## O que motivou

O gate de cor morta (§17) mostrou que os quatro temas Resibag estavam na paleta
**v9** — cinco versões atrás. Ao curar a paleta da Sanwey para estender o gate,
apareceu que ela também tem deriva, de outro tipo.

**80 medições de contraste no mockup renderizado: 5 reprovações no que está no
ar, zero no proposto.**

## As cinco reprovações que estão no ar agora

| Tema | O quê | Razão | |
|---|---|---|---|
| `sanwey-impacto` | acento `#8B1419` sobre o vermelho | **1,66:1** | invisível — e é cor que o manual não tem |
| `sanwey-industrial` | bloco vermelho sobre cinza-700 | **1,33:1** | o CTA não se acha no fundo |
| `sanwey` | meta `#8A8680` sobre a superfície | **3,44:1** | abaixo de AA, e é cinza QUENTE onde o manual crava K puro |
| `resibag-ativo` | kicker `#3AAF65` | **2,64:1** | — |
| `resibag-ativo` | CTA `#3AAF65` com texto claro | **2,64:1** | — |

O `1,66:1` é da mesma família do KPI a 1,04:1 de 08/09: cor escolhida por
aparência, nunca medida, e invisível sem ninguém notar.

## Resibag — o que muda

Toda cor sai da `resibag-brand-guidelines` v11. **A `Legenda` usa o valor da
v11.1 (`#646A63`)**, porque o da v11.0 reprova nas Camadas 2 e 3 — é a correção
que ainda não propagou, e desenhar contra um valor sabidamente errado seria
embutir o defeito.

| Tema | A decisão |
|---|---|
| `resibag` | Off-White v11 no lugar do papel v9. Tinta no título, Legenda no meta, Verde Sólido no acento |
| `resibag-escuro` | a hierarquia de fundo escuro da v11 é literal: branco no título, `#CFE8D9` no corpo. Verde Vivo vira **bloco** com Tinta em cima |
| `resibag-ativo` | o CTA persistente é Verde Vivo preenchido, sempre com Tinta. O `#3AAF65` v9 saía com texto claro, que a v11 proíbe |
| `resibag-selo` | o ouro era o Certification Gold, morto na v11. A instrução dela é textual: **badge de certificação vira Ocean sólido**. Borda em Ice |

## Sanwey — o que muda, e uma decisão que é sua

**A Sanwey está melhor que a Resibag.** Os 13 pares de contraste do manual dela
conferem **todos** na segunda casa decimal — recalculados aqui, um a um. Nenhum
erro, nem conservador. (A v11 da Resibag tinha um.)

O que deriva são os temas da ferramenta, não o manual:

| Tema | A decisão |
|---|---|
| `sanwey` | `#8A8680` e `#E5E0DA` são cinzas **quentes**, e o manual crava *"nunca introduzir cinza azulado; a rampa é puro K"*. Viram gray-600 e gray-300 |
| `sanwey-impacto` | `#8B1419` não existe no manual e dá 1,66:1. Preto Premium no lugar — 3,47 como bloco, branco em cima a 19,80 |
| `sanwey-preto` | o manual **recomenda** Vermelho Sinal em fundo escuro: o base dá 3,47 e reprova corpo, o Sinal dá 4,59. E o muted quente vira gray-400, o caption sobre preto do próprio manual |
| `sanwey-industrial` | **é a mudança forte, e precisa da sua palavra** — ver abaixo |

### A decisão do `sanwey-industrial` — decidida: gray-100

Hoje o fundo é cinza-700 `#545454`. Dois problemas:

1. Na rampa do manual, gray-700 tem o papel **"texto secundário"** — não é uma
   superfície.
2. **Nenhum acento lê em cima dele.** O bloco vermelho dá 1,33:1; o Vermelho
   Sinal, 1,76:1. O tema fica sem CTA visível.

A proposta troca para **gray-100 `#F2F2F2`**, que o manual chama de *"superfície
elevada"* — papel que existe, e que mantém a distinção contra o institucional
(gray-50). O tema deixa de ser escuro.

**Se você quiser que ele continue escuro**, o caminho dentro do manual é Preto
Premium — mas aí ele encosta no `sanwey-preto`, e a pergunta passa a ser se
quatro temas Sanwey ainda se justificam.

**Resolvido em 16/09/2026:** gray-100, a recomendação acima. Se um dia a decisão
mudar, o tema volta a ser escuro trocando `background`, `foreground`, `muted` e
`surface` — e o `darkSurface` dele volta a `{}`.

### Pares que o manual não listou

O manual da Sanwey é explícito: *"combinação ausente desta tabela não foi
aprovada e não deve ser usada."* Estes eu **calculei e proponho**, não usei
calado:

| Par | Razão | |
|---|---|---|
| gray-700 sobre gray-100 (meta do industrial) | 6,76:1 | AA |
| Vermelho sobre gray-100 (kicker do industrial) | 5,10:1 | AA |
| Vermelho Tint sobre o vermelho (meta do impacto) | 4,88:1 | AA |
| Preto Premium sobre o vermelho (bloco do impacto) | 3,47:1 | bloco, não texto |

O par gray-700 × superfície **já é validado** a 7,19 — usá-lo invertido é a
mesma razão medida, então não conta como novo.

## Um erro meu que a medição pegou

A primeira versão deste mockup tinha **três reprovações no "depois"**, e duas
eram eu violando a regra que documentei duas horas antes: pus o kicker na cor do
acento, e quando o acento é Verde Vivo — que a v11 define como **só fundo** —
ele virou texto a 2,71 e 2,27.

**Regra derivada:** kicker tem cor PRÓPRIA no tema, nunca "a mesma do acento".
Reaproveitar quebra sempre que o acento é cor-de-preenchimento, e são
justamente essas que os manuais marcam como perigosas. Está no `spec.json`
como campo separado.

A terceira era gray-600 sobre gray-100 a 4,42 — o manual validou o 600 sobre
gray-50, e sobre a superfície elevada ele cai abaixo de AA.

## Depois de aprovado — feito, 16/09/2026

1. ✅ `themes.ts` recebeu os oito temas
2. ✅ As quatro linhas de `DIVIDA_DECLARADA` sumiram; o gate passa com zero
3. ✅ `paleta-sanwey.json` curada (4 mortas, 17 autorizadas) e o gate estendido,
   com a regra do **puro K** (`R=G=B`) que o manual da Sanwey crava
4. ✅ `npm run qa` inteiro verde, agora com um roteiro a mais

---

## O que a implementação achou

A aprovação cobria as cores. A implementação achou **quatro coisas** que o
mockup não tinha como mostrar, porque mockup é bloco de cor e produto é slide.

### 1. O `kick` não tinha onde morar — e essa era a correção do mockup

O `spec.json` trazia `kick` como campo separado, e o `DESIGN` explicava por quê:
*"kicker tem cor PRÓPRIA no tema, nunca a mesma do acento"*. Ao trazer o mockup
para o código vieram só os campos que **já existiam** em `themes.ts`, e o `kick`
ficou de fora — a correção sumiu na tradução.

Resultado: `theme.accent` continuava pintando TEXTO em três lugares (o número do
`data_metric`, a atribuição da citação e a etiqueta vazada do cabeçalho). No
`resibag-ativo` isso punha o **"38%"** a **2,27:1**.

O campo existe agora e chama `accentInk`. É obrigatório no tipo, então formato
novo não consegue esquecer dele. Virou a **seção 18 do `CLAUDE.md`**.

### 2. O roteiro que pegou isso — e o alvo que ele errou primeiro

`npm run qa:temas` mede os oito temas no `/slides-preview`, que renderiza a mesma
amostra em todos sem gastar a chave da Anthropic.

A primeira versão media `"p"`, e `"p"` é a manchete de 187px, a atribuição em
caixa alta e o corpo de 34px ao mesmo tempo — três papéis num número só, com
quatro reprovações que eram o **seletor**, não o produto. É a armadilha que a
seção 12 descreve. Os alvos agora são declarados por papel (`data-papel`), com a
contagem esperada de cada um: 3 manchetes, 1 métrica, 4 corpos e 9 etiquetas por
tema. **136 medições, todas no piso.**

Conferido plantando os dois defeitos que ele deve pegar: o número voltando a ler
`theme.accent` reprova nomeando o tema, a razão e o texto (`"38%"`); um papel
renomeado no produto reprova por contagem, em vez de medir menos calado.

### 3. Slide com foto de fundo ficou FORA da medição, declarado

Ali o fundo real é a foto coberta por um gradiente preto que é **irmão** do
texto, não ancestral — e o medidor sobe por ancestrais. Ele mediria contra o
`theme.background`, uma cor que naquele slide ninguém vê. Está escrito no
roteiro, com o que se perde e o que não se perde.

### 4. E o que sobrou disso, quem achou foi a captura de tela

Dois defeitos ficaram justamente nos slides que a varredura não olha:

- **`sanwey-industrial`** virou tema CLARO nesta fase, e ficaram para trás
  `surface: "dark"` (que escolhe a versão do logo — invertido sobre fundo claro)
  e `darkSurface: {}` (título quase-preto sobre a foto já escurecida). Defeito
  **desta fase**, corrigido: o tema agora é `light` e herda os tokens escuros do
  `sanwey`, porque o manual tem UMA paleta de fundo escuro e nela o vermelho de
  texto é o Sinal, não o base.
- **`sanwey-impacto`** perdia a atribuição da citação — Preto Premium sobre
  gradiente preto. Defeito **anterior** à fase (o `#8B1419` sumia igual).
  Sobre foto o vermelho volta como preenchimento e a letra de acento vira branco.

Os dois estão nas capturas de `capturas/real/`.

### Um número que ficou no piso de rótulo, e você pode querer mexer

`sanwey-impacto` é o único tema que não limpa 4,5 no acento: Preto Premium sobre
o vermelho dá **3,47:1**, que passa como rótulo e como texto grande, e é o valor
que o mockup aprovado já trazia. Vale para o `"38%"` e para a atribuição.

Se preferir folga, o caminho dentro do manual é branco (5,71) — mas aí o número
fica da mesma cor da manchete, e o tema perde a distinção. Ficou como aprovado;
é trocar uma linha se quiser o outro.
