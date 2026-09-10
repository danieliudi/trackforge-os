@AGENTS.md

# trackforge-os — padrão de consistência

<!-- O repo se chamava `carousel-builder` e foi renomeado.

     As chaves de localStorage JÁ MIGRARAM para o prefixo `trackforge`
     (03/09/2026). A troca não é direta: `src/lib/localKeys.ts` lê a chave nova,
     cai para a antiga e promove o valor na primeira leitura; escreve só na
     nova; e NUNCA apaga a antiga, que fica como retrato congelado. Trocar o
     prefixo sem isso apagaria rascunho, peça produzida e log de custo de quem
     já usa — a mesma classe do bug em que as peças sumiram. O script de tema em
     `layout.tsx` lê as duas à mão, porque roda antes de qualquer bundle.

     O nome antigo CONTINUA em dois lugares, de propósito: o `name` do
     package.json (identificador de pacote, amarrado ao lock) e o campo `origem`
     em `src/lib/crm.ts`, por onde o gateway do CRM reconhece o que veio desta
     ferramenta. Trocar qualquer um dos dois quebra coisa de verdade. -->


Carregado automaticamente em toda sessão do Claude Code neste repo. Existe pelo
mesmo motivo do arquivo equivalente do `sanwey-gestão`: evitar que cada sessão
redescubra o projeto do zero e reconstrua parecido em vez de reaproveitar — e,
aqui, evitar algo mais caro que retrabalho, que é **a ferramenta publicar um
número que ninguém pode sustentar**.

Duas categorias: **reaproveitamento obrigatório** (nunca reimplemente o que já
existe) e **processo** (mockup → implementação → conferência) para o que é
genuinamente novo.

> **Este arquivo é a fonte.** O mesmo contrato existe em `.cursor/rules/*.mdc`,
> recortado por escopo porque o Cursor carrega regra por glob em vez de um
> arquivo só. **Mudou uma regra aqui, mude lá também** — e vice-versa. Se os
> dois discordarem, este vence e o outro é o que está errado.
>
> Depois de mexer em qualquer um dos dois, rode **`npm run doc:check`**: ele
> confere caminho citado, espelho nos dois sentidos, glob morto e as contagens.
> Não é gate — avisa e sai com 1, mas fica fora do `prebuild` (seção 0).
>
> O mapa: `00-nucleo` (fato, segredo, mockup, pronto, entrega, mais 0, 14 e 15)
> ↔ seções 0, 2, 3, 4, 8, 10, 14 e 15 · `10-reuso` ↔ 1 e 7 · `20-telas` ↔ 4
> mais a linha de cor/tema da 1 · `30-react` ↔ 6 · `40-api-e-custo` ↔ 3, 5 e 13
> · `50-conhecimento` ↔ 9 · `60-qa` ↔ 11 e 12.
>
> A seção 13 (segurança) foi para `40-api-e-custo` e não para o núcleo, embora
> a sugestão original fosse o núcleo: ela dispara em arquivos nomeáveis — rota
> que gasta, `src/lib/crm.ts`, `proxy.ts` — e no Cursor isso é glob, que carrega a
> regra na hora certa sem pesar em todo pedido.
>
> `70-quando-passar-pro-claude` **não espelha seção nenhuma daqui, de propósito**:
> ela diz ao Cursor quando parar e passar a tarefa para o Claude Code, e só faz
> sentido do lado de lá. É a única regra sem contraparte — se aparecer outra,
> provavelmente é conteúdo que deveria estar neste arquivo também.

---

## 0. Onde está o mapa da ferramenta (este arquivo não é ele)

Este arquivo é **como construir**. Ele não descreve nenhuma funcionalidade, de
propósito. **O que existe mora em `docs/mapa-funcional.md`** — escrito em
08/09/2026, e antes dele o buraco era real: numa análise externa em 03/09 foi
preciso varrer o código inteiro para responder o que cada tela faz, porque
nenhuma das 11 páginas tinha comentário de propósito e o `README` descreve o
produto, não a superfície.

O mapa cobre, com tudo conferido no código e não lembrado:

- **As 11 páginas** — para que cada uma serve, o que precisa estar funcionando
  para ela render, e o que ela deliberadamente não faz. Duas delas (`/artigo` e
  `/esteira/avulso`) são redirecionamentos, não telas.
- **As 14 rotas de API**, separadas em três grupos: as sete que **gastam
  dinheiro** por chamada, as duas que gastam cota do Unsplash, e as cinco que
  não gastam nada.
- **A camada `src/knowledge`** — quantos fatos por frente, quantos em cada
  nível de proveniência, e o que `checkedAt` diz sobre eles.
- **A fronteira com o CRM** — o que o papel `agencia` lê, o que fica no
  `payload` de propósito, e o que atravessa para o entregável.
- **As variáveis de ambiente** e o que quebra sem cada uma, espelhando o
  `.env.example`.

**A regra: leia de lá, não repita conteúdo aqui.** Se mexer em página, rota de
API, camada de conhecimento ou no pacote que vai ao CRM, atualize o mapa e rode
`npm run doc:check` — ele recalcula as contagens a partir do código e falha
apontando a divergência. Fica **fora** do `prebuild` de propósito: documento
defasado não deve travar deploy.

