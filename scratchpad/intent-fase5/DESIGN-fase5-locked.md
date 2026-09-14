# Fase 5 — a régua de plataforma

**Estado: APROVADO 14/09/2026 e IMPLEMENTADO.** Direção aprovada em 13/09,
mockup aprovado em 14/09. Escrito depois da análise do moda.app.

---

## 0. Primeiro: não entreguei o que prometi

Ofereci "levantar os limites reais das duas plataformas, **conferidos na
documentação delas, com data**". Não consegui, e o motivo não é de esforço.

Este contêiner sai para a internet por um proxy com política de saída, e a
política nega estes três hosts:

```
www.linkedin.com:443          403 ao CONNECT — policy denial
developers.facebook.com:443   403 ao CONNECT — policy denial
help.instagram.com:443        403 ao CONNECT — policy denial
```

Conferido duas vezes, em horários diferentes, e lido no relatório do próprio
proxy (`recentRelayFailures`, `kind: connect_rejected`). Não é rede instável —
é negação de política, e não há contorno legítimo daqui.

O que **funcionou** foi a busca. E busca devolve **resumo de página que eu não
pude abrir**. Pela régua deste repositório isso é `secundaria` na melhor das
hipóteses, e a seção 14 é explícita: *"limite de API… se confere antes de
afirmar, e a origem da conferência entra junto"*. Os números abaixo estão aqui
porque são úteis para decidir, **não porque estão conferidos**:

| O que a busca devolveu | Estado |
|---|---|
| Post do LinkedIn: ~3.000 caracteres | `nao-verificado` |
| Legenda do Instagram: ~2.200 caracteres | `nao-verificado` |
| Instagram: até 30 hashtags | `nao-verificado` |
| O "ver mais": ~210 desktop / ~140 celular | `nao-verificado` **e contestado** |
| O "ver mais": ~360 / ~280 / ~210 | `nao-verificado` **e contestado** |

Nenhum desses números deve entrar no código como fato antes de você decidir de
onde eles vêm. É a mesma disciplina que fez a ANTT 6.078/2026 sair da base.

---

## 1. O achado que muda o desenho: o "ver mais" não pode ser um número

Mesmo com a documentação aberta na minha frente, o corte não viraria uma
constante. Quatro razões, e as quatro são independentes:

1. **São dois orçamentos ao mesmo tempo.** Existe um teto de caracteres **e** um
   teto de linhas (~3). Vale o que acabar primeiro — um gancho de 180
   caracteres com duas quebras de linha corta antes de um de 200 sem nenhuma.
2. **Quebra de linha conta**, e o modelo escreve quebras.
3. **Varia por aparelho, largura de janela e versão do app.** O mesmo texto
   corta em lugar diferente no seu celular e no monitor de 1900px.
4. **Nenhuma das duas documenta o corte**, e as duas o mudam sem avisar.

Portanto: uma constante `CORTE = 210` seria um número inventado com cara de
medido — exatamente a classe de erro que esta ferramenta existe para impedir.
É a mesma forma do `1,04:1` do KPI e do `.stage{display:flex}`: passa em tudo
e está errado em silêncio.

---

## 2. O achado que eu não estava procurando: isto já acontece hoje

Procurando onde a régua encaixaria, encontrei que **o repositório já embarca
número de plataforma sem procedência nenhuma, e ele já vai para o modelo.**

`src/types/outputs.ts:104` — `HOOK_TARGET`:

```ts
export const HOOK_TARGET = {
  "post-texto": 220,
  legenda: 150,
  reels: 160,
  stories: 180,
} as const;
```

Quatro números, sem fonte, sem data, sem `checkedAt`. Escritos em 03/09/2026
(`5b72b2a`). E eles **não ficam parados**: `src/lib/prompts.ts` os interpola
direto na instrução — *"a primeira linha, em até 150 caracteres"*.

Três linhas acima, no mesmo arquivo, um comentário afirma comportamento de
plataforma como se fosse fato apurado:

> *"no LinkedIn o corte vem depois de três linhas, no Instagram depois de uma,
> no Reels o primeiro segundo decide"*

Compare com os dois vizinhos imediatos deste código:

- `MODEL_PRICING` cita a tabela da Anthropic **com URL e data** (29/08/2026), e
  o `satisfies` quebra o build se faltar linha.
