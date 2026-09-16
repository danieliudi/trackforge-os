# Fase 6 — os oito temas de marca contra o manual de cada uma

**Estado: PROPOSTA, aguardando aprovação.** Nada implementado — `themes.ts`
continua como está. Escrito em 16/09/2026.

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

### A decisão do `sanwey-industrial`

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
quatro temas Sanwey ainda se justificam. Me diga qual dos dois.

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

## Depois de aprovado

1. `themes.ts` recebe os oito temas
2. As quatro linhas de `DIVIDA_DECLARADA` no `check-paleta.mjs` **somem** — e o
   gate reprova sozinho se alguma sobreviver ao motivo
3. Curar `paleta-sanwey.json` e estender o gate à Sanwey (hoje ele só olha
   `resibag*`)
4. `npm run qa:rotas` e captura do editor, porque muda o que a tela mostra