O `doc:check` confere também todo caminho citado nos documentos de regra, o
espelho CLAUDE.md ↔ `.cursor/rules` nos dois sentidos, e os globs de cada regra.

**O que o mapa achou ao ser escrito:** o `.env.example` não documentava
`APP_PASSWORD` nem `UNSPLASH_ACCESS_KEY`, embora o código leia as duas — e a
primeira é a que separa `localhost` de uma URL pública aberta. Corrigido no
mesmo commit. Escrever o mapa pagou por si na primeira hora.

As contagens desta seção são conferidas pelo `npm run doc:check`, que as
recalcula a partir do código. Em 07/09/2026 ele pegou a primeira deriva sozinho:
o texto trazia as contagens de 03/09 e o repo já tinha ganhado
`/esteira/instalacao` e `api/instalacao`.

---

## 1. Reaproveitamento obrigatório — nunca reimplemente do zero

Confirmado por grep de uso real em 02/09/2026 (número = arquivos que importam).
Se o que você precisa está aqui, **importe — não copie o padrão nem reescreva
parecido**.

| Item | Arquivo | Uso real |
|---|---|---|
| Cor: tokens semânticos (`canvas`, `surface`, `line`, `ink`, `mut`, `acc`, `ok`, `warn`, `danger`) | `src/app/globals.css` (bloco `@theme` + os dois blocos escuros) | toda a UI — nunca escreva hex nem escala do Tailwind (`zinc-200`, `white`) num arquivo de tela. Claro e escuro são o MESMO conjunto de nomes com valores diferentes; escrever cor à mão numa tela quebra o modo escuro sem ninguém perceber |
| Tema claro/escuro (`sistema` / `claro` / `escuro`) | `src/lib/theme.ts` + o script inline em `src/app/layout.tsx` | o atributo `data-tema` no `<html>` é a fonte da verdade. O script roda ANTES da primeira pintura: sem ele a tela nasce clara e pisca para escura em toda navegação |
| Tokens de classe da UI (`focusRing`, `labelClass`, `fieldClass`, `panelClass`, `metaClass`) | `src/lib/ui.ts` | 29 arquivos — nunca monte painel ou campo na mão |
| Botão e botão-de-ícone (variantes, tamanhos, `loading`) | `src/components/ui/Button.tsx` | 13 arquivos — `IconButton` exige `label` (nome acessível) |
| Casca do app: barra, frente ativa, seções | `src/components/app/EsteiraShell.tsx` | 5 telas — toda tela nova dentro da esteira nasce aqui, não com layout próprio |
| KPI / gráfico / lista do padrão Situação | `src/components/dashboard/*` | painel e telas que reusam a densidade aprovada |
| Direção da casca e da home | `scratchpad/intent-fase1/DESIGN-hibrido-locked.md` | híbrido Wire + Specimen, travado 07/09/2026 |
| Direção dos interiores de leitura | `scratchpad/intent-fase2/DESIGN-fase2-locked.md` | mesma direção, aprovada 08/09/2026 — medida, escala e papel de fonte |
| Diretrizes visuais das superfícies de TRABALHO | `docs/ui-diretrizes.md` | bancada e editor, até a fase delas |
| Frente ativa como store global | `src/lib/front.ts` | via `useFront()` do shell. É global de propósito: estar no painel da Resibag lendo fato da Sanwey é a classe de bug que isto previne |
| Renderização de peça por formato + `toPlainText` | `src/components/app/OutputPieces.tsx` | 2 telas — Reels mostra tempo, Stories mostra telas; não renderize formato novo como parágrafo genérico |
| Recibo de custo | `src/components/app/CostReceipt.tsx` | 3 telas |
| Parecer da auditoria | `src/components/app/VerificationPanel.tsx` | 3 telas |
| Busca de imagem (Unsplash + biblioteca da frente) | `src/components/carousel/ImageSearchPanel.tsx` | 2 telas — devolve `PickedImage` com crédito, não só URL |
| Preâmbulo do brief (URL, sinais do CRM, notícia) | `src/lib/brief.ts` | 3 rotas — artigo, avulso e carrossel partem do MESMO preâmbulo |
| Auditoria de afirmações | `src/lib/verify.ts` | 8 arquivos |
| Varredura de termo proibido | `src/knowledge/check.ts` | 9 arquivos |
| Preço por modelo e `priceUsage` | `src/constants/pricing.ts` | 17 arquivos |
| Marcas, tagline canônica, política de logo | `src/constants/brands.ts` | 29 arquivos |
| Formatos de saída: `OUTPUT_META`, `OUTPUT_SCHEMAS`, `outputBlocks`, `isCarousel` | `src/types/outputs.ts` | 9 arquivos |
| Log de custo (`entryFromCost`, `pushCostEntry`, `formatCost`) | `src/lib/costLog.ts` | 9 arquivos — assinatura é `entryFromCost(cost, kind, title, failed?)` |
| Rascunhos em localStorage | `src/lib/storage.ts` | 5 arquivos |
| Erro de API legível na tela (`readError`) e corpo do pedido nas rotas (`jsonBody`) | `src/lib/apiError.ts` | a bancada e as 11 rotas — nunca faça `new Error(data.error)` com o corpo cru, nem `await request.json()` fora de um `try` |
| Chave de localStorage com herança da chave antiga (`readLocal`, `writeLocal`) | `src/lib/localKeys.ts` | os 5 stores — nenhum outro arquivo chama `localStorage` direto, e o prefixo mora só aqui |

