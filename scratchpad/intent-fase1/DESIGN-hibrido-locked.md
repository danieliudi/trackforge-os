# DESIGN — Fase 1 casca + Situação

<!-- Locked 2026-09-07 by Daniel: Hybrid Wire + Specimen -->

## Direction

**Hybrid Wire Service + Type Specimen Desk**

| Camada | Origem | O quê |
|---|---|---|
| Casca / nav | Wire Service | Masthead serif `trackforge`, `EDIÇÃO · {frente}`, dateline (cidade · mês), faixa preta LIVE + itens |
| Corpo Situação | Type Specimen Desk | Glifo gigante = prioridade ativa; ponto urgent; grade de células; lista tipográfica |
| Cola | Híbrido | Paper Wire + hierarquia Specimen; CTA preto sólido; empty dashed |

Mock aprovado: `scratchpad/intent-fase1/impeccable-hibrido-wire-specimen.html` (telas 01–07).

## Tokens (sessão)

```css
--paper: #f3efe6;
--ink: #16140f;
--muted: #5c574d;
--rule: #d8d1c3;
--urgent: #d63a22;
--band: #16140f; /* faixa LIVE */
/* ink / night */
--paper-ink: #12110f;
--ink-ink: #f2efe6;
```

Tipografia:
- Masthead / empty headline: Georgia (serif editorial)
- UI / nav / células / caption: Helvetica Neue / system sans
- Meta prova (wght/opsz): mono

## Shell behavior

- Frente ativa no masthead (`EDIÇÃO · Sanwey|Resibag|Meu`) — global, como hoje.
- Nav: Situação · Peças · (+) · Fatos · Custos · Instalação; LIVE como status, não como rota.
- Tema claro/escuro: paper ↔ ink; contraste AA nos dois.

## Situação (home)

1. Glifo = contagem da prioridade selecionada (fila CRM > não enviados > sem fonte > custo, conforme regra de produto).
2. Célula `.on` invertida espelha o glifo.
3. CRM off: callout honesto + glifo `0` quieto + empty “Nada pedindo decisão” + CTA Peças.
4. Erro de fila: faixa erro Wire no topo; corpo local continua.
5. Números na UI vêm de dados reais — nunca inventar contagens de mock.

## Fora desta fase

Interiores de Peças / Fatos / Custos / Instalação / Artigo / Editor — só herdam a casca; layout interno depois.

## Descarta

Night Desk · Catalog Sleeve · Nixie Bench · Wire puro · Specimen puro.
