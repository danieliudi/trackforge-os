# Fase 4 — voz, trabalho e o arco de evento

> **Aprovado em 11/09/2026** — "Ok aprovado", Daniel, aos quatro pontos abaixo.
> Mockup: `scratchpad/intent-fase4/mockup-vozes.html`, cinco estados, capturas em
> `capturas/` a 1900px nos dois temas; a implementação em `implementado/`.
> Direção: híbrido Wire + Specimen, a mesma desde 07/09/2026. Zero hex novo.
>
> **O que a implementação encontrou e o mockup não podia mostrar**, tudo
> registrado no commit correspondente:
>
> - O React Compiler reprovou QUATRO `useCallback` — dois fora desta fase — por
>   causa de uma função declarada no corpo do render. Família da seção 6, e ele
>   reclama longe de onde o erro mora.
> - O `tsc` apontou todos os literais de `Origin` montados à mão quando o tipo
>   ganhou dois campos. Passaram a partir de `emptyOrigin`.
> - A contagem declarada do contraste reprovou sozinha ao ver 4 abas de origem
>   onde esperava 3 — a quinta origem chegando ao gate antes de chegar a mim.
> - O resolvedor de TS não sabia o alias `@/`, e ninguém sabia: todo import por
>   ele era `import type`, que o strip-types apaga antes de resolver.
> - E, fora do escopo, dois defeitos que a ferramenta já carregava: a tagline
>   proibida carimbada em toda peça Resibag, e o placeholder a 3,56:1 no claro.

---

## O pedido

Do Daniel, em 11/09/2026, depois da conversa de estratégia editorial de LinkedIn:

> "quero também deixar a opção de poder escolher esses detalhes em criações
> avulsas, quando precisar criar algo. Inclusive incluir tipos de posts que
> seriam criados em feiras e eventos."

"Esses detalhes" são os que a estratégia produziu: **quem assina** (página da
empresa, diretor, responsável pela Resibag, ele) e **o que o post tem de fazer**.
Mais os tipos de peça de feira.

---

## A decisão que muda tudo: voz é DIMENSÃO, não formato

Se voz virasse formato, seriam 6 formatos × 4 vozes = **24 `kind`s**, e cada um
exige entrada em `OUTPUT_META`, esquema em `OUTPUT_SCHEMAS`, achatamento em
`outputBlocks`, renderização em `OutputPieces` e linha em `MODEL_PRICING`.
Vinte e quatro de cada.

Como dimensão — que é o que `platform` já é hoje — são **dois campos novos** no
pedido e no `brief`, e os seis formatos continuam sendo seis.

**Trade-off nomeado:** dimensão não aparece sozinha na tela. Formato tem célula;
dimensão precisa de um lugar onde morar, e é isso que o mockup resolve. Foi por
isso que ele precisou de cinco estados e não de dois.

---

## Os três controles

### 1 · Trabalho — o que o post tem de fazer (coluna da origem)

Quatro células regradas, mesma grade da home e da grade de formatos. Fica
**junto do ângulo**, não junto do formato, porque é decisão de *para quê*, que é
anterior a *em que forma*.

**A lista é da frente, e as duas não se parecem:**

| Resibag — calendário de compliance | Sanwey — arquivo de engenharia |
|---|---|
| Norma em movimento · autoridade | Marco datado · autoridade |
| Como se confere · autoridade | Engenharia por carga · diferencial |
| A conta · comercial | Vertical · alcance |
| A operação · prova | Certificação com escopo · barreira |

Não é preferência: a Resibag vende para um especificador técnico que entra pela
porta do compliance, e a Sanwey vende engenharia aplicada com 42 anos de marcos
datados. Uma lista só serviria mal às duas.

### 2 · Voz — quem assina (coluna das saídas)

Quatro células no topo da coluna, e **a lista também é da frente**: a voz
"Responsável Resibag" não existe na Sanwey. No mockup, o estado `c` mostra a
Sanwey com três células em vez de quatro — é a consequência aparecendo na tela.

**A voz é da PEÇA, não da rodada.** O seletor do topo é o padrão do lote; cada
célula de formato marcada carrega a própria etiqueta e pode divergir. Isso não é
refinamento: é o mix inteiro. A mesma notícia da ANTT vira carrossel na página e
post de texto no diretor, da mesma origem e do mesmo artigo — se a voz fosse da
rodada, seriam duas rodadas e dois artigos, e o segundo artigo custaria dinheiro
para dizer o que o primeiro já disse.

**A etiqueta só aparece em célula marcada.** Voz de peça que ninguém vai gerar é
ruído.

### 3 · Evento — a quinta origem, e o arco no lugar do trabalho

Evento entra como **quinta aba de origem** (Sinal · Tema · Texto · Arquivo ·
Evento), não como trabalho novo. E quando ela está ativa, a grade de trabalhos
**some** e entra o arco:

`T−14 convite · T−3 pauta · Dia bastidor · D+2 o que ouvimos · D+7 material`