**Token que embute cor não se sobrescreve somando outra classe.** `panelClass`
carrega `bg-surface` e `labelClass` carrega `text-mut`. Escrever
`clsx(panelClass, urgente && "bg-acc")` deixa DUAS utilidades da mesma
propriedade na lista, e quem vence é a **ordem do CSS gerado, não a da string**:
o Tailwind emite por ordem alfabética do token, então `bg-acc` sai antes de
`bg-surface` e perde. Escolha a cor uma vez, com ternário —
`urgente ? "…bg-acc" : panelClass`. Para rótulo existe `labelShapeClass` (a
forma sem cor).

Descoberto em 08/09/2026, e custou caro: o cartão de KPI urgente da tela de
Fatos **nunca tinha ficado laranja**. No tema claro passava despercebido
(quase-preto sobre branco é legível); no escuro era `#1c1c1b` sobre `#201f1d` —
**1,04:1**, o número mais importante da tela apagado, e o rótulo dele a 1,79:1.
Nada disso quebra typecheck nem lint. Mesma família do `.stage{display:flex}`
vencendo o `hidden` (seção 8): regra de CSS que ganha em silêncio, visível só
quando alguém mede a tela pintada. Hoje `npm run qa:rotas` detecta a colisão e
falha nomeando as duas cores — conferido plantando a colisão de volta.

**Achatar peça em blocos numerados é `outputBlocks`, sempre.** É o que a
auditoria consome, o que o pacote do CRM carrega e o que qualquer formato novo
precisa implementar. Escrever um segundo achatamento é como a rota de publish
quebrou quando Reels e Stories nasceram (corrigido em `c90bfca`).

**`isCarousel` é predicado de tipo, não `boolean`** — para o compilador estreitar
`kind` nos dois ramos. Sem isso, formato novo passa batido numa afirmação de tipo
manual.

## 2. Fato e proveniência — a razão de esta ferramenta existir

Isto não é preferência de estilo. É o requisito do produto.

- **Número, percentual, prazo, data e norma só saem se vierem da base de fatos
  ou do material recebido.** Se falta o dado que a frase pediria, a frase sai
  sem ele. Não estimar, não arredondar de cabeça, não usar "cerca de" para
  disfarçar chute.
- **Só fonte primária vira citação.** Os níveis são `primaria` / `secundaria` /
  `interna` / `nao-verificado` (`src/knowledge/`). Secundária e interna dão
  contexto, nunca viram o número no slide.
- **Peça derivada não inventa fora da origem.** O artigo é a fonte factual das
  peças curtas; material colado é a fonte da peça avulsa. A auditoria confere
  contra a origem — não afrouxe isso para "melhorar" um CTA.
- **Nada de imagem gerada por IA.** Foto sintética de um produto real é uma
  afirmação visual feita por um modelo que nunca o viu, e a imagem é a
  afirmação em que o leitor acredita primeiro. A ferramenta sugere termo de
  busca; a foto vem da biblioteca da marca ou do acervo.
- **Contagem de certificação se confere na fonte, e já errou duas vezes.** A
  Resibag tem **uma** homologação de produto: INMETRO, em dois certificados por
  capacidade. A base dizia "tripla", foi corrigida para "dupla", e o valor real
  é **um** — a primeira correção trocou o termo sem revalidar o fato (titular,
  08/09/2026). A ANTT 5998/2022 é a resolução que **obriga o cliente**, citada
  como documento normativo dentro dos próprios certificados INMETRO; não é selo
  da marca. A ISO 9001:2015 é do **sistema de gestão** da Sanwey e cobre a
  fabricação, nunca o produto. ANP saiu por falta de lastro. Trocar termo não é
  conferir fato.
- **Erro conhecido, não reintroduzir:** a Resolução ANTT nº 6.078/2026 não se
  confirma em fonte oficial, mesmo após revalidação completa de compliance
  (08–09/09/2026) — e também não substituiu a nº 5.998/2022, que trata de outro
  assunto. Não citar até existir certificado ou publicação que a sustente. A
  skill que carregava a troca (`resibag-compliance-kb`) foi descontinuada pelo
  titular em 10/09/2026; a fonte normativa da frente é a seção 05 da
  `resibag-canonical-facts`.

## 3. Segredo e fronteira de dado

