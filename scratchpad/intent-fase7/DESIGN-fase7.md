# Fase 7 — Teto de gasto

**Estado: PROPOSTA, aguardando aprovação.** Nada implementado. Escrito em 19/09/2026.

Mock: `mockup-teto.html` — 5 estados × 2 temas, clicável. Capturas a 1900px em
`capturas/`, com o ANTES das duas telas afetadas.

---

## O que motivou

Hoje a única trava que existe é `.max(6)` no schema da rota de geração, e ela
limita **quantos formatos**, não quanto gasta. Você vê o custo depois que ele
aconteceu.

Isso é tolerável enquanto todo clique é seu. Deixa de ser no dia em que entrar
**geração agendada** — que você pediu na mesma conversa. Gerar de madrugada, sem
ninguém olhando, sem teto, é o maior risco financeiro da lista inteira.

---

## O achado que muda o tamanho da entrega

**O log de custo inteiro vive no `localStorage` do navegador.** Nenhuma rota de
API registra gasto do lado do servidor — conferido por grep, não suposto.

A tela de Custos já é honesta sobre isso: *"Histórico local deste navegador. Não
sai daqui."* Mas a consequência para o teto é séria, e ela separa a
funcionalidade em **dois trabalhos que parecem um só**:

| | o que faz | onde mora | custo |
|---|---|---|---|
| **não me assustar** | avisa em 80%, mostra quanto resta, para o botão | `localStorage` | uma tarde |
| **não me deixar gastar** | trava de verdade, inclusive agendado e em outro navegador | servidor + banco | bem mais |

O primeiro resolve 90% do seu problema **hoje**, porque hoje todo clique é seu e
num navegador só. O segundo vira obrigatório no dia do agendamento — e só nesse
dia.

**A proposta é o primeiro**, com o rótulo honesto na tela (`Custos · este
navegador`), e com isto escrito para quando o agendamento chegar.

O que o teto local NÃO cobre, e a tela não pode fingir que cobre: outro
navegador, aba anônima, e geração que roda sem navegador nenhum.

---

## Os cinco estados

Declarar quatro de cinco seria pior que declarar nenhum (§12), então:

| estado | o que a tela faz |
|---|---|
| **sem teto** | a ausência CONTA: a célula 02 diz "nenhum", e uma nota explica o que um teto faria. O campo de configurar fica logo abaixo |
| **dentro** | régua em 12%, resta em destaque, nada muda no botão |
| **perto** (>80%) | régua em âmbar, aviso traduzindo o que resta em posts — "R$ 7,90, cerca de 34 posts pela sua média" |
| **estouraria** | a rodada marcada custa mais do que resta. Aparece **antes do clique**, com hachura na régua mostrando a mordida, e o botão troca para "Confirmar e subir o teto" |
| **no teto** | régua vermelha, botão desabilitado **com o motivo escrito nele**, e a data em que zera |

O quarto é o que mais importa e o que não existe em ferramenta nenhuma que eu
conheça: **o aviso chega antes de gastar**, não depois.

---

## Decisões de desenho

**A régua é faixa, não tique** — mesmo vocabulário do contador de plataforma da
Fase 5, e pelo mesmo motivo: o número exato de uma estimativa não existe. A
hachura do estado "estouraria" é a mordida que a rodada daria.

**A estimativa é mediana das suas rodadas anteriores, por formato.** O log já
guarda `kind` e `usd`, então o dinheiro sai real. **O tempo não está guardado** —
falta um campo de duração no `CostEntry`. É pequeno, e é a diferença entre
"~2min40s" verdadeiro e um número inventado. Sem histórico (primeira vez), a tela
mostra preço de tabela e **diz** que é de tabela.

**Desenhado direto em 1900px**, com a coluna de leitura em 1280px. Sem artboard
pequeno, sem tradução — é o defeito que as Fases 1 e 2 cometeram e que a §4
registra.

**O sinal entra na faixa**, no mesmo lugar do "FILA NÃO CONFIGURADA". Reaproveita
o vocabulário em vez de inventar um segundo jeito de avisar.

**`accent` só como preenchimento da régua.** O número e o rótulo saem de tinta
legível — §18, escrita há três dias.

---

## Dois defeitos meus que a conferência pegou

**1. O botão desabilitado reprovava, nos dois temas.** Ele usava `faint` e mediu
**3,62:1 no claro** e **4,07:1 no escuro**. É o texto mais importante da tela
naquele estado — ele carrega o motivo de a geração estar parada. Foi para `mut`.

**2. Nenhum bloco de aviso aparecia, em estado nenhum.** Duas regras de
`display:none` com a mesma especificidade, e a segunda vencia. O aviso de estouro
— o elemento que justifica a fase inteira — estava invisível, e **o HTML lia
certo**. Só a captura mostrou. É o `.stage{display:flex}` vencendo o `hidden` da
§8, no meu próprio mock.

A prova de que o conserto pegou está na contagem: a medição passou de **374 para
398** porque elementos que estavam escondidos passaram a ser medidos.

**398 medições · 5 estados × 2 temas · todas no piso.**

---

## O que decide o escopo, e é sua palavra

**1. Teto local agora, ou esperar o servidor?**
A proposta é local. Se você quiser que o teto já nasça valendo para o agendado,
a fase muda de tamanho — precisa de onde contar o gasto no servidor, e isso é a
mesma peça que o multiusuário precisaria depois.

**2. "Confirmar e subir o teto" — ou bloquear seco?**
Desenhei com confirmação: estourar exige um clique consciente e o teto sobe junto.
A alternativa é não deixar passar de jeito nenhum. A primeira respeita que você é
o dono; a segunda protege melhor quem não é você.

**3. O teto zera no dia 1º, ou é janela móvel de 30 dias?**
Desenhei mês-calendário, que é como a tela de Custos já conta.

---

## Depois de aprovado

1. Campo de duração no `CostEntry` — sem ele "tempo estimado" é chute
2. Store do teto (mesmo padrão de `localKeys`, com herança de chave)
3. Célula 02/03 e a régua na tela de Custos
4. Linha de estimativa e o estado do botão na bancada
5. Sinal na faixa
6. Alvos declarados em `scripts/qa/contraste.mjs` — os cinco estados, os dois temas
7. `npm run qa` inteiro