- `facts/*.json` carrega `tier`, `source`, `checkedAt`, `checkedBy` e `notes`
  por afirmação — 9 fatos da Resibag, cada um com a procedência ao lado.

**Número de plataforma é a única categoria de número desta ferramenta que
escapou da disciplina que ela aplica a todo o resto.** A régua não é
funcionalidade nova. É fechar esse buraco.

Ressalva honesta: 220/150/160/180 são **alvo editorial**, não limite de
plataforma — 220 não é o teto do LinkedIn (que é ~3.000). Isso não os salva:
o 150 da legenda é claramente um palpite sobre o "ver mais", e ninguém sabe
dizer de onde veio.

---

## 3. A proposta

### 3.1 Separar o contador da régua — é a decisão central

**Contador**: quantos caracteres a peça tem. Mede o **nosso próprio texto**.
Não precisa de fonte, não pode estar errado, custa zero em procedência.

**Régua**: o número da plataforma com que se compara. É **fato**, e fato tem
tier.

As duas coisas foram juntas na minha cabeça no começo, e separá-las resolve o
problema inteiro. O contador entra **hoje**, inteiro, sem depender de fonte
nenhuma. A régua entra quando tiver lastro — e, enquanto não tiver, o contador
mostra o número **sozinho**, sem barra, sem vermelho, sem "faltam X".

É literalmente a regra da seção 2 aplicada a outro assunto: `nao-verificado` dá
contexto, nunca vira o número que decide.

### 3.2 A tabela declarada

`src/constants/plataformas.ts`, no molde de `facts/*.json` — não um molde novo:

```ts
{
  id: "linkedin-post-max",
  limite: 3000,
  unidade: "caracteres",
  tier: "nao-verificado",          // primaria só com a doc aberta
  source: "",
  checkedAt: "",
  checkedBy: "",
  revalidateBy: "2027-03-13",      // plataforma muda; fato de marca não
  notes: "Número de busca, página não aberta — proxy nega linkedin.com."
}
```

`revalidateBy` é o campo que `facts/*.json` não tem e aqui é obrigatório:
certificado INMETRO vence numa data conhecida; limite de plataforma apodrece
sem avisar ninguém.

### 3.3 Mede e mostra, nunca bloqueia

Já é a decisão registrada em `outputs.ts:97` e ela foi cara: exigir `maxLength`
na volta transformava um gancho doze caracteres mais longo na **perda do lote
pago inteiro**. A régua não repete isso. Ela é irmã do recibo de custo e do
piso de contraste: torna visível, quem decide é você.

### 3.4 O corte, que é o caso difícil

Três estados, e o terceiro é o que torna a coisa honesta:

- **Régua `primaria` e dentro da validade** → marca o ponto e diz de onde veio.
- **Régua `nao-verificado`** → só o contador, e a palavra **"sem lastro"** na
  cara. Não um número cinza, não um "≈". Sem lastro.
- **Régua ausente** → contador sozinho, sem opinião.

E, para o corte especificamente, o desenho honesto **não é um ponto, é uma
faixa**, porque o item 1 desta seção diz que ele não é um ponto. Faixa com o
aviso dos dois orçamentos — caracteres **e** três linhas, vale o que acabar
primeiro.

### 3.5 Contar em UTF-16, e não "consertar" isso depois

`"texto".length` em JS conta unidades UTF-16 — que é **exatamente** o que as
plataformas contam. Um emoji custa de 2 a 8. Alguém vai olhar isso um dia e
"corrigir" para `[...str].length`; ficaria errado nos dois sentidos, e errado
em silêncio, do jeito que este repositório já conhece. Fica o comentário no
código dizendo isto, pela seção 10.

---

## 4. O que só você pode dar

**Meça o corte uma vez, na sua conta.** Um post de tamanho conhecido, aberto no
celular e no desktop, e onde apareceu o "ver mais". Isso entra como `interna`
com data — e vale **mais** que qualquer blog, porque é a plataforma respondendo
sobre a sua conta, não um artigo de 2024 sobre a de outra pessoa. É o mesmo
movimento que subiria o fato do IBC para `primaria` com o PDF do INMETRO.

Os tetos duros (3.000 / 2.200 / 30 hashtags) você abre em trinta segundos na
sua máquina, que não tem proxy nenhum. Cole o número e a URL, e eles entram
`primaria`.

---

## 5. Ordem sugerida