- **`SUPABASE_SERVICE_ROLE_KEY` ignora RLS.** Nunca ganha prefixo
  `NEXT_PUBLIC_`, nunca chega ao cliente, nunca aparece em log. As variáveis que
  o código lê hoje são `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `CRM_AGENT_KEY`, `UNSPLASH_ACCESS_KEY` e `NEXT_PUBLIC_USD_BRL` — só a última é
  pública, e de propósito.
- **Nunca imprima o valor de um segredo**, nem para depurar. Cite o nome da
  variável e se está definida.
- **Fronteira da agência.** O papel `agencia` no CRM lê `marketing_deliverables`,
  não `agent_actions.payload`. Rascunho, fonte por afirmação e parecer do auditor
  ficam no `payload` de propósito — só o texto aprovado atravessa. Ao mexer no
  pacote enviado (`src/lib/crm.ts`), confira o que passa a ser visível.
  Exceção conhecida e registrada: `custom_fields.sinal` (nome do sinal de origem)
  cruza para o entregável.
- **Não aplicar migration nem fazer deploy de edge function sem confirmação
  explícita do Daniel.** Vale também para qualquer escrita em produção no CRM.
- **Publicar exige `APP_PASSWORD`.** As rotas de API gastam a chave da
  Anthropic, leem sinais do CRM, escrevem na fila de aprovação e apagam arquivo
  da biblioteca. Sem essa variável o `src/proxy.ts` não pede nada — o que
  é certo em `localhost` e inaceitável numa URL pública. Ao subir a ferramenta
  para qualquer lugar, definir a variável faz parte de "no ar".

## 4. Mockup antes de código — e a identidade visual é uma só

**A identidade visual está em transição desde 07/09/2026, e são DUAS enquanto
durar a transição — cada uma no seu escopo.** Confundir as duas, ou seguir a
errada, é como a plataforma ganha um terceiro visual sem ninguém ter decidido.

| Escopo | Direção | Fonte | Estado |
|---|---|---|---|
| Casca (`EsteiraShell`) e home Situação (`/`) | **Híbrido Wire Service + Type Specimen Desk** | `scratchpad/intent-fase1/DESIGN-hibrido-locked.md` · mock `scratchpad/intent-fase1/impeccable-hibrido-wire-specimen.html` | implementado (Fase 1) |
| Interiores de leitura: Peças, Fatos, Custos, Instalação | **Híbrido, mesma direção** | `scratchpad/intent-fase2/DESIGN-fase2-locked.md` · mock `scratchpad/intent-fase2/mockup-interiores.html` | aprovado 08/09/2026 (Fase 2) |
| Superfícies de trabalho: bancada (`/esteira`, `/artigo`) e editor | Painel de Situação (Clockwork) | `docs/ui-diretrizes.md` · mock `scratchpad/painel-mockup.html` | vale até a fase delas |

Do híbrido vêm o masthead serif, `EDIÇÃO · frente`, a dateline, a faixa preta com
a navegação, o glifo da prioridade e a grade de células. Tokens `paper`, `band`,
`rule`, `cell`, `urgent` em `src/app/globals.css`.

**O `canvas` foi o único token que atravessou a fronteira da fase**: passou do
cinza `#f8f8f8` para o papel `#f3efe6`, porque interior em cinza frio debaixo de
masthead em papel parece defeito, não fase.

Tela nova e redesign seguem a direção **do escopo em que estão**. Não invente um
terceiro visual. Hex de referências externas (Sanwey OS, Worktail) mapeia para
token — não entra no código.

Regra do Daniel, já em vigor: qualquer coisa que mude **como a plataforma se
parece ou se organiza** — cor, tema, ícone, layout, componente, ordem de tela,
como um dado é agrupado — precisa de mockup aprovado **antes** da
implementação. Vale para pedido dele e para sugestão sua. O mockup se confere
contra a fonte do escopo, não contra um visual inventado na hora.

Na dúvida se conta como mudança visual, mostre o mockup. Não decida sozinho que
"é pequeno o bastante para pular" — foi assim que a plataforma derivou do mockup
aprovado uma vez e teve de ser reconstruída.

**Bug fix puro não precisa de mockup** — algo que já deveria funcionar e não
funciona, ou um asset quebrado voltando ao original. Mudança de aparência, sempre.

Formato que funciona com ele: HTML clicável com 3-4 estados, mais screenshots
na largura real do monitor dele (1900px). Página única longa com scroll foi
rejeitada explicitamente.

**Mock é PROPORÇÃO, não pixel — e este repo já errou isso duas vezes.** Os
mocks de referência desenham cada tela num artboard pequeno: o híbrido da Fase 1
põe três frames dentro de um wrap de 1480px, ou seja **~468px por tela**. Copiar
os valores em pixel de lá para uma tela de 1900px multiplica o erro por quatro.

- 07/09/2026, Fase 1: o glifo de 78px do mock virou 78px numa tela quatro vezes
  maior, se perdeu, e sobraram 570px mortos. Corrigido com `clamp()`, que mantém
  a proporção aprovada.
- 08/09/2026, Fase 2: a mesma coisa com a tipografia e com a largura. Rótulos de
  8,5px e 9px foram copiados literais, e as linhas ficaram de ponta a ponta numa
  tela de 1900px. **O Daniel viu antes de mim** — "está muito largo, não sei
  explicar, e algumas fontes estão muito pequenas". Eram o MESMO defeito: num
  artboard de 468px a linha cheia é uma medida confortável e 9px parece um
  rótulo normal; a 1900px a linha tem 1900px e a letra tem metade do tamanho.

