# Fase 3 — bancada e editor no híbrido Wire + Specimen

<!-- TRAVADO em 11/09/2026 pelo Daniel: "quanto ao mockup da fase 3, ok. Aprovado." -->

> **Aprovado.** A bancada e o editor seguem o que está no mockup. As quatro
> perguntas abertas foram aprovadas junto, porque as quatro estão encarnadas
> nele: a casca full-bleed nas superfícies de trabalho, a medida de leitura de
> 680px, o editor dentro da casca, e o painel de custo antes de gastar.
>
> A quinta — a regra de combinação proibida — já tinha sido feita em 10/09, por
> não depender do desenho.
>
> A prancheta de slides continua FORA: é o entregável do cliente, e o tema
> visual dela sai das brand guidelines da marca.

Mockup clicável: `scratchpad/intent-fase3/mockup-trabalho.html`
(5 estados × 2 temas, controle no canto inferior direito).
Capturas a 1900px: `depois/*.png`. O antes: `antes/*.png`.

**Escopo: a bancada (`/esteira`) e o editor (`/editor`).** São as duas
superfícies que a Fase 2 deixou de fora de propósito — "merecem uma fase
própria; misturar as duas coisas é como se decide sem decidir".

---

## O problema, medido

A Fase 2 disse que casca e corpo eram duas linguagens. Nestas duas telas o
problema é maior e tem número.

**1. A bancada está desalinhada da própria casca em 605px.** Medido com o app
rodando (`antes.mjs`): a casca é `medidaClass`, travada em **1280px**; a grade
de três colunas renderiza em **1885px**. A faixa preta da navegação flutua no
meio de uma superfície que passa por baixo dela, e a borda esquerda da faixa
cai a 8px do divisor da primeira coluna — perto o bastante para parecer erro
de alinhamento, longe o bastante para não ser alinhamento.

**2. O editor não é a mesma ferramenta.** Ele não usa a casca: tem cabeçalho
próprio ("Trackforge OS / Editor"), fundo cinza-frio em vez do papel, pílulas
arredondadas, manchete em sans, e um seletor de marca próprio chamado "MARCA"
enquanto a casca inteira chama a mesma coisa de "EDIÇÃO / frente". É **um
terceiro visual**, e ele não foi inventado por esta fase — é anterior às duas
e nunca foi trazido junto.

**3. O meio da bancada é o maior vazio do produto.** Sem artigo, a coluna
central é ~1130 × 990px mostrando duas linhas de texto centralizadas. A maior
área da tela é a que menos diz.

---

## A decisão central: leitura tem medida, trabalho tem painéis

**A resposta da Fase 2 não transfere, e dizer isso é o ponto desta fase.**

A Fase 2 travou a **página** em 1280px e resolveu o desconforto. Aqui isso
tornaria a ferramenta pior: espremer três painéis em 1280px deixa a coluna do
artigo com ~530px, e a bancada existe justamente para ter origem, artigo e
saídas visíveis ao mesmo tempo.

A regra que vale nas duas fases, sem contradizer nenhuma:

> **A medida é da coluna de leitura, não da página.** Num interior de leitura a
> página *é* a coluna, e por isso 1280px funcionou lá e escondeu a distinção.
> Numa superfície de trabalho a página é a folha inteira e quem carrega medida
> é a prosa dentro dela.

Em jornal é a mesma coisa: o masthead atravessa a folha toda; quem tem medida
são as colunas debaixo dele.

Então **a casca passa a ser full-bleed nas superfícies de trabalho** — o
desalinhamento se corrige alargando a casca, não estreitando o trabalho. Faixa,
dateline e masthead passam a nascer e morrer nas mesmas bordas dos painéis.

**A medida de leitura ficou em 680px, e o número foi medido, não escolhido:**
com Geist a 15,5px isso dá **72 caracteres por linha** — dentro da faixa
confortável de 60–75. O `tirar.mjs` imprime a conta a cada captura.

---

## A tradução

