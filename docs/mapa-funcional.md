# Mapa funcional — o que cada superfície faz

**Escrito em 08/09/2026.** Este arquivo responde "o que cada tela faz" sem
obrigar ninguém a varrer o código — que foi o que precisou ser feito numa
análise externa em 03/09/2026, porque nenhuma página tinha comentário de
propósito e o `README` descreve o produto, não a superfície.

> O `CLAUDE.md` é **como construir**. Este é **o que existe**. Mexeu em página,
> rota, camada de conhecimento ou no pacote do CRM, atualize aqui e rode
> `npm run doc:check` — ele recalcula as contagens a partir do código e falha
> apontando a divergência. Fica fora do `prebuild`: documento defasado não
> trava deploy.

Tudo aqui foi conferido no código, não lembrado. Onde há número, ele veio de
`grep` ou de leitura do arquivo citado.

---

## 1. As 11 páginas

Duas delas são **redirecionamentos** e não telas — existem porque o link já
circulou, e uma porta a menos é melhor que duas telas fazendo quase a mesma
coisa.

### `/` — Situação

**Para que serve:** a porta de entrada. Mostra, num glifo do tamanho de uma
manchete, **quanta coisa espera decisão sua** — fila do CRM > não enviados >
sem fonte, nessa ordem, que mora em `esperandoDecisao` (`src/lib/dashboardStats.ts`)
e é a MESMA regra que a faixa da casca usa.

**Precisa estar funcionando:** nada além do navegador. A fila do CRM vem de
`/api/publish` e some com elegância se o CRM não estiver configurado —
"não sei" é um estado distinto de "zero", e a faixa diz `fila indisponível`
em vez de `em dia`.

**Deliberadamente não faz:** não inventa contagem. Instalação nova abre com
zero em tudo, que é o estado verdadeiro dela.

### `/esteira` — a bancada

**Para que serve:** onde a peça nasce. Origem à esquerda, artigo no centro,
saídas à direita — porque o trabalho real é ler o artigo e decidir o que sai
dele, e em telas separadas essas duas coisas nunca ficavam juntas.

**As quatro origens entram pela mesma porta:** sinal do CRM, tema, texto colado
e arquivo. O que muda entre elas é a regra factual, não a tela.

**Precisa estar funcionando:** `ANTHROPIC_API_KEY` para gerar. Sinais exigem
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; sem elas a seção de sinais não
aparece e as outras três origens seguem.

**Deliberadamente não faz:** não aprova nada. Aprovar acontece no CRM, onde
fica o histórico.

### `/esteira/pecas` — Peças

**Para que serve:** o que já foi produzido, e a porta de volta para ele. Duas
listas de propósito: produção (bancada) e rascunho (editor de slides).

**Precisa estar funcionando:** só o `localStorage` deste navegador. A gravação
é automática, sem botão — um botão transformaria "não perder trabalho pago"
numa lembrança do usuário, que é exatamente o que falhou antes.

### `/esteira/fatos` — Base de fatos

**Para que serve:** o que a ferramenta **pode afirmar**. Fila de risco no topo,
base inteira abaixo. O nível de proveniência decide se um fato vira número numa
peça, então é a primeira coluna da linha, não a última.

**Precisa estar funcionando:** nada — a base é curada e versionada em
`src/knowledge/facts/`.

**Deliberadamente não faz:** não edita fato pela tela. Curadoria é revisão à
mão no JSON, com `npm run knowledge:audit` listando o que falta verificar.

### `/esteira/custos` — Custos

**Para que serve:** o extrato de tudo que a API cobrou. Toda chamada de modelo
vira uma linha, inclusive a **cobrada que não virou peça**.

**Precisa estar funcionando:** só o `localStorage`. O histórico é local e não
sai daqui.

### `/esteira/instalacao` — Instalação

**Para que serve:** o que está ligado nesta máquina. Nome da variável e se está
definida.

**Deliberadamente não faz:** **nunca imprime o valor de um segredo**, nem para
depurar. A service role ignora RLS e a chave de agente define quem assina no
CRM — nenhuma das duas pode chegar à tela.

### `/editor` — Editor de slides

**Para que serve:** o canvas do carrossel — editar slide a slide, trocar tema,
imagem e logo, e exportar. Casca própria, não a da esteira.

**Precisa estar funcionando:** `ANTHROPIC_API_KEY` para gerar ou reescrever
slide. Abrir e exportar rascunho já salvo não gasta nada.