1. **Contador, agora.** Não depende de fonte nenhuma. Antes precisa de mockup
   aprovado — é mudança de aparência (seção 4), e a régua vive dentro do editor
   e da bancada, superfícies de trabalho, direção da Fase 3.
2. **`plataformas.ts` com a tabela vazia** e o comportamento "sem lastro" pronto.
3. **Você preenche**, e cada linha que ganha fonte acende sozinha.
4. **`npm run qa:plataformas`** — não como gate de limite, mas para reprovar
   limite `primaria` com `revalidateBy` vencido. Igual ao drift da seção 9: o
   aviso não some, ele aparece.

E `HOOK_TARGET` sai de `outputs.ts` para `plataformas.ts` no passo 2, com os
quatro números marcados `nao-verificado` até alguém dizer de onde vieram. Eles
continuam indo para o prompt — tirá-los agora pioraria a peça sem melhorar
nada. O que muda é que param de parecer apurados.

---

## 6. O que fica de fora, de propósito

- **Bloquear geração por tamanho.** Nunca. Ver 3.3.
- **Cortar ou truncar texto automaticamente.** A peça é sua para colar e
  ajustar.
- **Prometer previsão de alcance, de engajamento ou de "melhor horário".**
  Nada disso tem fonte primária, e esta ferramenta existe para não publicar
  número que ninguém sustenta.

---

# Parte 2 — o mockup (14/09/2026)

Daniel aprovou a direção e pediu o mockup. `mockup-contador.html`, quatro
estados clicáveis, os dois temas. **340 medições de contraste, todas acima do
piso, nos dois temas** (`contraste.mjs`). Capturas a 1900px em `capturas/`.

## Onde o contador mora — e não é onde eu tinha imaginado

No **cartão de peça da bancada** (`OutputPieces.tsx`), entre o corpo do texto e
os botões. Não no composer: lá o texto é o material de entrada, não o post.

E ele tem uma âncora que dispensa qualquer interpretação: **conta exatamente o
que o botão “Copiar texto” põe na área de transferência** — o retorno de
`toPlainText(kind, data)`, o mesmo string, nem uma letra a mais. Não é uma
estimativa da peça; é a peça.

## O que descobri conferindo: o contador só serve para DOIS dos seis formatos

`toPlainText` monta o Reels assim:

```
GANCHO: Seu resíduo saiu do portão…
[4s] O caminhão leva o resíduo…
   na tela: A RESPONSABILIDADE NÃO EMBARCA
```

Esse `GANCHO:` e esse `[4s]` nunca vão para lugar nenhum — é roteiro de vídeo,
para uma pessoa ler e gravar. Contar isso contra um limite de legenda seria
medir a coisa errada e o número pareceria certo. Stories, a mesma coisa. Os
dois carrosséis também ficam de fora: slide não é caractere de post.

**Sobram post de texto e legenda.** Isso reduz a fase e é bom: menos superfície,
e a que sobra é a que de fato tem régua.

## E os formatos NÃO são editáveis aqui

Conferido: `OutputPieces.tsx` não tem `contentEditable`, `<textarea>` nem
`onChange` — as cinco peças não-carrossel são leitura pura e vão para o CRM como
saíram. O contador, então, **informa mas não conserta**: ele diz que o post
passou do corte, e o ajuste acontece depois, no LinkedIn.

Isso não invalida a fase — saber antes de colar já é o ganho —, mas é honesto
dizer que a próxima pergunta natural ("e se eu quiser encurtar aqui?") é outra
fase, com editor de texto e regeneração. Não entra nesta.

## A decisão de desenho: o corte é FAIXA, não tique

`.barra .faixa` é hachurada e tem duas bordas, porque o "ver mais" não é um
ponto. Dois orçamentos ao mesmo tempo — caracteres **e** ~3 linhas, vale o que
acabar primeiro —, e nenhuma das duas plataformas documenta onde ele cai. Um
tique único seria número inventado com cara de medido.

**A faixa nasce das duas medições do Daniel**: celular numa borda, computador na
outra. É literalmente por isso que preciso das duas, e não de uma.

## O que a captura mostrou e eu não tinha previsto

Na barra, a faixa do corte fica **nos primeiros 7%**. Um post cabe em 3.000
caracteres e só uns 200 aparecem antes do "ver mais".

Ou seja: **o limite quase nunca é o número interessante.** Ninguém esbarra em
3.000. O que decide se o post funciona são os primeiros ~200 caracteres, e é
essa a informação que o contador existe para dar. O teto entra junto porque é
barato, não porque importa.