| Hoje | Fase 3 | Por quê |
|---|---|---|
| casca em 1280px sobre corpo de 1885px | casca full-bleed, painéis e faixa na mesma borda | a costura some sem estreitar a ferramenta |
| 6 cartões `rounded-lg` de formato | grade de células regradas; marcado = **invertido** | é o componente da home; no híbrido "ativo" é inversão, não preenchimento |
| pílulas de origem (Sinal/Tema/Texto/Arquivo) | abas regradas | é a linguagem da faixa, que fica 40px acima |
| artigo de ponta a ponta na coluna central | coluna de leitura de 680px centrada no painel | 72 caracteres por linha |
| `h1` sans | `h1` **serif** 41px | mesma decisão da Fase 2 |
| editor com casca própria | editor dentro da casca, "Editor" na faixa | um produto, não dois |
| editor chama a frente de "MARCA" | vocabulário da casca (EDIÇÃO / frente) | dois nomes para a mesma coisa é como a frente diverge sem ninguém ver |
| prancheta de slides | **intocada** | é o entregável do cliente, não a nossa casca |

**A prancheta fica fora de propósito.** O tema visual do slide sai das brand
guidelines da marca. No mockup ela aparece como bloco neutro com essa frase
escrita embaixo — inventar uma cor da Resibag para ilustrar seria o mesmo erro
que inventar um número dela.

---

## O que muda de CONTEÚDO, não só de pele

Cinco coisas que a tradução expôs. São as que valem discussão.

### 1. Custo aparece ANTES de gastar, não só depois

A seção 5 diz "custo é visível ou não existe". Hoje o recibo aparece **depois**
que a API cobrou — a tela diz o que você gastou, nunca o que vai gastar.

O painel novo não estima nada, e isso é o ponto:

- **preço de tabela** vem do `MODEL_PRICING` (Sonnet 5: US$ 2,00/milhão entrada,
  US$ 10,00/milhão saída; busca US$ 0,01);
- **a faixa histórica** ("os últimos 6 artigos custaram entre X e Y") vem do
  `costLog`, que já guarda `kind`, `usd` e `at`. É número real, não projeção.
- **sem histórico, a faixa some** e sobra a tabela. Nunca aparece um número
  inventado.

### 2. Sai o botão que diz zero

Hoje o botão desabilitado diz **"Gerar 0 peças"**. Um controle que não se pode
apertar carregando uma instrução é copy fantasiada de controle. Vira a
instrução que já era ("Marque ao menos um formato"), e o botão aparece quando
houver o que apertar.

Isto saiu do gate de contraste, não do gosto: a versão anterior, um botão
desabilitado, media **3,72:1** e reprovava. Escurecer a letra deixaria um
controle falso legível; o certo era ele não ser um controle.

### 3. O vazio do meio passa a carregar o material

Antes de existir artigo, a coluna central mostra o que chegou — o material
recebido, na medida de leitura — e o que escrever vai custar. É o que uma mesa
de redação tem no lugar: a cópia esperando trabalho, não um vão.

### 4. A auditoria não consegue expressar a regra de marca que mais importa

**Este achado saiu do próprio mockup errando, e é o mais sério da fase.**

Escrevendo o mockup usei "Nem todo big bag passa na auditoria" como manchete e
montei uma capa de carrossel com ela ao lado do endosso institucional. Os fatos
canônicos da Resibag proíbem exatamente isso: aquele é o **slogan Nível 03**,
de ads e outreach, e a regra é *"nunca misturar 01/02 com 03 na mesma peça"*.
Corrigi no mockup — mas o erro passou por mim lendo as regras de marca.

Conferido no código, e é estrutural:

- a base em prosa **diz** a regra (`src/knowledge/resibag.ts`, linha 22 —
  *"só ads/outreach, nunca junto da tagline"*);
- a lista `forbidden`, que é o gate determinístico, **não tem regra para ela**;
- e não teria como ter: `findForbidden` roda uma regex por vez contra o texto de
  um bloco e para no primeiro acerto. **Regra de coocorrência — "A e B não podem
  aparecer na mesma peça" — não é expressável ali.**

**RESOLVIDO em 10/09/2026, fora desta fase.** `check.ts` ganhou o campo `pair`
e um segundo passo que avalia no escopo da **peça**, não do bloco. O achado
entra no painel de avisos que já existe, com os dois trechos no mesmo campo —
sem componente novo, portanto sem depender de mockup aprovado. A regra da
Resibag está na base, com 24 casos declarados em `npm run knowledge:coerencia`,
incluindo a capa que este mockup errou.

### 5. O editor e a casca falam da mesma coisa com dois nomes