### `/biblioteca` — Biblioteca de imagens

**Para que serve:** as fotos da frente ativa, para a peça usar imagem própria
em vez de acervo.

**Precisa estar funcionando:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

**Deliberadamente não faz:** não gera imagem por IA, em nenhuma circunstância.

### `/slides-preview` — Prévia de slides

**Para que serve:** superfície de conferência do renderizador de slides, com
dado fixo. É onde se olha o desenho do slide sem gastar geração.

### `/artigo` e `/esteira/avulso` — redirecionam

Não são telas. `/artigo` virou o passo 3 da esteira e `/esteira/avulso` virou
uma origem da bancada. Redirecionam em vez de sumir porque os links circularam.

---

## 2. As 14 rotas de API

### Gastam dinheiro por chamada

Sete rotas chamam o modelo e cobram. Todas registram a cobrança em
`src/constants/pricing.ts` via `priceUsage`, e o que falhou entra no log com
`failed: true` — gasto que aconteceu não se esconde.

| Rota | O que faz |
|---|---|
| `/api/generate` | carrossel a partir do brief |
| `/api/generate/artigo` | o artigo, que é a fonte factual das peças curtas |
| `/api/generate/avulso` | peça sem artigo por trás — material colado é a fonte |
| `/api/generate/slide` | reescreve um slide |
| `/api/generate/suggestions` | sugestões de tema |
| `/api/derive` | deriva as peças escolhidas **a partir do artigo** |
| `/api/suggest-outputs` | que peças o material sustenta |

**A regra que não muda:** nada aqui é escrito do zero. A fonte factual é o
artigo, ou o material colado. É o que impede a afirmação que existe só na peça
curta e não no artigo — justamente a que ninguém confere.

### Gastam cota, não dinheiro

`/api/images/search` e `/api/images/track-download` consomem a cota do Unsplash.
O `track-download` existe porque as diretrizes da API exigem chamar
`download_location` quando a foto é **usada**, não quando é exibida.

### Não gastam nada

`/api/signals`, `/api/campaigns`, `/api/assets/library`, `/api/publish`,
`/api/instalacao`. Leem o CRM ou o disco.

`signals` e `campaigns` respondem `configured: false` como resposta legítima —
CRM ausente não é erro. A leitura usa a service role e acontece **só no
servidor**.

---

## 3. `src/knowledge` — a camada de fato curado

Conferido em 11/09/2026, contado a partir do código:

| Arquivo | Fatos | Por nível | Fonte órfã |
|---|---|---|---|
| `facts/resibag-normas.json` | 19 | 1 primária · 1 secundária · 17 não verificado | **14** |
| `facts/sanwey-normas.json` | 7 | 1 interna · 6 não verificado | 0 |
| `facts/meu-normas.json` | 0 | frente pessoal — número e norma só do material colado | — |

**Só primária dentro da validade vira número, data ou artigo de norma numa
peça.** Secundária e interna dão contexto e nunca entram no slide. Os níveis e
a regra moram em `src/knowledge/provenance.ts`.

`checkedAt` e `revalidateBy` dizem quando alguém conferiu contra a fonte e até
quando o fato vale. **Um fato de 19 da Resibag tem `checkedAt`** — é o que a
coluna de conferência da tela de Fatos mostra, e é o motivo de a fila existir.
Três fatos têm `revalidateBy`, e **dois vencem em 31/12/2026** — a revisão da
ANTT 5998 e o RAPP do IBAMA. Depois da data eles param de ser publicáveis até
alguém reconferir. O terceiro é a validade do certificado INMETRO de 700 kg,
18/05/2028.

**Quatorze fatos da Resibag citam uma skill que não existe mais.** A
`resibag-compliance-kb` foi descontinuada pelo titular em 10/09/2026, e o
`source` de cada um diz isso na cara, com a norma onde conferir de verdade.
Não foram repontados para a fonte normativa nova: aquelas afirmações
detalhadas de NBR, ANTT e INMETRO não estão lá, e repontar seria atribuição
falsa — que é pior que órfã.

### O que a varredura de termo proibido sabe fazer

`check.ts` roda por frente, em dois passos. O primeiro compara uma regex por
vez contra o texto de cada bloco. O segundo avalia **coocorrência** no escopo
da PEÇA — o campo `pair`, que expressa "A e B não podem aparecer juntos"
quando cada um, sozinho, está correto.