**A regra derivada.** Antes de traduzir um mock, divida: qual a largura do
artboard dele, e qual a largura real da tela. Se a razão não for 1, nenhum valor
em pixel atravessa — atravessa a proporção. E duas travas fixas, que valem para
qualquer tela nova:

- **Medida de página.** Conteúdo de leitura mora numa coluna (hoje 1280px), com
  a casca alinhada à mesma borda. Texto até a borda do papel não existe em
  jornal nenhum, e é o que produz a sensação de "largo" sem nome.
- **Piso de 11px** para rótulo e meta em tela de trabalho; corpo em 15px. Abaixo
  disso é decisão explícita, não descuido de tradução.

**A pilha de tipos é decisão, não fallback.** São três, e as três estão
ligadas em `globals.css`: `--font-sans` (Geist), `--font-mono` (Geist Mono) e
`--font-serif` (**Instrument Serif**).

O serif foi ligado em 08/09/2026 e antes disso não existia: o `font-serif` do
masthead caía no `ui-serif` do Tailwind — o serif genérico do sistema, ou seja
**uma fonte diferente em cada computador**, que ninguém escolheu, enquanto o
`layout.tsx` carregava Instrument Serif sem ligar a nada. A marca do produto
renderizava diferente para cada pessoa que abria a ferramenta.

**`font-serif` usa peso 400, sempre** — é o único que o Instrument Serif tem.
Medido: com `font-extrabold` o navegador engorda a letra por deformação
(negrito sintético) e a palavra encolhe de 107px para 87px, borrada. Em display
serif o peso vem do tamanho. Pela mesma razão o `tracking` negativo herdado do
serif genérico teve de abrir nos dois usos: o Instrument Serif já é estreito, e
a -0,03em as palavras se encostavam.

**Fonte tem papel, e mono é o papel mais fácil de estragar.** Mono significa
*o que a máquina escreveu ou o que alinha em coluna* — id, nome de variável,
dinheiro em extrato, índice. Palavra humana em mono é palavra fantasiada de
código, e quando o mesmo papel visual (rótulo pequeno em caixa alta) sai em
mono num lugar e em sans no outro, o olho acusa antes de a cabeça saber dizer o
quê. Foi o que o Daniel apontou no mockup da Fase 2 — "fontes que parecem não
combinar" — com mono fazendo nove trabalhos, seis deles com palavras.

**Contraste é gate, não gosto, e vale nos dois temas.** Texto de corpo ≥ 4,5:1
sobre o fundo; rótulo pequeno e ornamento ≥ 3:1. Meça sobre o app de verdade,
não sobre o hex isolado: **declare o par em `scripts/qa/contraste.mjs` e rode
`npm run qa:contraste`**, que já mede nos dois temas. Um token que passa no
claro pode reprovar no escuro — e a recíproca também, que foi como o sinal da
faixa reprovou só no claro (3,93:1).

Não escreva medidor novo. O de `scripts/qa/lib/navegador.mjs` já resolve a cor
pelo canvas (o Tailwind emite `oklab` para alpha) e multiplica o `opacity` dos
ancestrais; sem as duas coisas o número sai errado e parece certo. Os roteiros
de `scratchpad/` que mediam contraste ficaram como histórico — o que vale é o
de `scripts/qa/`.

Quando uma cor da paleta não passa como letra, ela vira preenchimento ou borda —
nunca se escurece a cor da marca para caber texto branco: troca-se a letra. Foi
a decisão do laranja `#E56515` (branco em cima dá 3,4:1; quase-preto dá 5,0:1),
e a mesma regra resolveu o sinal da faixa em 07/09/2026: o vermelho ficou no
ponto (ornamento) e as palavras foram para `band-ink`. Percentual na UI sempre
com o `n` ao lado.

## 5. Custo é visível ou não existe

Toda chamada de modelo vira uma linha no recibo, com rótulo em português.

- Use `priceUsage(usage, webSearches, model)` — o terceiro parâmetro importa:
  cobrar Haiku a preço de Sonnet mente no recibo.
- Modelo novo exige linha nova em `MODEL_PRICING`. O `satisfies` no fim do
  arquivo quebra o build de propósito se faltar — preço errado é pior que preço
  nenhum.
- Busca na web é linha separada (US$ 0,01 por busca), não diluída no total: é o
  item mais caro e o que surpreende.
- Geração cobrada que não virou conteúdo entra no log com `failed: true`. Não
  esconda gasto que aconteceu.

## 6. React 19 + React Compiler — os erros que este repo já cometeu

O lint do compilador é erro, não aviso. Três padrões, todos já corrigidos aqui:

- **`setState` síncrono dentro de efeito** encadeia render antes da pintura.
  O padrão do repo é agendar: `const t = setTimeout(fn, 0); return () => clearTimeout(t)`.
  Ver `src/app/esteira/page.tsx` e `src/app/biblioteca/page.tsx`.
