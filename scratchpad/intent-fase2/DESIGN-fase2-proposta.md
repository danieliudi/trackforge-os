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

## O que eu NÃO decidi sozinho

- **Manchete em serif.** É a mudança mais visível e a mais discutível. Em sans
  fica mais perto do que está no ar hoje; em serif fica mais perto do masthead.
- **A coluna "nunca conferido".** Ela expõe que a base quase não foi conferida.
  Isso é verdade e eu acho que precisa aparecer, mas é decisão sua.
- **Bancada e editor fora da fase.** Se você quiser tudo de uma vez, o mockup
  precisa de mais duas telas antes de qualquer código.

## Se aprovar

A implementação não inventa componente: a grade de células, a lista e o estado
vazio já existem em `src/app/page.tsx` e saem de lá para
`src/components/app/`, na terceira ocorrência — que é exatamente a regra da
seção 7. `KpiCard` do Clockwork sai das quatro telas; `docs/ui-diretrizes.md`
é reescrito ou some, como o próprio arquivo já prevê.
