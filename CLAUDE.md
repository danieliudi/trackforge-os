@AGENTS.md

# carousel-builder — padrão de consistência

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
> O mapa: `00-nucleo` (fato, segredo, mockup, pronto, entrega) ↔ seções 2, 3, 4,
> 8 e 10 · `10-reuso` ↔ 1 e 7 · `20-telas` ↔ 4 mais a linha de cor/tema da 1 ·
> `30-react` ↔ 6 · `40-api-e-custo` ↔ 3 e 5 · `50-conhecimento` ↔ 9.

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
| Casca do app: barra lateral, frente ativa, seções | `src/components/app/EsteiraShell.tsx` | 5 telas — toda tela nova dentro da esteira nasce aqui, não com layout próprio |
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
- **Erro conhecido, não reintroduzir:** a Resolução ANTT nº 6.078/2026 **não**
  substituiu a Resolução nº 5.998/2022 — tratam de assuntos diferentes do setor
  de transportes. A skill `resibag-compliance-kb` carregou essa troca; se
  aparecer de novo na base curada, é erro a corrigir, não fato a propagar.

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

## 4. Mockup antes de código — mudança visual ou estrutural

Regra do Daniel, já em vigor: qualquer coisa que mude **como a plataforma se
parece ou se organiza** — cor, tema, ícone, layout, componente, ordem de tela,
como um dado é agrupado — precisa de mockup aprovado **antes** da
implementação. Vale para pedido dele e para sugestão sua.

Na dúvida se conta como mudança visual, mostre o mockup. Não decida sozinho que
"é pequeno o bastante para pular" — foi assim que a plataforma derivou do mockup
aprovado uma vez e teve de ser reconstruída.

**Bug fix puro não precisa de mockup** — algo que já deveria funcionar e não
funciona, ou um asset quebrado voltando ao original. Mudança de aparência, sempre.

Formato que funciona com ele: HTML clicável com 3-4 estados, mais screenshots
na largura real do monitor dele (1900px). Página única longa com scroll foi
rejeitada explicitamente.

**Contraste é gate, não gosto, e vale nos dois temas.** Texto de corpo ≥ 4,5:1
sobre o fundo; rótulo pequeno e ornamento ≥ 3:1. Meça sobre o app de verdade,
não sobre o hex isolado — modelo pronto para copiar em
`scratchpad/contraste-slot.mjs` (Playwright, lê a cor computada nos dois temas).
Rode com `colorScheme: "dark"` também, porque um token que passa no claro pode
reprovar no escuro. Quando uma cor da paleta não passa
como letra, ela vira preenchimento ou borda — nunca se escurece a cor da marca
para caber texto branco: troca-se a letra. Foi a decisão do laranja `#E56515`
(branco em cima dá 3,4:1; quase-preto dá 5,0:1).

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

Nunca rode `knowledge:sync` "para limpar o aviso".

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