Porque evento não tem trabalho, tem etapa — e é a etapa que decide o que o post
faz. O `D+2` é o de maior valor do arco e o menos publicado: é a síntese do que
o mercado perguntou, só existe porque alguém estava lá, e é a única pauta do ano
que não sai de norma nem da base de fatos.

---

## O que isso acrescenta ao GATE, e não só à tela

Hoje a regra de coocorrência sabe dizer *"tagline institucional e slogan
comercial não na mesma peça"*. Ela não sabe dizer **de quem é a peça**.

Com voz explícita no pedido, passa a saber: **a página carrega a tagline; pessoa
carregando a mesma frase vira anúncio.** Vira regra de `forbidden` condicionada à
voz, e a varredura recusa a peça antes de ela sair — em vez de depender de quem
está lendo o manual naquele momento.

É o mesmo ganho que a regra `pair` trouxe em 10/09: sai da lembrança, entra no
gate. E vale lembrar por que aquela regra nasceu — um mockup desta série montou
uma capa com os dois registros juntos, e o gate não tinha como pegar.

---

## Conferido antes de virar código

- **728 medições de contraste**, 5 estados × 2 temas, todas acima do piso.
- **Uma reprovação apareceu e virou correção de desenho**, não de cor: a
  etiqueta de voz dentro da célula invertida usava `--acc-soft`, que dá ~11:1 no
  claro e **~1,8:1 no escuro** — a célula marcada inverte, e o tema escuro não
  redefine o token, então o fundo vira quase-branco debaixo de um laranja claro.
  Mesma família do KPI urgente a 1,04:1 (CLAUDE.md seção 1). A divergência
  passou a ser **peso e glifo**, que funcionam nos dois temas, porque numa
  célula invertida só existem duas cores e as duas trocam de lado.
- **O roteiro se conferiu nos dois sentidos:** achou uma reprovação real na
  primeira execução, e um seletor inexistente reprovou em 10 combinações em vez
  de passar em silêncio.
- **O mockup passa no gate da própria ferramenta.** `conformidade.mjs` roda a
  varredura de termo proibido sobre o texto visível dos cinco estados — e nesta
  fase **cada estado vai contra a frente que ele exibe**, porque o estado `c` é
  Sanwey. Varrer tudo contra "resibag" acusaria marco da Sanwey como termo
  proibido e deixaria a Sanwey sem varredura nenhuma. Conferido plantando um
  defeito por frente: os dois saíram, cada um com a regra certa.
- **Medida de leitura:** 680px = ~72 caracteres por linha, a mesma da Fase 3.
- **Zero hex novo.** Todos os tokens são cópia literal de `globals.css`.

### Um achado que é do APP, não do mockup

Medido no app rodando, nos dois temas:

| Tela | Campo | Claro | Escuro |
|---|---|---|---|
| `/editor` | placeholder do composer | **3,56:1** | 5,27:1 |
| `/esteira` | placeholder do ângulo | **3,56:1** | 5,27:1 |

Reprova no claro, passa no escuro — a recíproca do caso do sinal da faixa. A
causa é `fieldClass` usar `placeholder:text-faint`; placeholder é texto que se
LÊ para saber o que digitar, então o piso é 4,5:1 e não 3:1.

**O gate nunca olhou** porque placeholder é pseudo-elemento e nenhum alvo o
declara em `scripts/qa/contraste.mjs`. Corrigir e declarar andam juntos: declarar
sem corrigir deixa o gate vermelho. É bug fix puro (seção 4) e não depende desta
fase — fica esperando decisão do Daniel, fora deste mockup.

---

## O que precisa de decisão sua

1. **Voz como dimensão, não formato.** É a decisão estrutural. A alternativa são
   24 `kind`s, e ela piora tudo que depende de formato.
2. **Voz por peça, com padrão de lote.** Custa uma etiqueta dentro da célula
   marcada e um menu inline. Sem isso, o mix precisa de uma rodada por voz.
3. **Listas por frente** — trabalhos e vozes. Custa que a tela mude ao trocar a
   frente, o que hoje não acontece nesta coluna.
4. **Evento como quinta origem, com arco no lugar do trabalho.** A alternativa é
   evento virar cinco trabalhos novos, e aí a grade de trabalhos vira dez
   células com metade inaplicável na maior parte do ano.

---

## Se aprovar

A implementação não inventa componente: a grade de células, as abas regradas e a
coluna de leitura já existem desde a Fase 3. O que entra é:

- dois campos no pedido (`trabalho`, `voz`) e no preâmbulo de `src/lib/brief.ts`,
  que as três rotas compartilham;
- a quinta origem em `OriginPicker`, com os campos de evento e o arco;
- as listas por frente, ao lado das marcas em `src/constants/brands.ts`;
- a regra de voz em `forbidden`, com os casos declarados em
  `npm run knowledge:coerencia`;
- nenhum `kind` novo, nenhuma linha nova em `MODEL_PRICING`.