- **`Date.now()` / `Math.random()` no corpo do render** viola `react-hooks/purity`.
  Dentro de callback, e id novo é `crypto.randomUUID()`.
- **Memoização manual** exige dependência completa — inclusive `setState` quando
  o callback a chama (`react-hooks/preserve-manual-memoization`).

Estado que vem do `localStorage` usa `useSyncExternalStore` com snapshot de
servidor (`costLog.ts`, `front.ts`) — ler no inicializador de `useState` fazia o
servidor renderizar diferente do cliente.

## 7. Extração sob demanda — 3ª ocorrência, nunca antes

Mesmo critério do `sanwey-gestão`: quando a mesma lógica visual/estrutural for
escrita pela **terceira** vez em lugares diferentes, extraia para
`src/components/app/` ou `src/lib/` naquele momento. Foi assim que
`src/lib/ui.ts` e `src/lib/apiError.ts` nasceram. Não construa abstração
especulativa: o custo de uma abstração errada é maior que o de duas cópias.

## 8. Como testar — sem chave de API, no navegador

Não existe banco de teste aqui, e a maioria das rotas custa dinheiro para rodar.
O padrão do repo é **Playwright com interceptação de rota**: as respostas do
modelo são fixas, o app roda de verdade, o teste custa zero. Exemplos reais em
`scratchpad/` (avulso, imagem, derivação).

Antes de dizer que está pronto:

1. `npx tsc --noEmit` limpo.
2. `npm run lint` limpo — aviso também, não só erro.
3. Teste de navegador cobrindo o caminho que você mexeu, imprimindo o que
   verificou (não "passou": `formatos oferecidos: 6`, `kinds enviados: [...]`).
4. Screenshot da tela na largura real, conferido contra o mockup aprovado.

Nunca reporte pronto com base só em typecheck. O bug do `.stage{display:flex}`
vencendo o atributo `hidden` passou por typecheck, lint e um teste que media a
propriedade errada — só a captura de tela mostrou as telas empilhadas.

## 9. Base de conhecimento curada — drift é aviso, não tarefa

`scripts/check-knowledge.mjs` roda no `predev`/`prebuild` e compara a versão da
skill de origem com a curadoria em `src/knowledge/`. Ele **sempre sai com 0** —
não é um gate, é um aviso.

- Skill à frente da curadoria → revise à mão o que mudou e só então
  `npm run knowledge:sync`.
- Curadoria à frente → não faça nada; sincronizar sobrescreveria correção
  deliberada (foi o caso do erro da ANTT 6.078).

Nunca rode `knowledge:sync` "para limpar o aviso" — e note que ele grava
**todas** as fontes de uma vez. Revisou uma e a outra não? Edite o
`sources.json` à mão, senão o sync apaga o aviso da que você não leu.

**`npm run knowledge:coerencia` faz duas perguntas sobre a base.**

*A fonte autorizada contém um termo que ela mesma proíbe?* O prompt sai em duas
partes com papéis opostos: `facts` se apresenta ao modelo como "a única fonte de
fatos autorizada", e `forbidden` vira a seção PROIBIÇÕES. Escrever "nunca diga
X" no meio dos fatos parece cuidado e é o contrário — põe X dentro da fonte
autorizada, em forma negada. Existe por um caso de 10/09/2026: ao trazer a
Resibag da v2.3 para a v2.9, esta sessão escreveu as proibições dentro do bloco
de fatos. O roteiro pegou os dois termos — e, rodando pela primeira vez, pegou o
mesmo defeito na base da Sanwey, que ninguém tinha tocado.

*As regras pegam o que dizem pegar?* Erro de regex desliga uma regra de
compliance **em silêncio**: ela continua na lista, continua indo para o prompt,
e nunca casa. São 48 casos declarados — frase real de um lado, veredito do
outro. Caso de coocorrência declara **também qual regra** deve disparar, e isso
não é zelo: a primeira versão conferia só "algum achado saiu", e o caso do par
passava por causa de outra regra. Plantar a quebra no par não reprovava.

**Regra de coocorrência existe desde 10/09/2026.** `match` responde "este texto
contém X?", uma regex por vez, e para no primeiro acerto — não expressa "A e B
não podem aparecer na mesma peça". O campo `pair` expressa, e o segundo passo de
`findForbidden` avalia no escopo da **peça**, não do bloco. A regra que motivou:
a Resibag proíbe misturar tagline institucional (Nível 01/02) com slogan
comercial (Nível 03), e cada um sozinho está certo. Foi um erro **desta sessão**
— o mockup da Fase 3 montou uma capa com os dois, lendo as regras de marca na
hora, e o gate não tinha como pegar.

**O que a curadoria ficar devendo aparece como aviso, não some.** Em
10/09/2026 a `resibag-canonical-facts` estava seis versões à frente, e no meio
disso havia correção de compliance: a lista `forbidden` mandava escrever "dupla
homologação", que virou erro. Drift de skill de fato não é ruído de
versionamento — é o gate podendo apontar para o lado errado.

## 10. Entrega — o que "pronto" significa

