# Varredura em navegador

Os roteiros que valem a pena rodar de novo. Antes eles moravam em
`scratchpad/`, e uma pasta com esse nome ninguém trata como suíte — é por isso
que a seção 12 do `CLAUDE.md` mandou trazê-los para cá.

| Roteiro | O que prova | Comando |
|---|---|---|
| `rotas.mjs` | as 11 telas renderizam **a tela certa**, no monitor e no celular | `npm run qa:rotas` |
| `contraste.mjs` | os pares declarados passam o piso nos **dois** temas | `npm run qa:contraste` |
| `interacao.mjs` | frente, tema, prioridade e herança de chave **respondem** | `npm run qa:interacao` |
| todos | os três em sequência, parando no primeiro que reprovar | `npm run qa` |

O app precisa estar de pé (`npm run dev`). Nenhum roteiro gasta a chave da
Anthropic: toda rota de API é interceptada.

## Playwright fica fora das dependências

Ele baixa navegador — centenas de MB por máquina, em todo `npm install`, para
uma ferramenta que roda em fim de entrega e em auditoria. Quem só quer subir o
app não deveria pagar esse download. Instale sob demanda:

```sh
npm i -g playwright && npx playwright install chromium
```

`lib/navegador.mjs` procura o Playwright no projeto e nas instalações globais
mais comuns. Se não achar, imprime a linha acima em vez de estourar com
"Cannot find module". Caminho fixo de sandbox (`/opt/pw-browsers/...`) não vale:
suíte que só roda numa máquina não é suíte.

## A armadilha desta ferramenta: `APP_PASSWORD`

`src/proxy.ts` põe senha na frente de tudo quando `APP_PASSWORD` está definida —
inclusive das rotas de API, que é o ponto. Varredura rodando com a variável
ligada e sem a senha reportaria **11 rotas limpas que são 11 telas de bloqueio**.

Por isso cada rota declara uma `marca`: um texto que só existe se a tela certa
renderizou. **Medido**, não suposto — com `APP_PASSWORD` ligada e sem senha, as
22 combinações reprovaram; com `QA_SENHA` na mesma instância, as 22 passaram.

Varredura que passa sem provar que renderizou a tela certa vale menos que nada,
porque dá sensação de cobertura.

## Variáveis

| Variável | Para quê |
|---|---|
| `QA_BASE` | onde o app está (padrão `http://localhost:3000`) |
| `QA_SENHA` | a senha do `proxy.ts`, para varrer uma instância publicada |

`QA_SENHA` existe para o dia em que a ferramenta estiver no ar — que é
justamente onde a variável está definida e onde auditar importa mais. Só o nome
sai em log, nunca o valor.

## Por que os pares de contraste são declarados

Numa única sessão, três seletores improvisados casaram com o elemento errado:
`button[aria-pressed=true]` pegou o botão da frente no masthead em vez da célula
da grade; `nav a:not([aria-current])` pegou o sinal da faixa em vez de um item de
seção; e a leitura crua da cor tratou `oklab(… / .7)` como se fosse RGB. Dois
alarmes falsos e — pior — um deles escondeu uma reprovação real de 1,17:1.

Então: alvo declarado, contagem esperada declarada, e o relatório imprime o
**texto que mediu**. Seletor que deixa de casar é reprovação, não silêncio —
alvo que some do relatório é cobertura que evaporou sem ninguém notar.

Há **uma** isenção, e ela continua sendo medida e impressa: o glifo `0` em
repouso, a 30% de opacidade. É decoração redundante — a manchete logo abaixo diz
a mesma coisa em palavras a 14,86:1. Se um dia esse glifo passar a contar algo
que a frase não diz, a isenção morre junto.

## Quando rodar

O gate da seção 11 (lint no `prebuild`) roda sozinho em todo build. Isto aqui é
para **fim de entrega que mexeu em mais de uma tela** e para rodada de
auditoria. Não entra no `prebuild`: depende do app de pé e de um Playwright que
o projeto de propósito não instala.