Isso reordena a prioridade do que pedir ao Daniel: **a medição do corte vale
mais que os tetos duros.** Os tetos são conforto; o corte é o produto.

## Selo `SEM LASTRO`

Borda tracejada, `warn` sobre `warn-bg` — 6,12:1 no claro, 8,01:1 no escuro.
Tracejada de propósito: o que falta é a **fonte**, não a correção. Usar `urgent`
diria "está errado", e não está — ninguém conferiu, que é diferente.

## Fora do escopo, registrado

Contador no composer (mede a entrada, não a saída) · encurtar ou cortar texto
automaticamente · qualquer previsão de alcance, engajamento ou "melhor horário".

---

# Parte 3 — o que foi implementado (14/09/2026)

| Arquivo | O que é |
|---|---|
| `src/constants/plataformas.ts` | a tabela declarada: `LIMITES`, `CORTES`, `temLastro`, `contar`, `KINDS_COM_REGUA` — e `HOOK_TARGET`, que veio de `outputs.ts` |
| `src/components/app/ContadorPlataforma.tsx` | o contador, com os três comportamentos: conta, diz "sem lastro", ou sai de cena |
| `src/components/app/OutputPieces.tsx` | uma linha: o contador entre o corpo da peça e os avisos |
| `scripts/qa/contador.mjs` | `npm run qa:contador` — 4 verificações |

## O estado em que a ferramenta entrou no ar

As duas linhas de `LIMITES` estão `nao-verificado`, e `CORTES` está **vazio**.
Na tela isso é o selo SEM LASTRO e a frase "nenhum limite com fonte conferida
para este formato". **Nenhum número de plataforma aparece.** É o combinado.

## O portão é diferente do de fato normativo, de propósito

`isPublishable` exige `primaria` porque fato vira afirmação pública numa peça.
`temLastro` aceita `primaria` **ou** `interna`, porque limite de plataforma não
vai para peça nenhuma — é instrumento de medida na tela do Daniel. E para o
CORTE, `interna` (ele medindo na conta dele) é literalmente a melhor evidência
que existe: ninguém documenta onde o "ver mais" cai.

## Conferido na tela, não no typecheck

`npm run qa:contador`, com o app de pé e as rotas interceptadas:

```
post de texto: selo 'sem lastro' presente ✓
nenhum limite vazou para a tela sem fonte ✓
conta confere com o que o botão copia: 181 caracteres ✓
reels: diz 'sem régua' e não conta ✓
```

A terceira é a que importa mais: o roteiro **clica no botão "Copiar texto", lê a
área de transferência e compara com o número da tela**. Recalcular a conta dentro
do teste provaria que duas contas minhas batem, não que a tela conta certo.

**Plantado de volta, reprova** — as duas vezes:

- portão do lastro desligado → 3 reprovações, entre elas *"apareceu um LIMITE na
  tela com a régua ainda `nao-verificado`"* e *"a tela diz 3000 caracteres e o
  botão copiou 181"*;
- `reels` acrescentado a `KINDS_COM_REGUA` → 2 reprovações.

## Três defeitos do próprio roteiro, que valem como regra

Os três davam reprovação com o produto funcionando — é a classe de erro que faz
perder tarde consertando o que não está quebrado.

1. **Fixture inventado.** O artigo forjado tinha `blocks`; o tipo tem
   `sections`. A tela estourou em `article.sections is not iterable`. Depois,
   sem `suggestedOutputs`, em `.find of undefined` — campos com `.default([])`
   no schema, que uma resposta real nunca deixa faltar e uma forjada deixa.
2. **Locator por ancestral de DOM.** `filter({hasText}).last()` casou com um
   contêiner que continha OS DOIS cartões. Fatiar o texto da página pelos
   títulos é menos esperto e não mente.
3. **`indexOf` onde precisava de `lastIndexOf`.** Cada título aparece duas vezes
   — na grade de formatos e no cartão da peça. Buscar do começo fatiava a grade.

## O que continua faltando, e só o Daniel pode dar

1. **Medir o corte** num post longo dele: copiar o pedaço visível antes do "ver
   mais", no celular e no computador. Vira `CORTES` com `tier: "interna"`.
2. **Os tetos duros**, abertos na máquina dele: número + URL → `tier: "primaria"`.

Até lá o selo SEM LASTRO fica na tela, que é o comportamento certo.