- Commit com mensagem que explica **por que**, não só o quê. Decisão que teve
  alternativa descartada merece a frase que diz qual e por quê.
- Nunca abrir PR sem o Daniel pedir. Nunca subir direto para a `main`.
- Se a mudança altera o pacote que vai ao CRM, diga na entrega o que a agência
  passa a ver.
- Débito que você deixou de propósito vira comentário no código, com o motivo —
  não fica só na conversa. Exemplo real: `pecas[].slides` continua sendo enviado
  porque é o campo que o gateway em produção lê hoje; o comentário diz isso e
  diz quando sai.

## 11. O gate de publicação — existe desde 03/09/2026

Antes desta data não havia nenhum, e era o achado mais grave da comparação com o
repositório irmão. **Está ligado agora**; o que segue é o diagnóstico que levou
a ele e as regras que valem daqui em diante.

O `prebuild` rodava só `scripts/check-knowledge.mjs`, que **sai sempre com 0**
por definição, porque é aviso e não gate (seção 9). O `eslint.config.mjs` era o
padrão do `eslint-config-next`, sem nenhuma regra escolhida. E o Next deixou de
rodar ESLint dentro do `build` — isto continua valendo. Somando as três coisas:
**não existia nenhuma verificação bloqueante entre escrever o código e
publicar**.

O repositório irmão pagou essa conta e mantém o placar: quatro telas mortas em
três semanas, uma delas quinze dias no ar, todas por erro de escopo puro. Um
`const` usado no array de dependência de um `useMemo` declarado acima dele, ou
um setter órfão que sobrou de refactor, compila sem um ruído sequer. Quem pegou
a de quinze dias foi o ESLint, não o build. Aqui o TypeScript cobre parte dessa
classe, e não cobre `rules-of-hooks`, condição que nunca faz o que parece, nem
duplicação silenciosa.

**O que foi feito.** `prebuild` agora é
`node scripts/check-knowledge.mjs && eslint` — o aviso de drift continua saindo
com 0, e o lint bloqueia. **Zero regra de estilo, de propósito**: gate que apita
por formatação vira gate ignorado. O ruído que não quebra nada (variável não
usada, dependência incompleta) continua como AVISO e sai em `npm run lint:ruido`,
que não trava o build. O racional de cada bloco, e das regras que ficaram de
fora, mora no cabeçalho do `eslint.config.mjs`.

**O achado que mudou o remédio.** Sondando as classes de erro uma a uma,
`react-hooks/rules-of-hooks` **já era erro** aqui, pelos presets — hook dentro de
`if` e hook dentro de laço eram pegos. A regra funcionava; ninguém a executava
antes de publicar. O ganho maior não veio de configurar regra nova, veio de
ligar o lint no `prebuild`.

O que o TypeScript já cobre ficou de fora, sondado e não suposto: chave
duplicada (TS1117), variável usada antes de declarar (TS2448/TS2454), negação
insegura (TS2322, porque o código é todo tipado) e membro duplicado de classe
(TS2393). Sobraram para o ESLint: condição constante, autocomparação, `else if`
duplicado e `case` duplicado — as que passam pelo compilador inteiras porque o
ramo errado simplesmente nunca roda.

**Verificado.** Com um `else if` duplicado plantado, `npm run build` sai com
código 1 e não chega a compilar o Next. Sem ele, sai 0 e compila.

Continua valendo o que a seção 8 já diz: nunca reportar pronto com base só em
typecheck.

## 12. Varredura em navegador: script, não rascunho

O padrão de teste deste repositório é bom e o motivo é melhor que o do
repositório irmão: as rotas custam dinheiro, então Playwright com interceptação
de rota roda o app de verdade a custo zero. O problema é onde ele mora. Os
exemplos estão em `scratchpad/`, e uma pasta com esse nome ninguém trata como
suíte.

**Existe desde 07/09/2026, em `scripts/qa/`** — roteiros com entrada em
`package.json`, detalhados em `scripts/qa/README.md`:

| Comando | O que prova |
|---|---|
| `npm run qa:rotas` | as 11 telas renderizam **a tela certa**, no monitor e no celular — e nenhum elemento declara duas cores para a mesma propriedade |
| `npm run qa:contraste` | 436 medições em 7 telas passam o piso nos **dois** temas |
| `npm run qa:interacao` | frente, tema, prioridade e herança de chave respondem |
| `npm run qa:avisos` | o achado de **coocorrência** aparece no painel com os dois trechos e o bloco nomeado |
| `npm run qa` | os quatro em sequência |
| `npm run qa:sonda` | **não é gate** — percorre o DOM e lista o que está abaixo do piso, para você declarar |

Playwright continua fora das dependências do projeto, instalado sob demanda, e
o motivo fica escrito no `README` da pasta.

**Armadilha que este repositório tem e o irmão não.** `src/proxy.ts` protege
tudo por senha quando `APP_PASSWORD` está definida. Varredura rodando com a
variável ligada e sem a senha reporta N rotas limpas que são N telas de
bloqueio. Vale a mesma frase do irmão: **varredura que passa sem provar que
renderizou a tela certa vale menos que nada, porque dá sensação de cobertura.**