| Frente | Regras | De coocorrência |
|---|---|---|
| resibag | 24 | 1 — tagline institucional junto do slogan comercial |
| sanwey | 14 | 2 — assinatura junto do posicionamento; tagline junto da sub-tagline |
| meu | 2 | 0 |

A regra de par existe desde 10/09/2026, e nasceu de um erro que o próprio gate
não tinha como pegar: um mockup desta ferramenta montou uma capa misturando os
dois níveis de mensagem da Resibag.

### Dois roteiros vigiam a base

`scripts/check-knowledge.mjs` compara a curadoria com a skill de origem e
**sempre sai com 0** — é aviso, não gate. Grava **todas** as fontes de uma vez:
revisou uma e a outra não, edite o `sources.json` à mão.

`npm run knowledge:coerencia` olha para dentro e faz duas perguntas: a fonte
autorizada contém um termo que ela mesma proíbe, e as regras pegam o que dizem
pegar. São 48 casos declarados, com os dois lados — frase errada que deve
reprovar, e frase certa que não pode dar falso alarme.

**Erro conhecido, não reintroduzir:** a Resolução ANTT nº 6.078/2026 **não se
confirma em fonte oficial** e também não substituiu a nº 5.998/2022. Circulou
como "atualização da 5.998" por meses sem ninguém conferir na ANTT, e é o caso
que fez esta camada existir.

**Conflito aberto, registrado e não resolvido:** o organismo certificador da
ISO 9001 do Grupo Sanwey. A fonte da Sanwey registra DNV; a da Resibag retirou
o nome e proíbe citá-lo até haver certificado físico conferido. A proibição
vale só na frente Resibag — o certificado é da Sanwey, e herdar a regra da
outra frente seria o vazamento que a regra de isolamento proíbe.

---

## 4. A fronteira com o CRM (`src/lib/crm.ts`)

O envio usa `agent_actions`, a fila que o CRM já tem para sugestão de agente
que espera aprovação humana.

**O que o papel `agencia` lê:** `marketing_deliverables` — o texto aprovado.
**O que ele NÃO lê:** `agent_actions.payload`, onde ficam de propósito o
rascunho, a fonte por afirmação e o parecer do auditor.

**O que atravessa para o entregável, intencionalmente:** `sinal` (nome do sinal
de origem), `content_id`, `campaign_id` e `campaign_name` — via
`custom_fields`. A agência passa a ver o código da peça.

**Prioridade:** peça com afirmação sem fonte entra como `high`. Não é urgência,
é pendência — mas precisa saltar na fila, porque é a que exige decisão.

**Débito registrado:** `pecas[].slides` continua sendo enviado junto de
`blocos`, com o mesmo conteúdo, porque é o campo que o gateway em produção lê
hoje. Sem ele, Reels e Stories chegariam ao entregável como título sem corpo.
Sai quando o gateway passar a ler `blocos`.

**A chave de agente é a autoria.** `CRM_AGENT_KEY` define qual agente assina a
sugestão — o corpo do pedido não escolhe. Trocar a chave é trocar quem assina.

---

## 5. Variáveis de ambiente, e o que quebra sem cada uma

Espelha o `.env.example`.

| Variável | Sem ela |
|---|---|
| `ANTHROPIC_API_KEY` | **nada é gerado.** É a única verdadeiramente obrigatória para a ferramenta funcionar |
| `APP_PASSWORD` | o `src/proxy.ts` não pede nada. Certo em `localhost`, **inaceitável numa URL pública** — definir faz parte de "no ar" |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | sem sinais do CRM, sem campanhas, sem biblioteca de imagens. As outras origens seguem |
| `CRM_AGENT_KEY` | o botão "Enviar para aprovação" não aparece |
| `UNSPLASH_ACCESS_KEY` | a busca de imagem some; sobra a biblioteca da frente |
| `NEXT_PUBLIC_USD_BRL` | os custos aparecem só em dólar, em vez de converter por cotação inventada |
| `NEXT_PUBLIC_SHORTENER_BASE` | o QR usa a landing completa com UTM |

**`SUPABASE_SERVICE_ROLE_KEY` ignora RLS.** Nunca ganha prefixo `NEXT_PUBLIC_`,
nunca chega ao cliente, nunca aparece em log. Só a `NEXT_PUBLIC_USD_BRL` e a
`NEXT_PUBLIC_SHORTENER_BASE` são públicas, e de propósito.