O editor lê a frente global só uma vez, quando não há rascunho ativo; com
rascunho, quem manda é o rascunho. **Isso é deliberado** — o comentário no
código explica que um carrossel salvo com uma marca não pode trocar de marca
porque a esteira trocou.

O que não é deliberado é o silêncio: o editor não mostra em que frente o resto
do app está, e chama de "MARCA" o que a casca inteira chama de "EDIÇÃO /
frente". Com a casca no editor, os dois passam a aparecer juntos, e a divergência
legítima fica visível em vez de invisível.

---

## Conferido antes de virar código

- **Contraste: 410 medições, 5 telas × 2 temas, todas acima do piso** — corpo
  ≥ 4,5:1, rótulo e ornamento ≥ 3:1. Mesmo medidor de
  `scripts/qa/lib/navegador.mjs` (resolve cor pelo canvas, multiplica `opacity`
  de ancestral).
- **Uma reprovação apareceu e virou decisão de desenho**, não de cor: o botão
  desabilitado a 3,72:1 (item 2 acima).
- **O roteiro se conferiu plantando os dois defeitos que ele deve pegar:** a
  reprovação de contraste saiu sozinha, e um seletor inexistente reprovou em 10
  combinações em vez de passar em silêncio.
- **Zero hex novo.** Todos os tokens são cópia literal de `globals.css`. Dois
  hexes crus que eu tinha escrito foram removidos — inclusive um verde de marca
  que eu havia **inventado** para ilustrar a prancheta.
- **Medida de leitura medida:** 680px = 72 caracteres por linha a 15,5px.
- **Fatos da Resibag conferidos contra a `resibag-canonical-facts` v2.9**, que é
  a fonte única. A primeira versão deste mockup afirmava "INMETRO + ANTT 5998 +
  ANP + ISO 9001:2015" — copiado da base curada do repo, que estava **seis
  versões atrás de uma correção de compliance**. O correto: a Resibag tem UMA
  homologação de produto (INMETRO, dois certificados por capacidade), a ANTT
  5998 é a obrigação do cliente e não selo da marca, a ANP saiu por falta de
  lastro, e a ISO 9001 é do sistema de gestão da Sanwey. Corrigido aqui e na
  base (`src/knowledge/resibag.ts`), em 10/09/2026.
- **O mockup passa no gate da própria ferramenta.** `conformidade.mjs` roda a
  varredura de termo proibido de `check.ts` sobre o texto visível dos cinco
  estados. Fecha o ciclo: a peça de design se submete à mesma regra que o
  produto aplica na peça do cliente.

**O que no mockup é ilustrativo, dito na cara:** as contagens de token
(4.180 / 1.905) e as faixas históricas de custo. Tudo que deriva delas está
aritmeticamente correto contra os preços reais — 4.180 × US$ 2/M = US$ 0,0084,
e assim por diante. Os nomes de formato, os rótulos, as rotas e os fatos são
reais.

---

## O que precisa de decisão sua

1. **Casca full-bleed nas superfícies de trabalho.** É a mudança estrutural.
   Ela cria uma diferença deliberada entre telas de leitura (1280px) e telas de
   trabalho (folha inteira). A alternativa é tudo em 1280px, e a bancada fica
   pior.

2. **A medida de 680px.** 72 caracteres por linha. 620px aperta para ~66,
   740px solta para ~78.

3. **O editor entra na casca.** Ganha masthead, dateline e faixa, e "Editor"
   passa a ser um item de navegação. Custa altura de tela ao editor.

4. **O painel de custo antes de gastar.** Acho que é o item de maior valor real
   aqui e o que mais se aproxima do que a seção 5 já promete. Ele ocupa espaço
   numa tela que hoje não usa o espaço.

5. ~~A regra de combinação proibida.~~ **Feita em 10/09/2026** — não dependia
   do desenho, e era a que protegia contra erro de compliance de verdade.

---

## Se aprovar

A implementação não inventa componente: a grade de células, a lista, o estado
vazio e a coluna de leitura já saíram para `src/components/app/Interior.tsx` na
Fase 2. O que entra novo é o painel de custo prévio (terceira ocorrência do
padrão de recibo, então extração legítima pela seção 7) e a variante full-bleed
da casca.

`docs/ui-diretrizes.md` — que hoje descreve o Clockwork como direção das
superfícies de trabalho — é reescrito ou some, como o próprio arquivo prevê.
Com ele sai a última referência ao Clockwork no repo.