Por isso cada rota declara uma `marca` — texto que só existe se a tela certa
renderizou. **Medido, não suposto:** com `APP_PASSWORD` ligada e sem senha, as
22 combinações reprovaram; com `QA_SENHA` na mesma instância, as 22 passaram.
`QA_SENHA` existe para varrer a ferramenta publicada, que é onde a variável está
definida e onde auditar importa mais.

**Alvo de contraste é declarado, não improvisado.** Numa única sessão, três
seletores escolhidos na hora casaram com o elemento errado — dois alarmes falsos
e um que escondeu uma reprovação real de 1,17:1. Em `contraste.mjs` cada alvo
traz a contagem esperada e o relatório imprime o texto que mediu; seletor que
deixa de casar é reprovação, não silêncio.

**O gate só vigia o que alguém declarou.** É por isso que existe a sonda: o
defeito mais caro achado até hoje — o KPI urgente a 1,04:1 — estava exatamente
onde não havia alvo. O fluxo é sonda ACHA → você CLASSIFICA (corpo ou rótulo?)
→ `contraste.mjs` DECLARA. Ela nunca reprova sozinha, porque varredura
automática erra escolhendo alvo.

**Suíte que só sabe dizer verde não prova nada.** Cada roteiro novo se confere
plantando o defeito que ele deveria pegar e vendo a reprovação sair. Foi assim
com todos: a armadilha da senha, a fila fora do ar virando "em dia", o seletor
que casa com zero elementos, e a colisão `bg-surface` × `bg-acc`.

Quando rodar: o gate da seção 11 roda sozinho em todo build. A varredura é para
fim de entrega que mexeu em mais de uma tela, e para rodada de auditoria — fica
fora do `prebuild` porque depende do app de pé e de um Playwright que o projeto
de propósito não instala.

## 13. Segurança como quarta lente, condicional

Adaptado da seção 3.1 do repositório irmão. Aqui as condições de disparo são
diferentes, e são mais fáceis de acionar sem perceber.

**Dispara quando a mudança tocar:** rota que gasta dinheiro por chamada, o
pacote que atravessa para o CRM, qualquer uso da chave de serviço do Supabase, a
chave de agente do gateway, ou o comportamento de `src/proxy.ts`.

**Só revisa.** Aprova, ou devolve achado específico no formato
`arquivo:linha — o que está errado — o que deveria ser`. Nunca escreve no CRM
por conta própria: isso continua exigindo confirmação explícita do Daniel
(seção 3).

Checklist mínimo:

- Nenhum segredo ganha o prefixo `NEXT_PUBLIC_`. A chave de serviço ignora RLS,
  e no navegador entregaria o banco inteiro a qualquer visitante. O
  `.env.example` já avisa isso em maiúsculas; a revisão confere que continua
  verdade.
- Leitura que usa a chave de serviço acontece **só no servidor**, e o dado que
  chega ao cliente é o recorte, nunca a resposta crua.
- Rota que gasta dinheiro não é acionável em laço sem limite, nem por
  requisição que o usuário consegue repetir sem custo próprio.
- Mudança no pacote que vai ao CRM declara **o que a agência passa a ver**
  (a seção 10 já exige; a revisão confere que foi declarado).
- A chave de agente identifica quem assina a sugestão. Trocar a chave é trocar a
  autoria no CRM, não é detalhe de configuração.

## 14. Erro que a própria sessão cometeu vira regra, não anedota

O repositório irmão faz isso explicitamente: quando uma sessão afirmou ao Daniel
que um segundo projeto Supabase seria gratuito, e não era, a correção virou
linha permanente do arquivo, com a regra derivada de sempre conferir o preço
antes de afirmar.

Aqui existe o caso equivalente e ele está tratado como anedota de teste, no fim
da seção 8: o `.stage{display:flex}` venceu o atributo `hidden`, passou por
typecheck, por lint e por um teste que media a propriedade errada, e só a
captura de tela mostrou as telas empilhadas.

**Regra.** Afirmação errada da sessão que chegou a mudar uma decisão do Daniel
volta para este arquivo como correção datada, com a regra derivada, no lugar
onde ela teria evitado o erro. Não some no histórico da conversa. Vale também
para número: preço, contagem, limite de API e prazo se confere antes de
afirmar, e a origem da conferência entra junto.

## 15. Nunca pausar por mensagem que chega no meio do trabalho

Instrução do Daniel, permanente para toda sessão futura, já valendo no
repositório irmão desde 28/07/2026 e reproduzida aqui porque é da pessoa, não do
projeto.

Quando uma mensagem nova chegar no meio de um trabalho em andamento, a sessão
não para nem espera confirmação. Duas opções, em ordem:

1. Se der para paralelizar sem conflito (agente em segundo plano, ou uma edição
   rápida e independente, como atualizar este próprio arquivo), faça em
   paralelo, sem soltar o fio do que já estava em curso.
2. Se não der, coloque o pedido na fila e siga até um ponto de corte natural.

Só interromper de verdade quando a mensagem for correção de rumo do que está em
andamento, ou pedido explícito de parar.
