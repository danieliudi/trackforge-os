# Fase 2 — interiores no híbrido Wire + Specimen

<!-- PROPOSTA, não travada. Aguardando o Daniel. -->

Mockup clicável: `scratchpad/intent-fase2/mockup-interiores.html`
(5 telas × 2 temas, controle no canto inferior direito).
Capturas a 1900px: `depois-t-*.png`. O antes: `antes-*.png`.

Escopo: **Peças, Fatos, Custos, Instalação.** A bancada (`/artigo`, `/esteira`)
e o editor ficam de fora — são superfícies de trabalho de três colunas e canvas,
e merecem uma fase própria; misturar as duas coisas é como se decide sem decidir.

## O problema, em uma frase

A casca é plana, regrada e editorial; o corpo é um dashboard de cartões
arredondados flutuando em branco. São duas linguagens, e a costura aparece na
primeira dobra da tela.

## A tradução

| Hoje (Clockwork) | Fase 2 (Wire + Specimen) | Por quê |
|---|---|---|
| 4 cartões `rounded-lg` com sombra, um preenchido de laranja | grade de 4 células com 1px de regra, ativa **invertida** | é o componente que a home já usa; na casca Wire a urgência é o ponto e a inversão, não o preenchimento |
| `h1` sans 24px | `h1` **serif** 34px | a manchete da seção é manchete de edição, não título de cartão |
| linhas em cartões brancos com botão "Abrir na bancada" repetido | linha inteira é o alvo, ação uma vez à direita | a lista da home já funciona assim; repetir o botão a 1250px do olho é affordance duplicada |
| `border-radius` em tudo | zero raio no corpo | o mock aprovado não tem raio em nenhum elemento de corpo |
| branco `surface` flutuando sobre papel | `cell` sobre `rule` | some a metáfora de cartão; fica a folha |

## O que muda de CONTEÚDO, não só de pele

Três coisas que a tradução visual expôs. São as que valem discussão.

**1. Fatos — o nível de proveniência sai da direita.** Hoje o selo fica na ponta
oposta ao texto, a mais de mil pixels de onde a leitura termina, e as dezoito
linhas ficam com a mesma cor e o mesmo peso. O nível é o que decide se um fato
pode virar número numa peça (seção 2 do `CLAUDE.md`) — então passa a ser a
primeira coisa lida, na coluna da esquerda, com barra e cor por nível:
`primária` verde, `secundária` neutra, `não verificado` urgente.

**2. Fatos — entra a coluna de conferência.** `checkedAt` e `revalidateBy` já
existem em `src/knowledge/provenance.ts` e a tela nunca mostrou. Conferido na
curadoria de hoje: **1 fato de 19 da Resibag tem `checkedAt`**. A coluna diria
"nunca conferido" em 18 linhas — e essa repetição é a informação, não ruído: é o
que justifica a fila existir. Se incomodar, o remédio é conferir fato, não
esconder a coluna.

**3. Instalação — a ausência passa a contar.** Hoje a tela lista variáveis sem
dizer o que a falta custa. A grade ganha "faltando" como célula invertida, e a
linha do `APP_PASSWORD` diz o que acontece sem ela — que é a diferença entre
`localhost` e uma URL pública aberta. O valor continua **nunca** aparecendo.

## Conferido antes de virar código

- **Contraste:** 136 medições, 5 telas × 2 temas, todas acima do piso — corpo
  ≥ 4,5:1, rótulo e ornamento ≥ 3:1. Medido sobre o mockup com o mesmo medidor
  de `scripts/qa/lib/navegador.mjs`.
- **Uma reprovação apareceu e foi corrigida no mockup:** o valor da geração que
  falhou em `urgent` dava 4,26:1 sobre a célula. Virou barra à esquerda com a
  letra em `ink`, que é a regra da seção 4 — cor da paleta que não passa como
  letra vira preenchimento ou borda.
- **Zero hex novo.** Todos os tokens do mockup são cópia literal dos de
  `src/app/globals.css`. Se uma cor não está lá, não entra.
- **Nenhum número inventado.** Tudo veio do app rodando com dado semeado. Foi o
  erro que a Fase 1 quase cometeu com as contagens ilustrativas do mock.

## Correção de conforto (08/09/2026) — v2 no mockup

O Daniel olhou a primeira versão e disse: *"está muito largo, não sei explicar,
e algumas fontes estão muito pequenas."* Os dois sintomas eram **um defeito só**,
e meu:

**O mock aprovado da Fase 1 desenha cada tela num artboard de ~468px** (três
frames dentro de um wrap de 1480px). Copiei os valores em pixel dele — 8,5px,
9px, 10px, linha de ponta a ponta — direto para uma tela de 1900px. Quatro vezes
maior. Num artboard de 468px a linha cheia é uma medida confortável e 9px parece
um rótulo normal; a 1900px a linha tem 1900px e a letra tem metade do tamanho.

É a **segunda vez**: na Fase 1 o glifo de 78px do mock se perdeu pelo mesmo
motivo. Virou regra no `CLAUDE.md` seção 4 — mock é proporção, nunca pixel.

O mockup tem o botão **v1 / v2** para comparar lado a lado. O que muda no v2:

| | v1 | v2 |
|---|---|---|
| Largura do conteúdo | ponta a ponta (1900px) | coluna de **1280px**, casca alinhada à mesma borda |
| Menor fonte | 8,5px | **10,5px** (piso de 11px para rótulo e meta) |
| Corpo de leitura | 13px | **15,5px** |
| Manchete | 34px | **41px** |
| Valor da célula | 28px | **37px** |
| Altura da célula | 78px | **104px** |
| Linha da lista | 9px de respiro | **14px** |

Três defeitos apareceram ao aplicar a medida e foram corrigidos: o fundo da
grade vazava para fora da coluna (virou largura própria em vez de padding), o
fundo das listas fazia o mesmo, e `sugestões · não virou peça` quebrava em três
linhas numa coluna de 104px.

Contraste refeito depois de tudo: **136 medições, 5 telas × 2 temas, todas acima
do piso.**

## Correção de tipografia (08/09/2026) — v3 no mockup

O Daniel: *"melhorou, mas ainda acho que tem fontes que parecem não combinar
entre elas."* Auditado, e eram **três defeitos somados**:

**1. O mockup mentia sobre as fontes.** Ele usava Georgia + Helvetica Neue. O
app não carrega nenhuma das duas: roda **Geist** e **Geist Mono**. Comparar um
mockup nessas contra uma casca que ele conhece em Geist já produz sozinho a
sensação de que não combinam. O mockup agora carrega as fontes reais.

**2. `--font-serif` NÃO EXISTE — e isso é defeito de código, não de mockup.**
O `globals.css` define só `--font-sans` e `--font-mono`. O `font-serif` do
masthead cai em `ui-serif`, o serif genérico do sistema — **fonte diferente em
cada computador, nunca escolhida por ninguém**. Enquanto isso o `layout.tsx`
carrega **Instrument Serif** e nunca o liga a nada. Medido no app rodando:

    --font-sans  = "Geist"                      ✓ ligado
    --font-mono  = "Geist Mono"                 ✓ ligado
    --font-serif = ui-serif, Georgia, …         ✗ fallback genérico
    --font-instrument-serif = "Instrument Serif"  carregado, nunca usado

Some disso: **Instrument Serif só existe no peso 400** (o 700 nem responde no
Google Fonts) e o masthead pede `font-extrabold`. Ligar sem mais nada daria
negrito sintético — a letra engorda por deformação, não por desenho, que é
das coisas que mais fazem uma fonte parecer estranha ao lado das outras. Na v3
o masthead vai a 400 e o peso vem do tamanho, como pede um display serif.

**3. Mono fazia NOVE trabalhos, seis deles com palavras humanas.** Auditado
papel por papel: linha de prova, rótulo de bloco, nível de proveniência,
"nunca conferido", tipo do custo e estado da variável — nenhum é código nem
número. E o mesmo papel visual (rótulo pequeno em caixa alta) saía em mono em
seis lugares e em sans no rótulo da célula. **Duas fontes fazendo o mesmo
trabalho na mesma tela** é o que o olho acusa antes de a cabeça saber dizer o
quê.

A regra da v3, uma só:

| Fonte | Significa | Onde |
|---|---|---|
| **Serif** | manchete | masthead, `h1`, manchete de vazio — nada mais |
| **Mono** | o que a máquina escreveu, ou o que alinha em coluna | id de fato, nome de variável, dinheiro no extrato, índice |
| **Sans** | todo o resto, **inclusive todo rótulo em caixa alta** | frases, títulos, rótulos, estados |

O número do KPI fica em sans e o dinheiro do extrato em mono **de propósito**:
um é figura de display, o outro é coluna que alinha dígito com dígito. É a
mesma regra, não exceção.

Contraste refeito: **136 medições, 5 telas × 2 temas, todas acima do piso.**

## O que eu NÃO decidi sozinho

- **Manchete em serif.** É a mudança mais visível e a mais discutível. Em sans
  fica mais perto do que está no ar hoje; em serif fica mais perto do masthead.
- **A coluna "nunca conferido".** Ela expõe que a base quase não foi conferida.
  Isso é verdade e eu acho que precisa aparecer, mas é decisão sua.
- **O serif.** Instrument Serif a 400 é o que está carregado e é uma escolha
  editorial defensável, mas nunca foi decidido por ninguém — se você preferir
  outro, é trocar uma linha. O que NÃO pode continuar é `ui-serif`.
- **A medida de 1280px.** É o número que resolveu o desconforto aqui, mas é
  ajustável: 1180 aperta mais, 1400 solta. O botão v1/v2 mostra os extremos.
- **Bancada e editor fora da fase.** Se você quiser tudo de uma vez, o mockup
  precisa de mais duas telas antes de qualquer código.

## Se aprovar

A implementação não inventa componente: a grade de células, a lista e o estado
vazio já existem em `src/app/page.tsx` e saem de lá para
`src/components/app/`, na terceira ocorrência — que é exatamente a regra da
seção 7. `KpiCard` do Clockwork sai das quatro telas; `docs/ui-diretrizes.md`
é reescrito ou some, como o próprio arquivo já prevê.
